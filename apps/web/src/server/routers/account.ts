import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseAnonClient } from "@/lib/supabase/server";
import { protectedProcedure, router } from "../trpc";

export const accountRouter = router({
  /** LGPD: everything we store about the user, except secrets (AI keys are listed by provider and last 4). */
  export: protectedProcedure.query(async ({ ctx }) => {
    const s = ctx.supabase;
    const [profile, keys, projects, runs, versions, pages] = await Promise.all([
      s.from("profiles").select("*").eq("id", ctx.user.id).single(),
      s.from("ai_keys").select("id, provider, last4, created_at, updated_at"),
      s.from("projects").select("*"),
      s.from("agent_runs").select("*"),
      s.from("offer_versions").select("*"),
      s.from("pages").select("*"),
    ]);
    return {
      exported_at: new Date().toISOString(),
      account: { id: ctx.user.id, email: ctx.user.email ?? null, created_at: ctx.user.created_at },
      profile: profile.data,
      ai_keys: keys.data ?? [],
      projects: projects.data ?? [],
      agent_runs: runs.data ?? [],
      offer_versions: versions.data ?? [],
      pages: pages.data ?? [],
    };
  }),

  /**
   * LGPD: permanent deletion. Cascades to every row and deletes AI keys from Vault.
   * Accounts with a password must type it again, so a stolen or forgotten-open session cannot
   * destroy the account.
   */
  delete: protectedProcedure
    .input(
      z.object({
        confirm: z.literal("EXCLUIR", { error: 'Digite "EXCLUIR" para confirmar.' }),
        password: z.string().max(200).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hasPassword = (ctx.user.identities ?? []).some((i) => i.provider === "email");
      if (hasPassword) {
        if (!input.password || !ctx.user.email) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Digite sua senha para confirmar." });
        }
        // A separate client without cookies: checking the password never touches the current session.
        const { data, error } = await createSupabaseAnonClient().auth.signInWithPassword({
          email: ctx.user.email,
          password: input.password,
        });
        if (error || data.user?.id !== ctx.user.id) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha incorreta." });
        }
      }
      const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(ctx.user.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível excluir a conta." });
      await ctx.supabase.auth.signOut();
      return { ok: true };
    }),
});
