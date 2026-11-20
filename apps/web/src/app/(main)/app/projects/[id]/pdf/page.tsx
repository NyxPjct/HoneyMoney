import { type AgentName, BriefingSchema, PageDocumentSchema, pickLatestDeliverables } from "@honeymoney/agents";
import { buttonVariants } from "@honeymoney/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OfferPlan } from "./offer-plan";

export const metadata: Metadata = { title: "Plano da oferta (PDF)" };

export default async function OfferPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: project } = await supabase.from("projects").select("id, name, briefing").eq("id", id).maybeSingle();
  if (!project) notFound();
  const [{ data: runs }, { data: page }] = await Promise.all([
    supabase
      .from("agent_runs")
      .select("agent, status, output, edited_output, created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("pages").select("blocks").eq("project_id", id).maybeSingle(),
  ]);

  const d = pickLatestDeliverables((runs ?? []).map((r) => ({ ...r, agent: r.agent as AgentName })));
  const briefing = BriefingSchema.safeParse(project.briefing);
  const doc = PageDocumentSchema.safeParse(page?.blocks);

  if (!d.strategist || !d.copywriter) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p>O PDF fica disponível quando os agentes terminarem a oferta e a copy.</p>
        <Link href={`/app/projects/${id}`} className={buttonVariants({ variant: "link" })}>
          Voltar ao escritório
        </Link>
      </div>
    );
  }

  return (
    <OfferPlan
      projectId={id}
      offer={d.strategist}
      copy={d.copywriter}
      audience={d.researcher}
      briefing={briefing.success ? briefing.data : undefined}
      theme={doc.success ? doc.data.theme : { accent: "amber", style: "clean" }}
    />
  );
}
