import { z } from "zod";
import { DATA_RULES } from "./data";
import { AgentOutputError } from "./errors";
import { extractJson } from "./json";
import type { AgentDefinition, ModelCaller, Usage } from "./types";

/** Invalid output triggers up to this many new attempts (spec: "até 2 novas tentativas"). */
export const MAX_OUTPUT_RETRIES = 2;

export type AgentResult<O> = {
  output: O;
  usage: Usage;
  attempts: number;
  promptVersion: string;
};

export function buildSystemPrompt(agent: AgentDefinition<unknown, unknown>): string {
  const schema = JSON.stringify(z.toJSONSchema(agent.outputSchema), null, 0);
  return [
    agent.system.trim(),
    "",
    "## Safety",
    DATA_RULES,
    "",
    "## Output format",
    "Reply with ONE JSON object and nothing else (no markdown, no comments).",
    "It must validate against this JSON Schema:",
    schema,
  ].join("\n");
}

export type ParseResult<O> = { ok: true; value: O } | { ok: false; problem: string };

export function parseAgentOutput<O>(schema: z.ZodType<O>, text: string): ParseResult<O> {
  let json: unknown;
  try {
    json = extractJson(text);
  } catch (err) {
    return { ok: false, problem: `not valid JSON (${(err as Error).message})` };
  }
  const parsed = schema.safeParse(json);
  if (parsed.success) return { ok: true, value: parsed.data };
  const problem = parsed.error.issues
    .slice(0, 8)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
  return { ok: false, problem };
}

export async function runAgent<I, O>(
  agent: AgentDefinition<I, O>,
  input: I,
  call: ModelCaller,
  options: { maxRetries?: number } = {},
): Promise<AgentResult<O>> {
  const pre = agent.precheck?.(input);
  if (pre) {
    return { output: pre, usage: { inputTokens: 0, outputTokens: 0 }, attempts: 0, promptVersion: agent.version };
  }

  const maxRetries = options.maxRetries ?? MAX_OUTPUT_RETRIES;
  const system = buildSystemPrompt(agent as AgentDefinition<unknown, unknown>);
  const basePrompt = agent.buildPrompt(input);
  const usage: Usage = { inputTokens: 0, outputTokens: 0 };
  let prompt = basePrompt;
  let lastProblem = "";

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const response = await call({ system, prompt });
    usage.inputTokens += response.usage.inputTokens;
    usage.outputTokens += response.usage.outputTokens;

    const parsed = parseAgentOutput(agent.outputSchema, response.text);
    if (parsed.ok) {
      const output = agent.postprocess ? agent.postprocess(input, parsed.value) : parsed.value;
      return { output, usage, attempts: attempt, promptVersion: agent.version };
    }
    lastProblem = parsed.problem;
    prompt = [
      basePrompt,
      "",
      "## Your previous answer was rejected",
      `Validation problems: ${parsed.problem}`,
      "Answer again with ONE JSON object that fixes every problem above and follows the schema exactly.",
    ].join("\n");
  }

  throw new AgentOutputError(agent.name, maxRetries + 1, lastProblem);
}
