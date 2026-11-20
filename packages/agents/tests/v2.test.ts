import { APICallError, RetryError } from "ai";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { guaranteeDays, polishPage } from "../src/agents/designer";
import { createModelCaller, instanceModelConfig, isOverloaded } from "../src/providers";
import { buildSystemPrompt } from "../src/run-agent";
import { copywriter, designer } from "../src/agents";
import { CopySchema, DELIVERABLE_SCHEMAS, PageDocumentSchema } from "../src/schemas";
import { schemaSkeleton } from "../src/skeleton";
import { copy, offer, page } from "./fixtures";

describe("prompt v2", () => {
  it("shows the model a concrete example of the answer, with braces for objects in arrays", () => {
    const example = schemaSkeleton(z.toJSONSchema(CopySchema) as never) as { salesPage: { faq: unknown[] } };
    expect(example.salesPage.faq).toEqual([{ question: "<text, max 200 chars>", answer: "<text, max 600 chars>" }]);
    const system = buildSystemPrompt(copywriter as never);
    expect(system).toContain("Shape of the answer");
    expect(system).toContain("Copywriting playbook");
  });

  it("shows one example of every page block type", () => {
    const example = schemaSkeleton(z.toJSONSchema(PageDocumentSchema) as never) as { blocks: { type: string }[] };
    expect(example.blocks.map((b) => b.type)).toEqual(
      expect.arrayContaining(["hero", "highlight", "comparison", "steps", "author", "price", "guarantee", "cta"]),
    );
    expect(buildSystemPrompt(designer as never)).toContain("Sales page design playbook");
  });
});

describe("backward compatibility", () => {
  it("still accepts deliverables and pages created by the v1 prompts", () => {
    const { triggers: _t, failedAttempts: _f, ...v1Audience } = DELIVERABLE_SCHEMAS.researcher.parse({
      niche: "Finanças",
      subNiche: "CLT",
      audienceProfile: "Perfil",
      pains: ["a", "b", "c"],
      desires: ["a", "b"],
      objections: ["a", "b"],
      awarenessLevel: "problem_aware",
      vocabulary: [],
    });
    expect(v1Audience.niche).toBe("Finanças");
    const { bigIdea: _b, transformation: _tr, ...v1Offer } = offer;
    expect(DELIVERABLE_SCHEMAS.strategist.safeParse(v1Offer).success).toBe(true);
    const v1Page = { theme: { accent: "amber", style: "clean" }, checkoutUrl: "", blocks: [{ type: "hero", headline: "H", subheadline: "S", ctaLabel: "C" }] };
    expect(PageDocumentSchema.safeParse(v1Page).success).toBe(true);
  });
});

describe("designer polish", () => {
  it("fills hero, price and guarantee details from earlier deliverables and never sets a link", () => {
    const doc = polishPage(
      {
        ...page,
        checkoutUrl: "https://evil.example.com",
        blocks: [
          { type: "hero", headline: "H", subheadline: "S", ctaLabel: "C" },
          { type: "price", title: "Investimento", priceLabel: "R$ 27,00", ctaLabel: "Quero", note: "" },
          { type: "guarantee", title: "Garantia", text: "Devolvemos em até 7 dias." },
        ],
      },
      copy,
      offer,
    );
    expect(doc.checkoutUrl).toBe("");
    const [hero, price, guarantee] = doc.blocks;
    expect(hero).toMatchObject({ eyebrow: copy.salesPage.eyebrow, highlights: copy.salesPage.highlights, trustLine: copy.salesPage.ctaMicrocopy });
    expect(price).toMatchObject({ note: copy.salesPage.ctaMicrocopy });
    expect(price?.type === "price" && price.includes?.length).toBeGreaterThan(0);
    expect(guarantee).toMatchObject({ days: 7 });
  });

  it("reads refund days in every supported language", () => {
    expect(guaranteeDays("Garantia de 7 dias")).toBe(7);
    expect(guaranteeDays("30-day refund: 30 days")).toBe(30);
    expect(guaranteeDays("sin garantía")).toBeUndefined();
  });
});

describe("free model fallbacks", () => {
  const busy = (status: number) =>
    new APICallError({ message: "busy", url: "https://x", requestBodyValues: {}, statusCode: status, isRetryable: true });

  it("treats 429/503 (also wrapped in a RetryError) as overloaded, other errors not", () => {
    expect(isOverloaded(busy(503))).toBe(true);
    expect(isOverloaded(new RetryError({ message: "x", reason: "maxRetriesExceeded", errors: [busy(429)] }))).toBe(true);
    expect(isOverloaded(busy(400))).toBe(false);
    expect(isOverloaded(new Error("boom"))).toBe(false);
  });

  it("reads INSTANCE_AI_FALLBACK_MODELS", () => {
    const c = instanceModelConfig({ INSTANCE_AI_MODEL: "a", INSTANCE_AI_FALLBACK_MODELS: " b, ,c " });
    expect(c.ok && c.fallbackModels).toEqual(["b", "c"]);
    expect(() => createModelCaller({ provider: "google", apiKey: "k", model: "a", fallbackModels: ["b"] })).not.toThrow();
  });
});
