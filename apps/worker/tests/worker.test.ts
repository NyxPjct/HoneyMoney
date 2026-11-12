import { describe, expect, it } from "vitest";
import { approvalFilter } from "../src/functions/generate-offer";
import { resolveCaller } from "../src/keys";
import { readLimits } from "../src/limits";
import { mergePage, pickLatestDeliverables, slugCandidates } from "../src/store";
import type { AdminClient } from "../src/supabase";

const audience = {
  niche: "Finanças",
  subNiche: "CLT",
  audienceProfile: "Perfil",
  pains: ["a", "b", "c"],
  desires: ["d", "e"],
  objections: ["f", "g"],
  awarenessLevel: "problem_aware",
  vocabulary: [],
};

const row = (agent: string, status: string, created_at: string, output: unknown, edited_output: unknown = null) =>
  ({ agent, status, created_at, output, edited_output }) as never;

describe("pickLatestDeliverables", () => {
  it("prefers the newest usable run and the user's edit over the model output", () => {
    const edited = { ...audience, niche: "Editado" };
    const d = pickLatestDeliverables([
      row("researcher", "succeeded", "2026-11-09T10:00:00Z", { ...audience, niche: "Velho" }),
      row("researcher", "succeeded", "2026-11-09T11:00:00Z", audience, edited),
      row("researcher", "failed", "2026-11-09T12:00:00Z", null),
    ]);
    expect(d.researcher?.niche).toBe("Editado");
  });

  it("ignores deliverables that no longer validate", () => {
    const d = pickLatestDeliverables([
      row("researcher", "succeeded", "2026-11-09T11:00:00Z", audience, { broken: true }),
    ]);
    expect(d.researcher).toBeUndefined();
  });
});

describe("pages", () => {
  it("builds valid, non-reserved slug candidates", () => {
    const slugs = slugCandidates("Planilha Salário no Controle!", () => "ab12");
    expect(slugs[0]).toBe("planilha-salario-no-controle");
    expect(slugs[1]).toBe("planilha-salario-no-controle-ab12");
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/);
    expect(slugCandidates("Admin", () => "x1y2")[0]).toBe("admin-oferta");
  });

  it("keeps the checkout link the user configured when the page is regenerated", () => {
    const generated = {
      theme: { accent: "sky", style: "clean" },
      checkoutUrl: "",
      blocks: [{ type: "cta", headline: "Compre", ctaLabel: "Comprar" }],
    } as const;
    const previous = { ...generated, checkoutUrl: "https://pay.example.com/abc" };
    expect(mergePage(structuredClone(generated) as never, previous).checkoutUrl).toBe("https://pay.example.com/abc");
    expect(mergePage(structuredClone(generated) as never, []).checkoutUrl).toBe("");
  });
});

describe("queue helpers", () => {
  it("builds an approval filter that cannot be injected", () => {
    expect(approvalFilter("123e4567-e89b-12d3-a456-426614174000", "copywriter")).toBe(
      "async.data.projectId == '123e4567-e89b-12d3-a456-426614174000' && async.data.agent == 'copywriter'",
    );
    expect(approvalFilter("x' || true || '", "a")).not.toContain("'x' ||");
  });

  it("reads limits from the environment with safe defaults", () => {
    expect(readLimits({})).toEqual({ hourlyRuns: 60, instanceDailyRuns: 40 });
    expect(readLimits({ GENERATION_HOURLY_LIMIT: "10", INSTANCE_DAILY_RUN_LIMIT: "abc" })).toEqual({
      hourlyRuns: 10,
      instanceDailyRuns: 40,
    });
  });
});

describe("resolveCaller", () => {
  const noDb = {} as AdminClient;

  it("refuses the free model when the instance has none configured", async () => {
    await expect(resolveCaller(noDb, { user_id: "u", ai_provider: "instance" }, {})).rejects.toThrow(/no free model/);
  });

  it("uses the instance key for the free model and marks it for redaction", async () => {
    const caller = await resolveCaller(
      noDb,
      { user_id: "u", ai_provider: "instance" },
      { INSTANCE_AI_PROVIDER: "google", INSTANCE_AI_KEY: "AIza-instance-key-123456" },
    );
    expect(caller.keySource).toBe("instance");
    expect(caller.secrets).toEqual(["AIza-instance-key-123456"]);
  });

  it("loads the user's key through the service-only RPC", async () => {
    const calls: unknown[] = [];
    const admin = {
      rpc: async (fn: string, args: unknown) => {
        calls.push([fn, args]);
        return { data: "sk-user-key-abcdefgh", error: null };
      },
    } as unknown as AdminClient;
    const caller = await resolveCaller(admin, { user_id: "u1", ai_provider: "openai" }, {});
    expect(calls).toEqual([["get_ai_key", { p_user_id: "u1", p_provider: "openai" }]]);
    expect(caller.keySource).toBe("user");
    expect(caller.secrets).toEqual(["sk-user-key-abcdefgh"]);
  });

  it("fails clearly when the user has no key for the project's provider", async () => {
    const admin = { rpc: async () => ({ data: null, error: null }) } as unknown as AdminClient;
    await expect(resolveCaller(admin, { user_id: "u1", ai_provider: "anthropic" }, {})).rejects.toThrow(
      /No anthropic key saved/,
    );
  });
});

describe("inngestEnv", () => {
  it("prefers the standard name and accepts integration-prefixed keys", async () => {
    const { inngestEnv } = await import("../src/inngest-env");
    expect(inngestEnv("INNGEST_EVENT_KEY", { INNGEST_EVENT_KEY: "std", HONEY_MONEY_INNGEST_EVENT_KEY: "pre" })).toBe("std");
    expect(inngestEnv("INNGEST_SIGNING_KEY", { HONEY_MONEY_INNGEST_SIGNING_KEY: "signkey-123" })).toBe("signkey-123");
    expect(inngestEnv("INNGEST_SIGNING_KEY", { HONEY_MONEY_INNGEST_SIGNING_KEY_FALLBACK: "x" })).toBeUndefined();
    expect(inngestEnv("INNGEST_EVENT_KEY", { INNGEST_EVENT_KEY: "  " })).toBeUndefined();
  });
});
