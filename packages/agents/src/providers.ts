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
  google: "gemini-2.5-flash",
  openai: "gpt-5-mini",
  anthropic: "claude-sonnet-5-5",
};

export function modelFor(provider: Provider, env: Record<string, string | undefined> = process.env): string {
  const override = env[`${provider.toUpperCase()}_MODEL`];
  return override && override.trim() ? override.trim() : DEFAULT_MODELS[provider];
}

function languageModel(provider: Provider, apiKey: string, model: string): LanguageModel {
  switch (provider) {
    case "google":
      return createGoogleGenerativeAI({ apiKey })(model);
    case "openai":
      return createOpenAI({ apiKey })(model);
    case "anthropic":
      return createAnthropic({ apiKey })(model);
  }
}

export function createModelCaller(options: {
  provider: Provider;
  apiKey: string;
  model?: string;
  maxOutputTokens?: number;
  timeoutMs?: number;
}): ModelCaller {
  const model = languageModel(options.provider, options.apiKey, options.model ?? modelFor(options.provider));
  return async ({ system, prompt }) => {
    const result = await generateText({
      model,
      system,
      prompt,
      maxOutputTokens: options.maxOutputTokens ?? 8192,
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(options.timeoutMs ?? 120_000),
    });
    return {
      text: result.text,
      usage: { inputTokens: result.usage.inputTokens ?? 0, outputTokens: result.usage.outputTokens ?? 0 },
    };
  };
}
