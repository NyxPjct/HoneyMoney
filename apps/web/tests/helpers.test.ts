import { describe, expect, it } from "vitest";
import { parsePriceToCents } from "@/app/(main)/app/projects/new/briefing-form";
import { SlugSchema } from "@/server/routers/pages";
import { publishedUrl, safeNextPath } from "@/lib/site";

describe("helpers", () => {
  it("only allows same-site redirects after login", () => {
    expect(safeNextPath("/app/projects/1")).toBe("/app/projects/1");
    expect(safeNextPath("//evil.com")).toBe("/app");
    expect(safeNextPath("https://evil.com")).toBe("/app");
    expect(safeNextPath("/\\evil.com")).toBe("/app");
    expect(safeNextPath(null)).toBe("/app");
  });

  it("parses prices typed the Brazilian or international way", () => {
    expect(parsePriceToCents("27")).toBe(2700);
    expect(parsePriceToCents("27,90")).toBe(2790);
    expect(parsePriceToCents("R$ 1.297,00")).toBe(129700);
    expect(parsePriceToCents("19.99")).toBe(1999);
    expect(parsePriceToCents("")).toBeUndefined();
  });

  it("validates page slugs and blocks reserved names", () => {
    expect(SlugSchema.safeParse("minha-oferta").success).toBe(true);
    expect(SlugSchema.safeParse("Minha-Oferta").success).toBe(true);
    expect(SlugSchema.safeParse("admin").success).toBe(false);
    expect(SlugSchema.safeParse("a").success).toBe(false);
    expect(SlugSchema.safeParse("-x-").success).toBe(false);
  });

  it("builds published URLs on the pages subdomain when configured", () => {
    delete process.env.NEXT_PUBLIC_PAGES_DOMAIN;
    expect(publishedUrl("oferta")).toBe("http://localhost:3000/sites/oferta");
    process.env.NEXT_PUBLIC_PAGES_DOMAIN = "pages.example.com";
    expect(publishedUrl("oferta")).toBe("https://oferta.pages.example.com");
    delete process.env.NEXT_PUBLIC_PAGES_DOMAIN;
  });
});

describe("password rule", async () => {
  const { passwordProblem } = await import("@/lib/password");
  it("accepts a reasonable password and rejects weak ones", () => {
    expect(passwordProblem("unhas-firmes-2026")).toBeNull();
    expect(passwordProblem("curta1")).toMatch(/8 caracteres/);
    expect(passwordProblem("somenteletras")).toMatch(/letras e números/);
    expect(passwordProblem("12345678")).toMatch(/letras e números/);
    expect(passwordProblem("Password1")).toMatch(/comum/);
    expect(passwordProblem("maria2026x", "maria@example.com")).toMatch(/e-mail/);
  });
});
