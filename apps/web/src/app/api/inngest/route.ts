import { functions, inngest } from "@honeymoney/worker";
import { serve } from "inngest/next";

// Each agent runs as its own Inngest step, so every invocation stays well below the limit.
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({ client: inngest, functions });
