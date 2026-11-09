import { describe, expect, it } from "vitest";
import {
  type AgentName,
  type Deliverables,
  MAX_REVISION_ROUNDS,
  type PipelineRuntime,
  type PipelineStore,
  runOfferPipeline,
  runPageReview,
  type SentinelReport,
} from "../src";
import { audience, briefing, copy, fakeModel, happyResponses, offer, page } from "./fixtures";

type Run = { id: string; agent: AgentName; round: number; status: string; output?: unknown; input: unknown };

function memoryStore(initial: Partial<Deliverables> = {}) {
  const runs: Run[] = [];
  const projectUpdates: Array<Record<string, unknown>> = [];
  const results: Array<Parameters<PipelineStore["saveResult"]>[0]> = [];
  const deliverables: Partial<Deliverables> = { ...initial };
  const store: PipelineStore = {
    async loadDeliverables() {
      return { ...deliverables };
    },
    async startRun({ agent, round, input }) {
      const id = `run-${runs.length + 1}`;
      runs.push({ id, agent, round, status: "running", input });
      return id;
    },
    async finishRun(runId, result) {
      const run = runs.find((r) => r.id === runId)!;
      run.status = result.status;
      run.output = result.output;
      if (result.output && result.status !== "failed") {
        (deliverables as Record<string, unknown>)[run.agent] = result.output;
      }
    },
    async setProject(update) {
      projectUpdates.push(update);
    },
    async saveResult(args) {
      results.push(args);
      return { version: results.length };
    },
  };
  return { store, runs, projectUpdates, results, deliverables };
}

const plainRuntime = (stepIds: string[] = []): PipelineRuntime => ({
  step: async (id, fn) => {
    stepIds.push(id);
    return fn();
  },
});

