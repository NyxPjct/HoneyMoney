import "server-only";
import type { Database, Tables } from "@honeymoney/db";
import { instanceModelConfigured, readLimits } from "@honeymoney/worker/limits";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";

type Client = SupabaseClient<Database>;

export async function loadOwnProject(supabase: Client, id: string): Promise<Tables<"projects">> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível carregar o projeto." });
  // RLS already hides other people's projects; "not found" covers both cases.
  if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado." });
  return data;
}

/**
 * Checks before any generation is queued: per-user rate limit, free-model daily limit and
 * that the chosen provider is actually usable. Uses the user's own client, so counts are RLS-scoped.
 */
export async function assertCanGenerate(
  supabase: Client,
  userId: string,
  aiProvider: Tables<"projects">["ai_provider"],
): Promise<void> {
  const limits = readLimits();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: hourly } = await supabase
    .from("agent_runs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", hourAgo);
  if ((hourly ?? 0) >= limits.hourlyRuns) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Muitas gerações na última hora. Tente de novo mais tarde." });
  }

  if (aiProvider === "instance") {
    if (!instanceModelConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Esta instância não oferece modelo gratuito. Adicione sua chave de IA em Configurações.",
      });
    }
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: daily } = await supabase
      .from("agent_runs")
      .select("id", { count: "exact", head: true })
      .eq("key_source", "instance")
      .gte("created_at", dayAgo);
    if ((daily ?? 0) >= limits.instanceDailyRuns) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Você atingiu o limite diário do modelo gratuito. Volte amanhã ou use sua própria chave.",
      });
    }
    return;
  }

  const { data: key } = await supabase.from("ai_keys").select("id").eq("provider", aiProvider).eq("user_id", userId).maybeSingle();
  if (!key) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Adicione sua chave desse provedor em Configurações." });
  }
}
