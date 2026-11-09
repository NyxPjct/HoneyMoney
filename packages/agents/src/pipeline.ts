import { copywriter, designer, manager, researcher, sentinel, strategist } from "./agents";
import type { RevisionNotes } from "./agents/revision";
import { safeErrorMessage } from "./errors";
import { runAgent } from "./run-agent";
import type {
  Briefing,
  CatalogReference,
  Deliverables,
  ManagerOutput,
  SentinelIssue,
  SentinelReport,
} from "./schemas";
import type { AgentDefinition, AgentName, ModelCaller, Usage } from "./types";

/** Agents that run in sequence before the Sentinel review. */
export const PIPELINE_ORDER = ["manager", "researcher", "strategist", "copywriter", "designer"] as const;
export type PipelineAgent = (typeof PIPELINE_ORDER)[number];

/** How many times the Sentinel may send work back before it goes to the user for manual fixes. */
export const MAX_REVISION_ROUNDS = 2;

export type RunStatus = "succeeded" | "failed" | "needs_input" | "changes_requested";

/** Persistence for the pipeline. The worker implements it with Supabase; tests use memory. */
export interface PipelineStore {
  /** Latest usable deliverable per agent (user edits win over the raw model output). */
  loadDeliverables(): Promise<Partial<Deliverables>>;
  startRun(args: { agent: AgentName; round: number; promptVersion: string; input: unknown }): Promise<string>;
  finishRun(
    runId: string,
    result: { status: RunStatus; output?: unknown; usage?: Usage; error?: string },
  ): Promise<void>;
  setProject(update: {
    status?: "draft" | "generating" | "review";
    awaitingAgent?: AgentName | null;
    lastError?: string | null;
  }): Promise<void>;
  saveResult(args: {
    offer: Deliverables["strategist"];
    copy: Deliverables["copywriter"];
    page: Deliverables["designer"];
    report: SentinelReport;
  }): Promise<{ version: number }>;
}

/** Durable-execution hooks. Inngest's `step.run` / `step.waitForEvent` in production; plain calls in tests. */
export interface PipelineRuntime {
  step<T>(id: string, fn: () => Promise<T>): Promise<T>;
  /** Resolves true when the user approves the deliverable, false on timeout. */
  waitForApproval?(agent: AgentName): Promise<boolean>;
}

export type PipelineOptions = {
  briefing: Briefing;
  reference?: CatalogReference;
  referenceTexts?: string[];
  call: ModelCaller;
  store: PipelineStore;
  runtime: PipelineRuntime;
  /** Re-run from this agent, reusing (possibly edited) earlier deliverables. */
  startFrom?: PipelineAgent;
  reviewEachStep?: boolean;
  /** Secrets to scrub from any error message that gets stored. */
  secrets?: string[];
};

export type PipelineOutcome =
  | { status: "needs_info"; questions: string[] }
  | { status: "rejected"; reason: string }
  | { status: "stopped"; agent: AgentName }
  | { status: "completed"; approved: boolean; version: number; report: SentinelReport };

type AnyAgent = AgentDefinition<unknown, unknown>;

const DEFINITIONS: Record<AgentName, AnyAgent> = {
  manager: manager as AnyAgent,
  researcher: researcher as AnyAgent,
  strategist: strategist as AnyAgent,
  copywriter: copywriter as AnyAgent,
  designer: designer as AnyAgent,
  sentinel: sentinel as AnyAgent,
};

function runStatusFor(agent: AgentName, output: unknown): RunStatus {
  if (agent === "manager" && (output as ManagerOutput).status !== "ready") return "needs_input";
  if (agent === "sentinel" && !(output as SentinelReport).approved) return "changes_requested";
  return "succeeded";
}

function requireDeliverable<K extends keyof Deliverables>(d: Partial<Deliverables>, key: K): Deliverables[K] {
  const value = d[key];
  if (!value) throw new Error(`Missing deliverable from ${key}; run the pipeline from an earlier step.`);
  return value;
}

/** Input each agent receives, built from the briefing and earlier deliverables. */
export function buildAgentInput(
  agent: AgentName,
  ctx: { briefing: Briefing; reference?: CatalogReference; referenceTexts?: string[] },
  d: Partial<Deliverables>,
  revision?: RevisionNotes,
): unknown {
  const { briefing, reference } = ctx;
  switch (agent) {
    case "manager":
      return { briefing };
    case "researcher":
      return { briefing, reference, revision };
    case "strategist":
      return { briefing, reference, audience: requireDeliverable(d, "researcher"), revision };
    case "copywriter":
      return {
        briefing,
        audience: requireDeliverable(d, "researcher"),
        offer: requireDeliverable(d, "strategist"),
        revision,
      };
    case "designer":
      return {
        briefing,
        offer: requireDeliverable(d, "strategist"),
        copy: requireDeliverable(d, "copywriter"),
        revision,
      };
    case "sentinel":
      return {
        briefing,
        reference,
        referenceTexts: ctx.referenceTexts,
        audience: d.researcher,
        offer: d.strategist,
        copy: d.copywriter,
        page: d.designer,
      };
  }
}

