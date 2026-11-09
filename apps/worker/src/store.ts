import {
  type AgentName,
  DELIVERABLE_SCHEMAS,
  type Deliverables,
  type PageDocument,
  type PipelineStore,
  PageDocumentSchema,
  RESERVED_SLUGS,
  slugify,
} from "@honeymoney/agents";
import type { Json, Tables } from "@honeymoney/db";
import type { AdminClient } from "./supabase";

type RunRow = Pick<Tables<"agent_runs">, "agent" | "status" | "output" | "edited_output" | "created_at">;

const USABLE_STATUSES = new Set(["succeeded", "changes_requested", "needs_input"]);

/**
 * Latest usable deliverable per agent: newest successful run wins, and the user's edit wins
 * over the model's output. Anything that no longer validates is ignored.
 */
export function pickLatestDeliverables(rows: readonly RunRow[]): Partial<Deliverables> {
  const sorted = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const out: Partial<Record<AgentName, unknown>> = {};
  for (const row of sorted) {
    if (out[row.agent] !== undefined || !USABLE_STATUSES.has(row.status)) continue;
    const value = row.edited_output ?? row.output;
    const parsed = DELIVERABLE_SCHEMAS[row.agent].safeParse(value);
    if (parsed.success) out[row.agent] = parsed.data;
  }
  return out as Partial<Deliverables>;
}

export function slugCandidates(productName: string, random: () => string): string[] {
  const base = slugify(productName);
  const first = RESERVED_SLUGS.has(base) ? `${base}-oferta` : base;
  return [first, ...Array.from({ length: 4 }, () => `${base.slice(0, 40)}-${random()}`)];
}

const randomSuffix = () => Math.random().toString(36).slice(2, 6);

/** Keeps the checkout link the user already configured when the Designer regenerates the page. */
export function mergePage(generated: PageDocument, existing: unknown): PageDocument {
  const prev = PageDocumentSchema.safeParse(existing);
  return { ...generated, checkoutUrl: prev.success ? prev.data.checkoutUrl : "" };
}

export function createSupabaseStore(
  admin: AdminClient,
  project: { id: string; user_id: string },
  keySource: "user" | "instance",
): PipelineStore {
  const fail = (what: string, error: { message: string } | null) => {
    if (error) throw new Error(`${what}: ${error.message}`);
  };

  return {
    async loadDeliverables() {
      const { data, error } = await admin
        .from("agent_runs")
        .select("agent, status, output, edited_output, created_at")
        .eq("project_id", project.id)
        .order("created_at", { ascending: false })
        .limit(200);
      fail("load deliverables", error);
      return pickLatestDeliverables(data ?? []);
    },

    async startRun({ agent, round, promptVersion, input }) {
      const { data, error } = await admin
        .from("agent_runs")
        .insert({
          project_id: project.id,
          user_id: project.user_id,
          agent,
          round,
          prompt_version: promptVersion,
          input: input as Json,
          status: "running",
          key_source: keySource,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      fail("start run", error);
      return data!.id;
    },

    async finishRun(runId, result) {
      const { error } = await admin
        .from("agent_runs")
        .update({
          status: result.status,
          output: (result.output ?? null) as Json,
          input_tokens: result.usage?.inputTokens ?? null,
          output_tokens: result.usage?.outputTokens ?? null,
          error: result.error ?? null,
          finished_at: new Date().toISOString(),
        })
        .eq("id", runId);
      fail("finish run", error);
    },

    async setProject(update) {
      const patch: { status?: "draft" | "generating" | "review"; awaiting_agent?: AgentName | null; last_error?: string | null } = {};
      if (update.status !== undefined) patch.status = update.status;
      if (update.awaitingAgent !== undefined) patch.awaiting_agent = update.awaitingAgent;
      if (update.lastError !== undefined) patch.last_error = update.lastError;
      const { error } = await admin.from("projects").update(patch).eq("id", project.id);
      fail("update project", error);
    },

    async saveResult({ offer, copy, page, report }) {
      const { data: last, error: lastErr } = await admin
        .from("offer_versions")
        .select("version")
        .eq("project_id", project.id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      fail("read versions", lastErr);
      const version = (last?.version ?? 0) + 1;

      const { error: insErr } = await admin.from("offer_versions").insert({
        project_id: project.id,
        user_id: project.user_id,
        version,
        promise: offer.promise,
        structure: offer as unknown as Json,
        copy: copy as unknown as Json,
        sentinel_report: report as unknown as Json,
      });
      fail("save version", insErr);

      const approvedAt = report.approved ? new Date().toISOString() : null;
      const { data: existing, error: pageErr } = await admin
        .from("pages")
        .select("id, blocks")
        .eq("project_id", project.id)
        .maybeSingle();
      fail("read page", pageErr);

      if (existing) {
        const { error } = await admin
          .from("pages")
          .update({
            blocks: mergePage(page, existing.blocks) as unknown as Json,
            approved_at: approvedAt,
            sentinel_report: report as unknown as Json,
          })
          .eq("id", existing.id);
        fail("update page", error);
      } else {
        let inserted = false;
        for (const slug of slugCandidates(offer.productName, randomSuffix)) {
          const { error } = await admin.from("pages").insert({
            project_id: project.id,
            user_id: project.user_id,
            slug,
            blocks: page as unknown as Json,
            approved_at: approvedAt,
            sentinel_report: report as unknown as Json,
          });
          if (!error) {
            inserted = true;
            break;
          }
          if (error.code !== "23505") fail("create page", error);
        }
        if (!inserted) throw new Error("create page: could not find a free slug");
      }

      const { error: projErr } = await admin
        .from("projects")
        .update({ status: "review", awaiting_agent: null, last_error: null })
        .eq("id", project.id);
      fail("finish project", projErr);
      return { version };
    },
  };
}
