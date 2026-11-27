import type { NextConfig } from "next";

/** Security headers for every response (published pages also get a strict CSP from middleware). */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  // Isolate the browsing context from cross-origin windows (auth uses redirects, not pop-ups).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

/**
 * Content-Security-Policy for the app (published pages get a stricter nonce-based one from the
 * middleware). Scripts only from this origin, network only to Supabase (and PostHog when the user
 * consents), no framing, no plugins, forms only to this origin.
 */
export function appCsp(env: Record<string, string | undefined> = process.env): string {
  const dev = env.NODE_ENV === "development";
  const supabase = (() => {
    try {
      const u = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
      return [`https://${u.host}`, `wss://${u.host}`];
    } catch {
      return [];
    }
  })();
  const posthog = ["https://*.posthog.com"];
  return [
    "default-src 'self'",
    // Next.js inlines small bootstrap scripts; external hosts are still blocked.
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} ${posthog.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${[...supabase, ...posthog].join(" ")}${dev ? " ws:" : ""}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lint runs once for the whole monorepo (pnpm lint), not per app build.
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["@honeymoney/agents", "@honeymoney/db", "@honeymoney/ui", "@honeymoney/worker"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Published pages (/sites/...) get their own nonce-based CSP from the middleware.
      { source: "/((?!sites/).*)", headers: [{ key: "Content-Security-Policy", value: appCsp() }] },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
    ];
  },
};

export default config;
