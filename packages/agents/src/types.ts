import type { z } from "zod";

export const AGENT_NAMES = ["manager", "researcher", "strategist", "copywriter", "designer", "sentinel"] as const;
export type AgentName = (typeof AGENT_NAMES)[number];

/** Agents whose deliverables the Sentinel can send back for changes. */
export const RESPONSIBLE_AGENTS = ["researcher", "strategist", "copywriter", "designer"] as const;
export type ResponsibleAgent = (typeof RESPONSIBLE_AGENTS)[number];

export type Usage = { inputTokens: number; outputTokens: number };

export type ModelRequest = { system: string; prompt: string };
export type ModelResponse = { text: string; usage: Usage };

/**
 * The only thing an agent needs from an AI provider. Production code builds one with
 * `createModelCaller` (Vercel AI SDK); tests pass a fake.
 */
export type ModelCaller = (request: ModelRequest) => Promise<ModelResponse>;

export interface AgentDefinition<I, O> {
  name: AgentName;
  /** Bumped whenever the prompt or schema changes, stored on every agent run. */
  version: string;
  /** One-line description shown in the office UI. */
  role: string;
  system: string;
  buildPrompt: (input: I) => string;
  outputSchema: z.ZodType<O>;
  /** Deterministic short-circuit: when it returns a value, the model is not called. */
  precheck?: (input: I) => O | null;
  /** Deterministic post-processing applied after validation (e.g. Sentinel rule checks). */
  postprocess?: (input: I, output: O) => O;
}
