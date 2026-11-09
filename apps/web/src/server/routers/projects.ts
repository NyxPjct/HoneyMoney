import {
  AGENT_NAMES,
  BriefingSchema,
  briefingSize,
  DELIVERABLE_SCHEMAS,
  MAX_BRIEFING_BYTES,
  PIPELINE_ORDER,
} from "@honeymoney/agents";
import type { Json } from "@honeymoney/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { assertCanGenerate, loadOwnProject } from "../guards";
import { sendEvent } from "../queue";
import { type Context, protectedProcedure, router } from "../trpc";

const AiProviderSchema = z.enum(["instance", "google", "openai", "anthropic"]);

export const CreateProjectSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao projeto.").max(120),
  briefing: BriefingSchema.refine((b) => briefingSize(b) <= MAX_BRIEFING_BYTES, "O briefing está grande demais."),
  aiProvider: AiProviderSchema,
  reviewEachStep: z.boolean(),
});

/** Agents whose deliverables the user edits in the office panel (the page has its own editor). */
const EDITABLE_AGENTS = ["researcher", "strategist", "copywriter"] as const;

type AuthedCtx = Context & { user: NonNullable<Context["user"]> };

async function enqueueGeneration(
  ctx: AuthedCtx,
  project: { id: string; status: string; ai_provider: "instance" | "google" | "openai" | "anthropic" },
  startFrom?: (typeof PIPELINE_ORDER)[number],
) {
  if (project.status === "generating") {
    throw new TRPCError({ code: "CONFLICT", message: "Os agentes já estão trabalhando neste projeto." });
  }
  await assertCanGenerate(ctx.supabase, ctx.user.id, project.ai_provider);

  const admin = createSupabaseAdminClient();
  // Flip the status first so double clicks cannot start two pipelines.
  const { data: claimed } = await admin
    .from("projects")
    .update({ status: "generating", last_error: null, awaiting_agent: null })
    .eq("id", project.id)
    .eq("user_id", ctx.user.id)
    .neq("status", "generating")
    .select("id");
  if (!claimed?.length) throw new TRPCError({ code: "CONFLICT", message: "Os agentes já estão trabalhando neste projeto." });

  try {
    await sendEvent("project/generation.requested", { projectId: project.id, userId: ctx.user.id, startFrom });
  } catch {
    await admin
      .from("projects")
      .update({ status: project.status as "draft", last_error: "Fila indisponível. Tente novamente." })
      .eq("id", project.id);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "A fila dos agentes está indisponível. Tente novamente." });
  }
}

