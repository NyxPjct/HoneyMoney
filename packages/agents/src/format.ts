import type { Currency } from "./schemas";

const LOCALE_FOR_CURRENCY: Record<Currency, string> = { BRL: "pt-BR", USD: "en-US", EUR: "es-ES" };

export function formatPrice(amountCents: number, currency: Currency): string {
  return new Intl.NumberFormat(LOCALE_FOR_CURRENCY[currency], { style: "currency", currency }).format(
    amountCents / 100,
  );
}

/** URL-safe slug, 3–48 chars, matching the DB constraint on pages.slug. */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return base.length >= 3 ? base : `oferta-${base || "nova"}`.slice(0, 40);
}

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/;

/** Subdomains that must never be used for published pages. */
export const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "auth",
  "login",
  "mail",
  "static",
  "assets",
  "status",
  "docs",
  "help",
  "support",
  "pages",
  "honeymoney",
]);
