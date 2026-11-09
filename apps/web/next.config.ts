import type { NextConfig } from "next";

/** Security headers for every response (published pages also get a strict CSP from middleware). */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
];

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lint runs once for the whole monorepo (pnpm lint), not per app build.
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["@honeymoney/agents", "@honeymoney/db", "@honeymoney/ui", "@honeymoney/worker"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default config;