export const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("projects")
      .select("id, name, status, ai_provider, updated_at, created_at")
      .order("updated_at", { ascending: false });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível listar os projetos." });
    return data;
  }),

  get: protectedProcedure.input(z.object({ id: z.uuid() })).query(async ({ ctx, input }) => {
    const project = await loadOwnProject(ctx.supabase, input.id);
    const [runs, versions, page] = await Promise.all([
      ctx.supabase
        .from("agent_runs")
        .select(
          "id, agent, status, round, prompt_version, output, edited_output, input_tokens, output_tokens, key_source, error, started_at, finished_at, created_at",
        )
        .eq("project_id", input.id)
        .order("created_at", { ascending: true })
        .limit(300),
      ctx.supabase
        .from("offer_versions")
        .select("id, version, promise, sentinel_report, created_at")
        .eq("project_id", input.id)
        .order("version", { ascending: false }),
      ctx.supabase
        .from("pages")
        .select("id, slug, approved_at, published_at, sentinel_report, updated_at")
        .eq("project_id", input.id)
        .maybeSingle(),
    ]);
    return { project, runs: runs.data ?? [], versions: versions.data ?? [], page: page.data };
  }),

  create: protectedProcedure.input(CreateProjectSchema).mutation(async ({ ctx, input }) => {
    // Validate the provider before creating anything.
    await assertCanGenerate(ctx.supabase, ctx.user.id, input.aiProvider);
    const { data, error } = await ctx.supabase
      .from("projects")
      .insert({
        user_id: ctx.user.id,
        name: input.name,
        briefing: input.briefing as unknown as Json,
        ai_provider: input.aiProvider,
        review_each_step: input.reviewEachStep,
      })
      .select("id, status, ai_provider")
      .single();
    if (error || !data) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar o projeto." });
    await enqueueGeneration(ctx, data);
    return { id: data.id };
  }),

  generate: protectedProcedure
    .input(z.object({ id: z.uuid(), startFrom: z.enum(PIPELINE_ORDER).optional() }))
    .mutation(async ({ ctx, input }) => {
      const project = await loadOwnProject(ctx.supabase, input.id);
      await enqueueGeneration(ctx, project, input.startFrom);
      return { ok: true };
    }),

  answerQuestions: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        answers: z.array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(600) })).min(1).max(3),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await loadOwnProject(ctx.supabase, input.id);
      const briefing = BriefingSchema.parse(project.briefing);
      const next = { ...briefing, answers: [...(briefing.answers ?? []), ...input.answers].slice(-10) };
      if (briefingSize(next) > MAX_BRIEFING_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "O briefing ficou grande demais." });
      }
      const { error } = await ctx.supabase.from("projects").update({ briefing: next as unknown as Json }).eq("id", input.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível salvar as respostas." });
      await enqueueGeneration(ctx, project);
      return { ok: true };
    }),

  updateSettings: protectedProcedure
    .input(z.object({ id: z.uuid(), name: z.string().trim().min(1).max(120), aiProvider: AiProviderSchema, reviewEachStep: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("projects")
        .update({ name: input.name, ai_provider: input.aiProvider, review_each_step: input.reviewEachStep })
        .eq("id", input.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível salvar." });
      return { ok: true };
    }),

  editDeliverable: protectedProcedure
    .input(z.object({ runId: z.uuid(), output: z.unknown() }))
    .mutation(async ({ ctx, input }) => {
      const { data: run } = await ctx.supabase.from("agent_runs").select("id, agent, status").eq("id", input.runId).maybeSingle();
      if (!run) throw new TRPCError({ code: "NOT_FOUND", message: "Entrega não encontrada." });
      if (!(EDITABLE_AGENTS as readonly string[]).includes(run.agent)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta entrega não pode ser editada aqui." });
      }
      const parsed = DELIVERABLE_SCHEMAS[run.agent].safeParse(input.output);
      if (!parsed.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A edição não está no formato esperado.", cause: parsed.error });
      }
      const { error } = await ctx.supabase
        .from("agent_runs")
        .update({ edited_output: parsed.data as unknown as Json })
        .eq("id", input.runId);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível salvar a edição." });
      return { ok: true };
    }),

  approveStep: protectedProcedure
    .input(z.object({ id: z.uuid(), agent: z.enum(AGENT_NAMES) }))
    .mutation(async ({ ctx, input }) => {
      const project = await loadOwnProject(ctx.supabase, input.id);
      if (project.awaiting_agent !== input.agent) {
        throw new TRPCError({ code: "CONFLICT", message: "Esta etapa não está aguardando aprovação." });
      }
      await sendEvent("project/step.approved", { projectId: input.id, userId: ctx.user.id, agent: input.agent });
      return { ok: true };
    }),

  cancel: protectedProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const project = await loadOwnProject(ctx.supabase, input.id);
    if (project.status !== "generating") return { ok: true };
    await sendEvent("project/generation.cancelled", { projectId: input.id, userId: ctx.user.id });
    await createSupabaseAdminClient()
      .from("projects")
      .update({ status: "draft", awaiting_agent: null, last_error: "Geração cancelada." })
      .eq("id", input.id)
      .eq("user_id", ctx.user.id);
    // Close any run left open by the cancellation.
    await createSupabaseAdminClient()
      .from("agent_runs")
      .update({ status: "failed", error: "Cancelado pelo usuário.", finished_at: new Date().toISOString() })
      .eq("project_id", input.id)
      .in("status", ["queued", "running"]);
    return { ok: true };
  }),

  remove: protectedProcedure.input(z.object({ id: z.uuid() })).mutation(async ({ ctx, input }) => {
    const project = await loadOwnProject(ctx.supabase, input.id);
    if (project.status === "generating") {
      await sendEvent("project/generation.cancelled", { projectId: input.id, userId: ctx.user.id }).catch(() => undefined);
    }
    const { error } = await ctx.supabase.from("projects").delete().eq("id", input.id);
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível apagar o projeto." });
    return { ok: true };
  }),
});