/** Which agent's work must be redone, earliest first, for the blockers in a report. */
export function agentsToRevise(report: SentinelReport): PipelineAgent[] {
  const blocked = new Set(report.issues.filter((i) => i.severity === "blocker").map((i) => i.agent));
  return PIPELINE_ORDER.filter((a) => blocked.has(a as SentinelIssue["agent"]));
}

export async function runOfferPipeline(options: PipelineOptions): Promise<PipelineOutcome> {
  const { store, runtime, call } = options;
  const ctx = { briefing: options.briefing, reference: options.reference, referenceTexts: options.referenceTexts };

  const execute = async (agent: AgentName, input: unknown, round: number): Promise<unknown> =>
    runtime.step(`${agent}-r${round}`, async () => {
      const def = DEFINITIONS[agent];
      const runId = await store.startRun({ agent, round, promptVersion: def.version, input });
      try {
        const result = await runAgent(def, input, call);
        await store.finishRun(runId, {
          status: runStatusFor(agent, result.output),
          output: result.output,
          usage: result.usage,
        });
        return result.output;
      } catch (err) {
        const message = safeErrorMessage(err, options.secrets);
        await store.finishRun(runId, { status: "failed", error: message });
        await store.setProject({ lastError: message });
        throw err;
      }
    });

  const startIndex = options.startFrom ? PIPELINE_ORDER.indexOf(options.startFrom) : 0;
  let d: Partial<Deliverables> = {};
  if (startIndex > 0) {
    d = await runtime.step("load-deliverables", () => store.loadDeliverables());
  }
  await runtime.step("mark-generating", () =>
    store.setProject({ status: "generating", awaitingAgent: null, lastError: null }),
  );

  for (let i = startIndex; i < PIPELINE_ORDER.length; i++) {
    const agent = PIPELINE_ORDER[i]!;
    const output = await execute(agent, buildAgentInput(agent, ctx, d), 1);

    if (agent === "manager") {
      const m = output as ManagerOutput;
      if (m.status !== "ready") {
        await runtime.step("manager-stop", () => store.setProject({ status: "draft" }));
        return m.status === "needs_info"
          ? { status: "needs_info", questions: m.questions }
          : { status: "rejected", reason: m.rejectionReason ?? m.summary };
      }
      continue;
    }

    (d as Record<string, unknown>)[agent] = output;

    if (options.reviewEachStep && runtime.waitForApproval) {
      await runtime.step(`await-${agent}`, () => store.setProject({ awaitingAgent: agent }));
      const approved = await runtime.waitForApproval(agent);
      if (!approved) {
        await runtime.step(`timeout-${agent}`, () => store.setProject({ status: "draft", awaitingAgent: null }));
        return { status: "stopped", agent };
      }
      // Pick up anything the user edited while reviewing.
      d = { ...d, ...(await runtime.step(`reload-${agent}`, () => store.loadDeliverables())) };
      await runtime.step(`resume-${agent}`, () => store.setProject({ awaitingAgent: null }));
    }
  }

  let report!: SentinelReport;
  for (let round = 1; ; round++) {
    report = (await execute("sentinel", buildAgentInput("sentinel", ctx, d), round)) as SentinelReport;
    if (report.approved || round > MAX_REVISION_ROUNDS) break;

    const targets = agentsToRevise(report);
    const first = targets[0];
    if (!first) break;
    // Redo the responsible agent and everything that consumes its deliverable.
    for (let i = PIPELINE_ORDER.indexOf(first); i < PIPELINE_ORDER.length; i++) {
      const agent = PIPELINE_ORDER[i]!;
      const issues = report.issues.filter((x) => x.agent === agent);
      const revision: RevisionNotes | undefined = issues.length
        ? { issues, previous: (d as Record<string, unknown>)[agent] }
        : undefined;
      (d as Record<string, unknown>)[agent] = await execute(agent, buildAgentInput(agent, ctx, d, revision), round + 1);
    }
  }

  const saved = await runtime.step("save-result", () =>
    store.saveResult({
      offer: requireDeliverable(d, "strategist"),
      copy: requireDeliverable(d, "copywriter"),
      page: requireDeliverable(d, "designer"),
      report,
    }),
  );

  return { status: "completed", approved: report.approved, version: saved.version, report };
}

/** Sentinel-only review, used after the user edits the page by hand. */
export async function runPageReview(options: {
  briefing: Briefing;
  deliverables: Partial<Deliverables>;
  call: ModelCaller;
  store: Pick<PipelineStore, "startRun" | "finishRun">;
  runtime: PipelineRuntime;
  round: number;
  secrets?: string[];
}): Promise<SentinelReport> {
  const input = buildAgentInput("sentinel", { briefing: options.briefing }, options.deliverables);
  return options.runtime.step(`sentinel-review-r${options.round}`, async () => {
    const runId = await options.store.startRun({
      agent: "sentinel",
      round: options.round,
      promptVersion: sentinel.version,
      input,
    });
    try {
      const result = await runAgent(sentinel, input as Parameters<typeof sentinel.buildPrompt>[0], options.call);
      await options.store.finishRun(runId, {
        status: result.output.approved ? "succeeded" : "changes_requested",
        output: result.output,
        usage: result.usage,
      });
      return result.output;
    } catch (err) {
      await options.store.finishRun(runId, { status: "failed", error: safeErrorMessage(err, options.secrets) });
      throw err;
    }
  });
}
