/**
 * Provider adapters (server/worker only). Uses the Vercel AI SDK so models can be swapped
 * without touching agent code. Keys are passed in per call and never logged.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type LanguageModel } from "ai";
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
  | { ok: true; provider: Provider; model: string; label: string }
  | { ok: true; provider: "openai-compatible"; baseURL: string; model: string; label: string }
  | { ok: false; error: string };

/** Reads INSTANCE_AI_PROVIDER / INSTANCE_AI_MODEL / INSTANCE_AI_BASE_URL. Does not look at the key. */
export function instanceModelConfig(env: Record<string, string | undefined> = process.env): InstanceModelConfig {
  const name = (env.INSTANCE_AI_PROVIDER ?? "google").trim().toLowerCase();
  const modelOverride = env.INSTANCE_AI_MODEL?.trim();
  if ((PROVIDERS as readonly string[]).includes(name)) {
    const provider = name as Provider;
    return { ok: true, provider, model: modelOverride || modelFor(provider, env), label: PROVIDER_LABELS[provider] };
  }
  if (name in COMPATIBLE_HOSTS) {
    const host = COMPATIBLE_HOSTS[name as keyof typeof COMPATIBLE_HOSTS];
    const label = name === "groq" ? "Groq" : "OpenRouter";
    return { ok: true, provider: "openai-compatible", baseURL: host.baseURL, model: modelOverride || host.defaultModel, label };
  }
  if (name === "openai-compatible") {
    const baseURL = env.INSTANCE_AI_BASE_URL?.trim();
    if (!baseURL || !/^https:\/\//.test(baseURL)) return { ok: false, error: "INSTANCE_AI_BASE_URL (https) is required" };
    if (!modelOverride) return { ok: false, error: "INSTANCE_AI_MODEL is required" };
    return { ok: true, provider: "openai-compatible", baseURL, model: modelOverride, label: new URL(baseURL).hostname };
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
  maxOutputTokens?: number;
  timeoutMs?: number;
}): ModelCaller {
  if (options.provider === "openai-compatible" && (!options.baseURL || !options.model)) {
    throw new Error("openai-compatible needs baseURL and model");
  }
  const modelId = options.model ?? modelFor(options.provider as Provider);
  const model = languageModel(options.provider, options.apiKey, modelId, options.baseURL);
  return async ({ system, prompt }) => {
    const result = await generateText({
      model,
      system,
      prompt,
      maxOutputTokens: options.maxOutputTokens ?? 8192,
      maxRetries: 2,
      // Stay below the 300 s function limit so a slow call fails cleanly and the step is retried.
      abortSignal: AbortSignal.timeout(options.timeoutMs ?? 240_000),
    });
    return {
      text: result.text,
      usage: { inputTokens: result.usage.inputTokens ?? 0, outputTokens: result.usage.outputTokens ?? 0 },
    };
  };
}
