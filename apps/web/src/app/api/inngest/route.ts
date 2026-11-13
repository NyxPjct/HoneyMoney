import { functions, inngest, inngestEnv } from "@honeymoney/worker";
import { serve } from "inngest/next";

// Each agent runs as its own Inngest step (one model call). Free-tier models can take over a minute
// under load, so allow up to 300 s (the Vercel Hobby limit with Fluid compute).
export const maxDuration = 300;

// Keys may come with a project prefix from the Vercel integration (see inngest-env.ts).
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  signingKey: inngestEnv("INNGEST_SIGNING_KEY"),
  signingKeyFallback: inngestEnv("INNGEST_SIGNING_KEY_FALLBACK"),
});
