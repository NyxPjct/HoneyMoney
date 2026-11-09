import { describe, expect, it } from "vitest";
import { checkClaims, checkCopiedText, checkPrice, collectTexts, detectProhibitedTopic, type TextField } from "../src";
import { offer } from "./fixtures";

const field = (text: string): TextField => ({ agent: "copywriter", path: "copy.headline", text });
const blockers = (text: string) => checkClaims([field(text)]).filter((i) => i.severity === "blocker");

describe("claim rules", () => {
  it.each([
    "Fature R$ 50.000 por mês com este método",
    "Ganhe R$ 500 por dia trabalhando de casa",
    "Renda extra de R$ 3 mil garantida",
    "Earn $5,000 in your first month",
    "Renda garantida para sempre",
    "Resultados garantidos ou seu dinheiro de volta",
    "Este chá cura a diabetes",
    "Perca 10 kg em 30 dias",
    "Dinheiro fácil sem sair de casa",
    "Substitui o tratamento médico",
  ])("blocks %s", (text) => {
    expect(blockers(text).length).toBeGreaterThan(0);
  });

  it.each([
    "Garantia de 7 dias: se não gostar, devolvemos seu dinheiro",
    "Ganhe 3 bônus no valor de R$ 97",
    "Acesso por apenas R$ 27",
    "Curadoria de receitas para a semana",
    "Procura uma forma de organizar o mês?",
    "Aprenda a montar seu orçamento em 15 minutos por semana",
  ])("allows %s", (text) => {
    expect(blockers(text)).toEqual([]);
  });

  it("warns (without blocking) on per-period amounts used for price framing", () => {
    const issues = checkClaims([field("Menos de R$ 1 por dia")]);
    expect(issues.map((i) => i.severity)).toEqual(["warning"]);
  });

  it("detects prohibited topics", () => {
    expect(detectProhibitedTopic("curso de day trade para iniciantes")).toBe("trading");
    expect(detectProhibitedTopic("estratégia para opções binárias")).toBe("binary options");
    expect(detectProhibitedTopic("método para apostas esportivas")).toBe("betting / gambling");
    expect(detectProhibitedTopic("planilha de orçamento familiar")).toBeNull();
  });

  it("attributes findings to the agent that owns the text", () => {
    const fields = collectTexts({ offer: { ...offer, promise: "Fature R$ 10 mil por mês" } });
    const issues = checkClaims(fields);
    expect(issues[0]).toMatchObject({ agent: "strategist", location: "offer.promise", category: "income_claim" });
  });
});

describe("price coherence", () => {
  it("accepts typical prices", () => {
    expect(checkPrice(offer)).toEqual([]);
  });
  it("warns outside the usual range and blocks absurd prices", () => {
    const warn = checkPrice({ ...offer, suggestedPrice: { ...offer.suggestedPrice, amountCents: 29_700 } });
    expect(warn[0]?.severity).toBe("warning");
    const block = checkPrice({ ...offer, suggestedPrice: { ...offer.suggestedPrice, amountCents: 199_700 } });
    expect(block[0]?.severity).toBe("blocker");
    const usd = checkPrice({ ...offer, suggestedPrice: { amountCents: 900, currency: "USD", rationale: "x" } });
    expect(usd).toEqual([]);
  });
});

describe("copied text", () => {
  it("flags 8-word overlaps with reference texts", () => {
    const reference = ["Descubra o método simples que já ajudou milhares de famílias a sair das dívidas"];
    const copied = field("Conheça o método simples que já ajudou milhares de famílias a sair das dívidas hoje");
    const original = field("Organize seu salário com uma planilha feita para quem nunca usou planilha");
    expect(checkCopiedText([copied], reference)).toHaveLength(1);
    expect(checkCopiedText([original], reference)).toEqual([]);
  });
});
