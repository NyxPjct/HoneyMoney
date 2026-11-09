import { PageDocumentSchema, RESERVED_SLUGS, runDeterministicChecks, SLUG_PATTERN } from "@honeymoney/agents";
import type { Database, Json } from "@honeymoney/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publishedUrl } from "@/lib/site";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertCanGenerate, loadOwnProject } from "../guards";
import { sendEvent } from "../queue";
import { protectedProcedure, router } from "../trpc";

const ProjectInput = z.object({ projectId: z.uuid() });

export const SlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(SLUG_PATTERN, "Use de 3 a 48 letras minúsculas, números ou hífens.")
  .refine((s) => !RESERVED_SLUGS.has(s), "Este endereço é reservado.");

/** Problems that block publishing, independent of the model (defense in depth). */
export function publishBlockers(doc: z.infer<typeof PageDocumentSchema>, approvedAt: string | null): string[] {
  const problems: string[] = [];
  if (!approvedAt) problems.push("A Sentinela ainda não aprovou a versão atual da página.");
  if (!doc.checkoutUrl) problems.push("Configure o link de checkout (https://) antes de publicar.");
  const blockers = runDeterministicChecks({ page: doc }).filter((i) => i.severity === "blocker");
  for (const b of blockers) problems.push(`${b.location}: ${b.problem}`);
  return problems;
}

async function loadOwnPage(ctx: { supabase: SupabaseClient<Database> }, projectId: string) {
  const { data } = await ctx.supabase
    .from("pages")
    .select("id, slug, blocks, approved_at, sentinel_report, published_at, updated_at")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "A página ainda não foi gerada." });
  return data;
}

export const pagesRouter = router({
  get: protectedProcedure.input(ProjectInput).query(async ({ ctx, input }) => {
    const page = await loadOwnPage(ctx, input.projectId);
    const doc = PageDocumentSchema.safeParse(page.blocks);
    return {
      ...page,
      doc: doc.success ? doc.data : null,
      url: publishedUrl(page.slug),
      blockers: doc.success ? publishBlockers(doc.data, page.approved_at) : ["A página está em um formato inválido."],
    };
  }),

  save: protectedProcedure
    .input(ProjectInput.extend({ doc: PageDocumentSchema }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("pages")
        .update({ blocks: input.doc as unknown as Json })
        .eq("project_id", input.projectId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível salvar a página." });
      return { ok: true };
    }),

  updateSlug: protectedProcedure.input(ProjectInput.extend({ slug: SlugSchema })).mutation(async ({ ctx, input }) => {
    const page = await loadOwnPage(ctx, input.projectId);
    const { error } = await createSupabaseAdminClient()
      .from("pages")
      .update({ slug: input.slug })
      .eq("id", page.id)
      .eq("user_id", ctx.user.id);
    if (error?.code === "23505") throw new TRPCError({ code: "CONFLICT", message: "Este endereço já está em uso." });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível mudar o endereço." });
    return { slug: input.slug, url: publishedUrl(input.slug) };
  }),

  requestReview: protectedProcedure.input(ProjectInput).mutation(async ({ ctx, input }) => {
    const project = await loadOwnProject(ctx.supabase, input.projectId);
    await loadOwnPage(ctx, input.projectId);
    await assertCanGenerate(ctx.supabase, ctx.user.id, project.ai_provider);
    await sendEvent("page/review.requested", { projectId: input.projectId, userId: ctx.user.id });
    return { ok: true };
  }),

  publish: protectedProcedure.input(ProjectInput).mutation(async ({ ctx, input }) => {
    const page = await loadOwnPage(ctx, input.projectId);
    const doc = PageDocumentSchema.safeParse(page.blocks);
    if (!doc.success) throw new TRPCError({ code: "BAD_REQUEST", message: "A página está em um formato inválido." });
    const problems = publishBlockers(doc.data, page.approved_at);
    if (problems.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: problems.join(" ") });

    const admin = createSupabaseAdminClient();
    // Publish exactly the approved draft: if it changed after we read it, updated_at differs and nothing happens.
    const { data: updated, error } = await admin
      .from("pages")
      .update({ published_blocks: doc.data as unknown as Json, published_at: new Date().toISOString() })
      .eq("id", page.id)
      .eq("user_id", ctx.user.id)
      .eq("updated_at", page.updated_at)
      .not("approved_at", "is", null)
      .select("id");
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível publicar." });
    if (!updated?.length) throw new TRPCError({ code: "CONFLICT", message: "A página mudou. Recarregue e tente de novo." });
    await admin.from("projects").update({ status: "published" }).eq("id", input.projectId).eq("user_id", ctx.user.id);
    return { url: publishedUrl(page.slug) };
  }),

  unpublish: protectedProcedure.input(ProjectInput).mutation(async ({ ctx, input }) => {
    const page = await loadOwnPage(ctx, input.projectId);
    const admin = createSupabaseAdminClient();
    await admin.from("pages").update({ published_at: null, published_blocks: null }).eq("id", page.id).eq("user_id", ctx.user.id);
    await admin
      .from("projects")
      .update({ status: "review" })
      .eq("id", input.projectId)
      .eq("user_id", ctx.user.id)
      .eq("status", "published");
    return { ok: true };
  }),
});