describe("offer creation flow", () => {
  it("runs every agent in order, reviews, and saves a version", async () => {
    const mem = memoryStore();
    const call = fakeModel(happyResponses());
    const outcome = await runOfferPipeline({ briefing, call, store: mem.store, runtime: plainRuntime() });

    expect(outcome).toMatchObject({ status: "completed", approved: true, version: 1 });
    expect(mem.runs.map((r) => r.agent)).toEqual([
      "manager",
      "researcher",
      "strategist",
      "copywriter",
      "designer",
      "sentinel",
    ]);
    expect(mem.runs.every((r) => r.status === "succeeded")).toBe(true);
    expect(mem.results[0]).toMatchObject({ offer, copy, page: { ...page, checkoutUrl: "" } });
    expect(mem.projectUpdates[0]).toEqual({ status: "generating", awaitingAgent: null, lastError: null });
  });

  it("each agent receives the previous deliverables as delimited data", async () => {
    const mem = memoryStore();
    const call = fakeModel(happyResponses());
    await runOfferPipeline({ briefing, call, store: mem.store, runtime: plainRuntime() });
    const copywriterPrompt = call.calls[3]!.prompt;
    expect(copywriterPrompt).toContain('<data name="audience_map">');
    expect(copywriterPrompt).toContain('<data name="offer">');
    expect(copywriterPrompt).toContain(offer.productName);
  });

  it("sends Sentinel blockers back only to the responsible agent (and what depends on it)", async () => {
    const rejected: SentinelReport = {
      approved: false,
      summary: "A copy promete renda.",
      issues: [
        {
          agent: "copywriter",
          severity: "blocker",
          category: "income_claim",
          location: "copy.headline",
          problem: "Promete renda",
          suggestion: "Remova",
        },
        {
          agent: "designer",
          severity: "warning",
          category: "other",
          location: "page",
          problem: "Cor",
          suggestion: "Troque",
        },
      ],
    };
    const responses = { ...happyResponses(), sentinel: [rejected, { approved: true, summary: "Ok", issues: [] }] };
    const mem = memoryStore();
    const call = fakeModel(responses);
    const outcome = await runOfferPipeline({ briefing, call, store: mem.store, runtime: plainRuntime() });

    expect(outcome).toMatchObject({ status: "completed", approved: true });
    expect(mem.runs.map((r) => `${r.agent}:${r.round}`)).toEqual([
      "manager:1",
      "researcher:1",
      "strategist:1",
      "copywriter:1",
      "designer:1",
      "sentinel:1",
      "copywriter:2",
      "designer:2",
      "sentinel:2",
    ]);
    expect(mem.runs[5]!.status).toBe("changes_requested");
    const revisedPrompt = call.calls.filter((c) => /You are "Copywriter"/.test(c.system))[1]!.prompt;
    expect(revisedPrompt).toMatch(/Revision requested by the Sentinel/);
    expect(revisedPrompt).toMatch(/Promete renda/);
  });

  it("deterministic rules block an income promise even if the model approves it", async () => {
    const badCopy = { ...copy, headline: "Fature R$ 10 mil por mês com uma planilha" };
    const responses = { ...happyResponses(), copywriter: [badCopy, copy] };
    const mem = memoryStore();
    const outcome = await runOfferPipeline({ briefing, call: fakeModel(responses), store: mem.store, runtime: plainRuntime() });
    expect(outcome).toMatchObject({ status: "completed", approved: true });
    const firstReview = mem.runs.find((r) => r.agent === "sentinel")!;
    expect(firstReview.status).toBe("changes_requested");
    expect((firstReview.output as SentinelReport).issues[0]).toMatchObject({
      agent: "copywriter",
      category: "income_claim",
    });
  });

  it(`stops after ${MAX_REVISION_ROUNDS} revision rounds and leaves the decision to the user`, async () => {
    const alwaysBad = { ...copy, headline: "Ganhe R$ 300 por dia" };
    const responses = { ...happyResponses(), copywriter: [alwaysBad] };
    const mem = memoryStore();
    const outcome = await runOfferPipeline({ briefing, call: fakeModel(responses), store: mem.store, runtime: plainRuntime() });
    expect(outcome).toMatchObject({ status: "completed", approved: false });
    expect(mem.runs.filter((r) => r.agent === "sentinel")).toHaveLength(MAX_REVISION_ROUNDS + 1);
    expect(mem.results).toHaveLength(1);
  });

  it("pauses for the user when the Manager needs information", async () => {
    const mem = memoryStore();
    const responses = {
      manager: [{ status: "needs_info", summary: "Falta público", questions: ["Quem é o seu público?"], rejectionReason: null }],
    };
    const outcome = await runOfferPipeline({ briefing, call: fakeModel(responses), store: mem.store, runtime: plainRuntime() });
    expect(outcome).toEqual({ status: "needs_info", questions: ["Quem é o seu público?"] });
    expect(mem.runs.map((r) => [r.agent, r.status])).toEqual([["manager", "needs_input"]]);
    expect(mem.projectUpdates.at(-1)).toEqual({ status: "draft" });
  });

  it("re-runs from a later step using the user's edited deliverables", async () => {
    const edited = { ...offer, productName: "Nome editado pelo usuário" };
    const mem = memoryStore({ researcher: audience, strategist: edited });
    const call = fakeModel(happyResponses());
    const outcome = await runOfferPipeline({
      briefing,
      call,
      store: mem.store,
      runtime: plainRuntime(),
      startFrom: "copywriter",
    });
    expect(outcome.status).toBe("completed");
    expect(mem.runs.map((r) => r.agent)).toEqual(["copywriter", "designer", "sentinel"]);
    expect(call.calls[0]!.prompt).toContain("Nome editado pelo usuário");
  });

  it("in review-each-step mode waits for approval and picks up edits", async () => {
    const mem = memoryStore();
    const waited: AgentName[] = [];
    const runtime: PipelineRuntime = {
      step: async (_id, fn) => fn(),
      waitForApproval: async (agent) => {
        waited.push(agent);
        if (agent === "strategist") {
          (mem.deliverables as Record<string, unknown>).strategist = { ...offer, productName: "Editado" };
        }
        return true;
      },
    };
    const call = fakeModel(happyResponses());
    await runOfferPipeline({ briefing, call, store: mem.store, runtime, reviewEachStep: true });
    expect(waited).toEqual(["researcher", "strategist", "copywriter", "designer"]);
    const copywriterPrompt = call.calls.find((c) => /You are "Copywriter"/.test(c.system))!.prompt;
    expect(copywriterPrompt).toContain("Editado");
    expect(mem.projectUpdates).toContainEqual({ awaitingAgent: "strategist" });
  });

  it("stops when the user does not approve in time", async () => {
    const mem = memoryStore();
    const runtime: PipelineRuntime = { step: async (_id, fn) => fn(), waitForApproval: async () => false };
    const outcome = await runOfferPipeline({
      briefing,
      call: fakeModel(happyResponses()),
      store: mem.store,
      runtime,
      reviewEachStep: true,
    });
    expect(outcome).toEqual({ status: "stopped", agent: "researcher" });
  });

  it("records failures with secrets redacted and rethrows for the queue to retry", async () => {
    const mem = memoryStore();
    const failing = async () => {
      throw new Error("401 invalid api key sk-abcdefghijklmnop1234");
    };
    await expect(
      runOfferPipeline({ briefing, call: failing, store: mem.store, runtime: plainRuntime() }),
    ).rejects.toThrow();
    const failed = mem.runs.find((r) => r.status === "failed");
    expect(failed?.agent).toBe("manager");
    const lastError = mem.projectUpdates.find((u) => "lastError" in u && u.lastError)?.lastError as string;
    expect(lastError).toContain("[redacted]");
    expect(lastError).not.toContain("sk-abcdefghijklmnop1234");
  });

  it("uses unique, deterministic step ids (required for durable retries)", async () => {
    const ids: string[] = [];
    const responses = {
      ...happyResponses(),
      sentinel: [
        {
          approved: false,
          summary: "x",
          issues: [{ agent: "strategist", severity: "blocker", category: "other", location: "offer", problem: "p", suggestion: "s" }],
        },
        { approved: true, summary: "ok", issues: [] },
      ],
    };
    await runOfferPipeline({ briefing, call: fakeModel(responses), store: memoryStore().store, runtime: plainRuntime(ids) });
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("strategist-r2");
    expect(ids).toContain("sentinel-r2");
  });
});

describe("page re-review", () => {
  it("reviews hand-edited pages and blocks unsafe edits", async () => {
    const mem = memoryStore();
    const editedPage = {
      ...page,
      blocks: [...page.blocks, { type: "text" as const, title: "Resultados", text: "Perca 8 kg em 2 semanas" }],
    };
    const report = await runPageReview({
      briefing,
      deliverables: { strategist: offer, copywriter: copy, designer: editedPage },
      call: fakeModel({ sentinel: [{ approved: true, summary: "ok", issues: [] }] }),
      store: mem.store,
      runtime: plainRuntime(),
      round: 1,
    });
    expect(report.approved).toBe(false);
    expect(report.issues[0]).toMatchObject({ agent: "designer", category: "health_claim" });
    expect(mem.runs[0]!.status).toBe("changes_requested");
  });
});
