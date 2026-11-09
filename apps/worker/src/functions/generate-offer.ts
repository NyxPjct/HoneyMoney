import { BriefingSchema, CatalogReferenceSchema, runOfferPipeline, safeErrorMessage } from "@honeymoney/agents";
import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import { resolveCaller } from "../keys";
import { readLimits } from "../limits";
import { createSupabaseStore } from "../store";
import { getAdminClient } from "../supabase";

/** Expression Inngest uses to match the approval event to this run. */
export function approvalFilter(projectId: string, agent: string): string {
  const safe = (v: string) => v.replace(/[^a-zA-Z0-9-]/g, "");
  return `async.data.projectId == '${safe(projectId)}' && async.data.agent == '${safe(agent)}'`;
}

export const generateOffer = inngest.createFunction(
  {
    id: "generate-offer",
    name: "Generate offer (agent pipeline)",
    retries: 2,
    // One pipeline at a time per user keeps provider rate limits and costs predictable.
    concurrency: [{ key: "event.data.userId", limit: 1 }],
    cancelOn: [{ event: "project/generation.cancelled", match: "data.projectId" }],
    onFailure: async ({ event, error }) => {
      const { projectId } = event.data.event.data;
      await getAdminClient()
        .from("projects")
        .update({ status: "draft", awaiting_agent: null, last_error: safeErrorMessage(error) })
        .eq("id", projectId);
    },
  },
  { event: "project/generation.requested" },
  async ({ event, step }) => {
    const admin = getAdminClient();
    const { projectId, userId, startFrom } = event.data;

    const project = await step.run("load-project", async () => {
      const { data, error } = await admin
        .from("projects")
        .select("id, user_id, briefing, ai_provider, review_each_step, catalog_offer_id")
        .eq("id", projectId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw new Error(`load project: ${error.message}`);
      if (!data) throw new NonRetriableError("Project not found");

      let reference = null;
      if (data.catalog_offer_id) {
        const { data: offer } = await admin
          .from("catalog_offers")
          .select("name, format, niche, funnel, audience, pains")
          .eq("id", data.catalog_offer_id)
          .eq("is_published", true)
          .maybeSingle();
        const parsed = CatalogReferenceSchema.safeParse(offer);
        reference = parsed.success ? parsed.data : null;
      }
      return { ...data, reference };
    });

    const briefing = BriefingSchema.safeParse(project.briefing);
    if (!briefing.success) throw new NonRetriableError("Invalid briefing");

    if (project.ai_provider === "instance") {
      await step.run("check-free-model-limit", async () => {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count, error } = await admin
          .from("agent_runs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("key_source", "instance")
          .gte("created_at", since);
        if (error) throw new Error(`count runs: ${error.message}`);
        if ((count ?? 0) >= readLimits().instanceDailyRuns) {
          throw new NonRetriableError("Daily limit of the free model reached. Try tomorrow or add your own AI key.");
        }
      });
    }

    // Resolved on every invocation and kept in memory only: never returned from a step.
    const caller = await resolveCaller(admin, { user_id: userId, ai_provider: project.ai_provider });
    const store = createSupabaseStore(admin, { id: projectId, user_id: userId }, caller.keySource);

    return runOfferPipeline({
      briefing: briefing.data,
      reference: project.reference ?? undefined,
      call: caller.call,
      secrets: caller.secrets,
      store,
      startFrom,
      reviewEachStep: project.review_each_step,
      runtime: {
        step: <T>(id: string, fn: () => Promise<T>) => step.run(id, fn) as unknown as Promise<T>,
        waitForApproval: async (agent) => {
          const approval = await step.waitForEvent(`approval-${agent}`, {
            event: "project/step.approved",
            timeout: "7d",
            if: approvalFilter(projectId, agent),
          });
          return approval !== null;
        },
      },
    });
  },
);
