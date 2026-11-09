import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, type FakeQuery, type FakeResult } from "./fake-supabase";

const sent: Array<{ name: string; data: unknown }> = [];
let adminHandler: (q: FakeQuery) => FakeResult = () => ({});
const admin = fakeSupabase((q) => adminHandler(q));

vi.mock("@/server/queue", () => ({
  sendEvent: vi.fn(async (name: string, data: unknown) => {
    sent.push({ name, data });
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: () => admin,
  createSupabaseServerClient: vi.fn(),
  createSupabaseAnonClient: vi.fn(),
}));

const { appRouter } = await import("@/server/root");
const { createCallerFactory } = await import("@/server/trpc");
const createCaller = createCallerFactory(appRouter);

const USER = { id: "11111111-1111-4111-8111-111111111111", email: "a@example.com" };
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";

const briefing = {
  skill: "Organizo o orçamento da família há 10 anos",
  audience: "Pessoas CLT sem controle do salário",
  format: "spreadsheet" as const,
  currency: "BRL" as const,
  language: "pt-BR" as const,
};

function callerWith(handler: (q: FakeQuery) => FakeResult) {
  const supabase = fakeSupabase(handler);
  return { caller: createCaller({ supabase: supabase as never, user: USER as never }), supabase };
}

beforeEach(() => {
  sent.length = 0;
  admin.queries.length = 0;
  adminHandler = (q) => (q.op === "update" ? { data: [{ id: PROJECT_ID }] } : {});
  process.env.INSTANCE_AI_KEY = "AIza-instance-test-key-000";
  delete process.env.GENERATION_HOURLY_LIMIT;
});

describe("offer creation flow (API)", () => {
  it("creates the project with the user's client and queues the agents", async () => {
    const { caller, supabase } = callerWith((q) => {
      if (q.table === "agent_runs") return { count: 0 };
      if (q.table === "projects" && q.op === "insert") {
        return { data: { id: PROJECT_ID, status: "draft", ai_provider: "instance" } };
      }
      return {};
    });

    const result = await caller.projects.create({ name: "Planilha", briefing, aiProvider: "instance", reviewEachStep: false });

    expect(result).toEqual({ id: PROJECT_ID });
    const insert = supabase.queries.find((q) => q.table === "projects" && q.op === "insert")!;
    expect(insert.payload).toMatchObject({ user_id: USER.id, name: "Planilha", ai_provider: "instance", briefing });
    // Status is flipped by the server (service role), guarded against double starts.
    const claim = admin.queries.find((q) => q.table === "projects" && q.op === "update")!;
    expect(claim.payload).toMatchObject({ status: "generating" });
    expect(claim.filters).toContainEqual(["neq", "status", "generating"]);
    expect(sent).toEqual([
      { name: "project/generation.requested", data: { projectId: PROJECT_ID, userId: USER.id, startFrom: undefined } },
    ]);
  });

  it("rejects oversized or incomplete briefings before touching the database", async () => {
    const { caller, supabase } = callerWith(() => ({}));
    await expect(
      caller.projects.create({ name: "X", briefing: { ...briefing, skill: "x".repeat(601) }, aiProvider: "instance", reviewEachStep: false }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      caller.projects.create({ name: "X", briefing: { ...briefing, audience: "" }, aiProvider: "instance", reviewEachStep: false }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(supabase.queries).toHaveLength(0);
    expect(sent).toHaveLength(0);
  });

  it("enforces the hourly rate limit", async () => {
    process.env.GENERATION_HOURLY_LIMIT = "5";
    const { caller } = callerWith((q) => (q.table === "agent_runs" ? { count: 5 } : {}));
    await expect(
      caller.projects.create({ name: "X", briefing, aiProvider: "instance", reviewEachStep: false }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(sent).toHaveLength(0);
  });

  it("requires a saved key when the project uses the user's own provider", async () => {
    const { caller } = callerWith((q) => (q.table === "agent_runs" ? { count: 0 } : q.table === "ai_keys" ? { data: null } : {}));
    await expect(
      caller.projects.create({ name: "X", briefing, aiProvider: "openai", reviewEachStep: false }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("refuses the free model when the instance has none", async () => {
    delete process.env.INSTANCE_AI_KEY;
    const { caller } = callerWith((q) => (q.table === "agent_runs" ? { count: 0 } : {}));
    await expect(
      caller.projects.create({ name: "X", briefing, aiProvider: "instance", reviewEachStep: false }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("does not start a second pipeline while one is running", async () => {
    const { caller } = callerWith((q) =>
      q.table === "projects" ? { data: { id: PROJECT_ID, status: "generating", ai_provider: "instance", briefing } } : {},
    );
    await expect(caller.projects.generate({ id: PROJECT_ID })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(sent).toHaveLength(0);
  });

  it("rejects deliverable edits that do not match the agent's schema", async () => {
    const { caller } = callerWith((q) =>
      q.table === "agent_runs" ? { data: { id: PROJECT_ID, agent: "researcher", status: "succeeded" } } : {},
    );
    await expect(caller.projects.editDeliverable({ runId: PROJECT_ID, output: { niche: "só isso" } })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("requires login", async () => {
    const caller = createCaller({ supabase: fakeSupabase(() => ({})) as never, user: null });
    await expect(caller.projects.list()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("AI keys API", () => {
  it("stores keys through the Vault RPC and returns only the last 4 digits", async () => {
    const rpc = vi.fn(async () => ({ data: [{ id: "k1", provider: "openai", last4: "WXYZ" }], error: null }));
    (admin as unknown as { rpc: typeof rpc }).rpc = rpc;
    const { caller } = callerWith(() => ({}));
    const saved = await caller.keys.save({ provider: "openai", key: "sk-test-ABCDEFGHWXYZ" });
    expect(saved).toEqual({ id: "k1", provider: "openai", last4: "WXYZ" });
    expect(JSON.stringify(saved)).not.toContain("ABCDEFGH");
    expect(rpc).toHaveBeenCalledWith("upsert_ai_key", { p_user_id: USER.id, p_provider: "openai", p_key: "sk-test-ABCDEFGHWXYZ" });
  });

  it("never echoes the key in validation errors", async () => {
    const { caller } = callerWith(() => ({}));
    const err = await caller.keys.save({ provider: "openai", key: "sk bad key with spaces" }).catch((e: Error) => e);
    expect(String((err as Error).message)).not.toContain("sk bad key");
  });
});

describe("publishing", () => {
  const page = (blocks: unknown, approved: boolean) => ({
    id: "p1",
    slug: "planilha",
    blocks,
    approved_at: approved ? "2026-11-09T12:00:00Z" : null,
    sentinel_report: null,
    published_at: null,
    updated_at: "2026-11-09T12:00:00Z",
  });
  const doc = {
    theme: { accent: "emerald", style: "clean" },
    checkoutUrl: "https://pay.example.com/abc",
    blocks: [{ type: "hero", headline: "Organize seu salário", subheadline: "Planilha simples", ctaLabel: "Quero" }],
  };

  it("refuses pages the Sentinel has not approved", async () => {
    const { caller } = callerWith((q) => (q.table === "pages" ? { data: page(doc, false) } : {}));
    await expect(caller.pages.publish({ projectId: PROJECT_ID })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(admin.queries.filter((q) => q.op === "update")).toHaveLength(0);
  });

  it("refuses income promises even on an approved page", async () => {
    const bad = { ...doc, blocks: [{ ...doc.blocks[0], headline: "Fature R$ 10 mil por mês" }] };
    const { caller } = callerWith((q) => (q.table === "pages" ? { data: page(bad, true) } : {}));
    await expect(caller.pages.publish({ projectId: PROJECT_ID })).rejects.toThrow(/Promises a specific amount/);
  });

  it("publishes the exact approved draft as a snapshot", async () => {
    adminHandler = (q) => (q.table === "pages" && q.op === "update" ? { data: [{ id: "p1" }] } : {});
    const { caller } = callerWith((q) => (q.table === "pages" ? { data: page(doc, true) } : {}));
    const res = await caller.pages.publish({ projectId: PROJECT_ID });
    expect(res.url).toContain("planilha");
    const update = admin.queries.find((q) => q.table === "pages" && q.op === "update")!;
    expect(update.payload).toMatchObject({ published_blocks: doc });
    expect(update.filters).toContainEqual(["eq", "updated_at", "2026-11-09T12:00:00Z"]);
  });
});
