import { functions, inngest, inngestEnv } from "@honeymoney/worker";
import { serve } from "inngest/next";

// Each agent runs as its own Inngest step, so every invocation stays well below the limit.
export const maxDuration = 60;

// Keys may come with a project prefix from the Vercel integration (see inngest-env.ts).
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  signingKey: inngestEnv("INNGEST_SIGNING_KEY"),
  signingKeyFallback: inngestEnv("INNGEST_SIGNING_KEY_FALLBACK"),
});
