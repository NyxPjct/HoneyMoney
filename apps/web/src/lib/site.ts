export const APP_NAME = "HoneyMoney";
export const GITHUB_URL = "https://github.com/NyxPjct/HomeMoney";

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Where a published page lives: its own subdomain when configured, /sites/<slug> otherwise. */
export function publishedUrl(slug: string): string {
  const domain = process.env.NEXT_PUBLIC_PAGES_DOMAIN?.trim().toLowerCase();
  if (domain) return `https://${slug}.${domain}`;
  return `${appUrl()}/sites/${slug}`;
}

/** Only allow same-site relative redirects (prevents open redirects in auth flows). */
export function safeNextPath(next: string | null | undefined, fallback = "/app"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
