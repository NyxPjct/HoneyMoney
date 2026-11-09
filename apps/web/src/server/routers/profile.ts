import { LOCALES } from "@honeymoney/agents";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const profileRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("profiles")
      .select("id, display_name, locale, role, age_confirmed_at")
      .eq("id", ctx.user.id)
      .single();
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Perfil indisponível." });
    return { ...data, email: ctx.user.email ?? null };
  }),

  completeOnboarding: protectedProcedure
    .input(
      z.object({
        ageConfirmed: z.literal(true, { error: "Confirme que você tem 18 anos ou mais." }),
        displayName: z.string().trim().max(80).optional(),
        locale: z.enum(LOCALES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("profiles")
        .update({
          age_confirmed_at: new Date().toISOString(),
          display_name: input.displayName || null,
          locale: input.locale,
        })
        .eq("id", ctx.user.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível salvar." });
      return { ok: true };
    }),

  update: protectedProcedure
    .input(z.object({ displayName: z.string().trim().max(80), locale: z.enum(LOCALES) }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("profiles")
        .update({ display_name: input.displayName || null, locale: input.locale })
        .eq("id", ctx.user.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível salvar." });
      return { ok: true };
    }),
});
