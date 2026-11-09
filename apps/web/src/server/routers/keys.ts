import { PROVIDERS } from "@honeymoney/agents/providers";
import { instanceModelConfigured, readLimits } from "@honeymoney/worker/limits";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { protectedProcedure, router } from "../trpc";

/** Printable ASCII, no spaces: what real provider keys look like. */
export const AiKeyInputSchema = z.object({
  provider: z.enum(PROVIDERS),
  key: z
    .string()
    .trim()
    .min(10, "Chave muito curta.")
    .max(512, "Chave muito longa.")
    .regex(/^[\x21-\x7e]+$/, "A chave contém caracteres inválidos."),
});

export const keysRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Only metadata: the secret never leaves Vault, and the column with its pointer is not even selectable.
    const { data, error } = await ctx.supabase
      .from("ai_keys")
      .select("id, provider, last4, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível listar as chaves." });
    return {
      keys: data,
      instance: {
        available: instanceModelConfigured(),
        provider: process.env.INSTANCE_AI_PROVIDER ?? "google",
        dailyRuns: readLimits().instanceDailyRuns,
      },
    };
  }),

  save: protectedProcedure.input(AiKeyInputSchema).mutation(async ({ ctx, input }) => {
    const { data, error } = await createSupabaseAdminClient().rpc("upsert_ai_key", {
      p_user_id: ctx.user.id,
      p_provider: input.provider,
      p_key: input.key,
    });
    // Never include the error details: they could echo the key.
    if (error || !data?.[0]) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível salvar a chave." });
    return { id: data[0].id, provider: data[0].provider, last4: data[0].last4 };
  }),

  remove: protectedProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const { error } = await ctx.supabase.from("ai_keys").delete().eq("id", input.id);
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível apagar a chave." });
    return { ok: true };
  }),
});
