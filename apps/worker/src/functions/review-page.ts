import { BriefingSchema, PageDocumentSchema, runPageReview } from "@honeymoney/agents";
import type { Json } from "@honeymoney/db";
import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import { resolveCaller } from "../keys";
import { createSupabaseStore } from "../store";
import { getAdminClient } from "../supabase";

/** Sentinel-only review after the user edits the page by hand. Required before publishing. */
export const reviewPage = inngest.createFunction(
  {
    id: "review-page",
    name: "Review edited page (Sentinel)",
    retries: 2,
    concurrency: [{ key: "event.data.userId", limit: 1 }],
  },
  { event: "page/review.requested" },
  async ({ event, step }) => {
    const admin = getAdminClient();
    const { projectId, userId } = event.data;

    const snapshot = await step.run("load", async () => {
      const [{ data: project }, { data: page }, { count }] = await Promise.all([
        admin.from("projects").select("briefing, ai_provider").eq("id", projectId).eq("user_id", userId).maybeSingle(),
        admin.from("pages").select("id, blocks, updated_at").eq("project_id", projectId).maybeSingle(),
        admin
          .from("agent_runs")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projectId)
          .eq("agent", "sentinel"),
      ]);
      if (!project || !page) throw new NonRetriableError("Project or page not found");
      return { project, page, round: Math.min((count ?? 0) + 1, 20) };
    });

    const briefing = BriefingSchema.safeParse(snapshot.project.briefing);
    const pageDoc = PageDocumentSchema.safeParse(snapshot.page.blocks);
    if (!briefing.success || !pageDoc.success) throw new NonRetriableError("Invalid briefing or page");

    const caller = await resolveCaller(admin, { user_id: userId, ai_provider: snapshot.project.ai_provider });
    const store = createSupabaseStore(admin, { id: projectId, user_id: userId }, caller.keySource);
    const deliverables = await step.run("load-deliverables", () => store.loadDeliverables());

    const report = await runPageReview({
      briefing: briefing.data,
      deliverables: { ...deliverables, designer: pageDoc.data },
      call: caller.call,
      secrets: caller.secrets,
      store,
      round: snapshot.round,
      runtime: { step: <T>(id: string, fn: () => Promise<T>) => step.run(id, fn) as unknown as Promise<T> },
    });

    await step.run("save-review", async () => {
      // Only approve the exact draft that was reviewed: if the user edited meanwhile, updated_at changed.
      const { error } = await admin
        .from("pages")
        .update({
          approved_at: report.approved ? new Date().toISOString() : null,
          sentinel_report: report as unknown as Json,
        })
        .eq("id", snapshot.page.id)
        .eq("updated_at", snapshot.page.updated_at);
      if (error) throw new Error(`save review: ${error.message}`);
    });

    return { approved: report.approved, issues: report.issues.length };
  },
);
