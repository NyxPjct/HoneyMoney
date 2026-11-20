/**
 * Provider adapters (server/worker only). Uses the Vercel AI SDK so models can be swapped
 * without touching agent code. Keys are passed in per call and never logged.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, generateObject, generateText, type LanguageModel, NoObjectGeneratedError, RetryError } from "ai";
import type { ModelCaller } from "./types";

export const PROVIDERS = ["google", "openai", "anthropic"] as const;
export type Provider = (typeof PROVIDERS)[number];

export const PROVIDER_LABELS: Record<Provider, string> = {
  google: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic Claude",
};

/** Defaults; each can be overridden with GOOGLE_MODEL / OPENAI_MODEL / ANTHROPIC_MODEL. */
export const DEFAULT_MODELS: Record<Provider, string> = {
  google: "gemini-3.8-flash",
  openai: "gpt-5-mini",
  anthropic: "claude-sonnet-5-5",
};

export function modelFor(provider: Provider, env: Record<string, string | undefined> = process.env): string {
  const override = env[`${provider.toUpperCase()}_MODEL`];
  return override && override.trim() ? override.trim() : DEFAULT_MODELS[provider];
}

/**
 * OpenAI-compatible hosts with free tiers, usable as the instance's free model
 * (INSTANCE_AI_PROVIDER=groq | openrouter, or openai-compatible + INSTANCE_AI_BASE_URL).
 */
export const COMPATIBLE_HOSTS = {
  groq: { baseURL: "https://api.groq.com/openai/v1", defaultModel: "llama-3.3-70b-versatile" },
  openrouter: { baseURL: "https://openrouter.ai/api/v1", defaultModel: "meta-llama/llama-3.3-70b-instruct:free" },
} as const;

export type InstanceModelConfig =
  | { ok: true; provider: Provider; model: string; label: string; fallbackModels: string[] }
  | { ok: true; provider: "openai-compatible"; baseURL: string; model: string; label: string; fallbackModels: string[] }
  | { ok: false; error: string };

/**
 * Reads INSTANCE_AI_PROVIDER / INSTANCE_AI_MODEL / INSTANCE_AI_BASE_URL and
 * INSTANCE_AI_FALLBACK_MODELS (comma-separated, same provider). Does not look at the key.
 */
export function instanceModelConfig(env: Record<string, string | undefined> = process.env): InstanceModelConfig {
  const name = (env.INSTANCE_AI_PROVIDER ?? "google").trim().toLowerCase();
  const modelOverride = env.INSTANCE_AI_MODEL?.trim();
  const fallbackModels = (env.INSTANCE_AI_FALLBACK_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
    .slice(0, 4);
  if ((PROVIDERS as readonly string[]).includes(name)) {
    const provider = name as Provider;
    return { ok: true, provider, model: modelOverride || modelFor(provider, env), label: PROVIDER_LABELS[provider], fallbackModels };
  }
  if (name in COMPATIBLE_HOSTS) {
    const host = COMPATIBLE_HOSTS[name as keyof typeof COMPATIBLE_HOSTS];
    const label = name === "groq" ? "Groq" : "OpenRouter";
    return { ok: true, provider: "openai-compatible", baseURL: host.baseURL, model: modelOverride || host.defaultModel, label, fallbackModels };
  }
  if (name === "openai-compatible") {
    const baseURL = env.INSTANCE_AI_BASE_URL?.trim();
    if (!baseURL || !/^https:\/\//.test(baseURL)) return { ok: false, error: "INSTANCE_AI_BASE_URL (https) is required" };
    if (!modelOverride) return { ok: false, error: "INSTANCE_AI_MODEL is required" };
    return { ok: true, provider: "openai-compatible", baseURL, model: modelOverride, label: new URL(baseURL).hostname, fallbackModels };
  }
  return { ok: false, error: `Unknown INSTANCE_AI_PROVIDER "${name}"` };
}

function languageModel(provider: Provider | "openai-compatible", apiKey: string, model: string, baseURL?: string): LanguageModel {
  switch (provider) {
    case "openai-compatible":
      // Chat Completions endpoint, which every OpenAI-compatible host implements.
      return createOpenAI({ apiKey, baseURL, name: "openai-compatible" }).chat(model);
    case "google":
      return createGoogleGenerativeAI({ apiKey })(model);
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "anthropic":
      return createAnthropic({ apiKey })(model);
  }
}

export function createModelCaller(options: {
  provider: Provider | "openai-compatible";
  apiKey: string;
  /** Required for "openai-compatible". */
  baseURL?: string;
  model?: string;
  /** Tried in order when the main model is overloaded or rate limited (HTTP 429/503). */
  fallbackModels?: string[];
  maxOutputTokens?: number;
  timeoutMs?: number;
}): ModelCaller {
  if (options.provider === "openai-compatible" && (!options.baseURL || !options.model)) {
    throw new Error("openai-compatible needs baseURL and model");
  }
  const modelId = options.model ?? modelFor(options.provider as Provider);
  const models = [modelId, ...(options.fallbackModels ?? []).filter((m) => m && m !== modelId)].map((id) =>
    languageModel(options.provider, options.apiKey, id, options.baseURL),
  );
  const call = callOnce(options, options.provider !== "anthropic");
  return async (request) => {
    // One deadline for the main model and its fallbacks: stay below the 300 s function limit so a
    // slow call fails cleanly and the step is retried.
    const signal = AbortSignal.timeout(options.timeoutMs ?? 240_000);
    for (let i = 0; ; i++) {
      try {
        return await call(models[i]!, request, signal);
      } catch (err) {
        if (i + 1 >= models.length || !isOverloaded(err)) throw err;
      }
    }
  };
}

/** 429/503 after the SDK's own retries: the model is busy, another one may not be. */
export function isOverloaded(err: unknown): boolean {
  const inner = RetryError.isInstance(err) ? err.lastError : err;
  return APICallError.isInstance(inner) && (inner.statusCode === 429 || inner.statusCode === 503);
}

function callOnce(options: { maxOutputTokens?: number }, jsonMode: boolean) {
  // JSON mode makes the provider emit syntactically valid JSON (long outputs from small models
  // otherwise break it now and then). Anthropic has no JSON mode; its models follow the format well.
  return async (model: LanguageModel, { system, prompt }: { system: string; prompt: string }, abortSignal: AbortSignal) => {
    const common = {
      model,
      system,
      prompt,
      maxOutputTokens: options.maxOutputTokens ?? 8192,
      maxRetries: 2,
      abortSignal,
    };
    if (jsonMode) {
      try {
        const result = await generateObject({ ...common, output: "no-schema" });
        return {
          text: JSON.stringify(result.object),
          usage: { inputTokens: result.usage.inputTokens ?? 0, outputTokens: result.usage.outputTokens ?? 0 },
        };
      } catch (err) {
        // Unparseable output: hand the raw text to runAgent, which asks the model to fix it.
        if (NoObjectGeneratedError.isInstance(err)) {
          return {
            text: err.text ?? "",
            usage: { inputTokens: err.usage?.inputTokens ?? 0, outputTokens: err.usage?.outputTokens ?? 0 },
          };
        }
        throw err;
      }
    }
    const result = await generateText(common);
    return {
      text: result.text,
      usage: { inputTokens: result.usage.inputTokens ?? 0, outputTokens: result.usage.outputTokens ?? 0 },
    };
  };
}
