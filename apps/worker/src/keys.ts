import type { ModelCaller } from "@honeymoney/agents";
import { createModelCaller, modelFor, PROVIDERS, type Provider } from "@honeymoney/agents/providers";
import type { ProjectAiProvider } from "@honeymoney/db";
import { NonRetriableError } from "inngest";
import type { AdminClient } from "./supabase";

export type ResolvedCaller = {
  call: ModelCaller;
  keySource: "user" | "instance";
  /** Values to scrub from any stored error. Never return these from a step (step output is persisted). */
  secrets: string[];
};

function isProvider(value: string): value is Provider {
  return (PROVIDERS as readonly string[]).includes(value);
}

/**
 * Builds the model caller for a project. The decrypted key only lives in this closure,
 * in memory, for the duration of the invocation.
 */
export async function resolveCaller(
  admin: AdminClient,
  project: { user_id: string; ai_provider: ProjectAiProvider },
  env: Record<string, string | undefined> = process.env,
): Promise<ResolvedCaller> {
  if (project.ai_provider === "instance") {
    const provider = (env.INSTANCE_AI_PROVIDER ?? "google").trim();
    const apiKey = env.INSTANCE_AI_KEY?.trim();
    if (!apiKey || !isProvider(provider)) {
      throw new NonRetriableError("This instance has no free model configured. Add your own AI key in Settings.");
    }
    const model = env.INSTANCE_AI_MODEL?.trim() || modelFor(provider, env);
    return { call: createModelCaller({ provider, apiKey, model }), keySource: "instance", secrets: [apiKey] };
  }

  const { data, error } = await admin.rpc("get_ai_key", {
    p_user_id: project.user_id,
    p_provider: project.ai_provider,
  });
  if (error) throw new Error(`Could not load AI key (${error.code ?? "db error"})`);
  if (!data) throw new NonRetriableError(`No ${project.ai_provider} key saved. Add it in Settings.`);
  return {
    call: createModelCaller({ provider: project.ai_provider, apiKey: data, model: modelFor(project.ai_provider, env) }),
    keySource: "user",
    secrets: [data],
  };
}
