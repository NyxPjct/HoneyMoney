"use client";

import {
  type AgentName,
  DELIVERABLE_SCHEMAS,
  type ManagerOutput,
  PIPELINE_ORDER,
  SentinelReportSchema,
} from "@honeymoney/agents";
import { Alert, Badge, Button, buttonVariants, Card, Textarea } from "@honeymoney/ui";
import { AGENT_META, deriveOfficeStates, OfficeScene, STATE_LABELS } from "@honeymoney/ui/office";
import { ArrowLeft, ExternalLink, Pencil, RefreshCw, Square, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { JsonField, type JsonValue, JsonView } from "@/components/json-form";
import { SentinelReportView } from "@/components/sentinel-report";
import { PROVIDER_LABELS, STATUS_LABELS } from "@/lib/labels";
import { publishedUrl } from "@/lib/site";
import { trpc } from "@/lib/trpc/client";
import type { RouterOutputs } from "@/lib/trpc/types";
import { useProjectRealtime } from "@/lib/use-project-realtime";

type Data = RouterOutputs["projects"]["get"];
type Run = Data["runs"][number];

const EDITABLE: AgentName[] = ["researcher", "strategist", "copywriter"];

function latestByAgent(runs: Run[]): Partial<Record<AgentName, Run>> {
  const out: Partial<Record<AgentName, Run>> = {};
  for (const r of runs) {
    const cur = out[r.agent];
    if (!cur || r.created_at > cur.created_at) out[r.agent] = r;
  }
  return out;
}

export function ProjectOffice({ id }: { id: string }) {
  const utils = trpc.useUtils();
  const query = trpc.projects.get.useQuery(
    { id },
    // Realtime is the main channel; polling is the fallback while agents work.
    { refetchInterval: (q) => (q.state.data?.project.status === "generating" ? 4000 : false) },
  );
  useProjectRealtime(id, () => void utils.projects.get.invalidate({ id }));
  const [selected, setSelected] = useState<AgentName | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const generating = query.data?.project.status === "generating";
  useEffect(() => {
    if (!generating) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [generating]);

  const states = useMemo(
    () => (query.data ? deriveOfficeStates(query.data.runs, query.data.project, now) : null),
    [query.data, now],
  );

  if (query.isLoading) return <p className="text-sm text-stone-500">Abrindo o escritório…</p>;
  if (query.error || !query.data || !states) {
    return <Alert tone="error">{query.error?.message ?? "Projeto não encontrado."}</Alert>;
  }

  const { project } = query.data;
  const status = STATUS_LABELS[project.status] ?? STATUS_LABELS.draft!;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/app" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Projetos
          </Link>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight">{project.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <Badge tone={status.tone}>{status.label}</Badge>
            <span>{PROVIDER_LABELS[project.ai_provider]}</span>
            {project.review_each_step && <span>· revisão a cada etapa</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <OfficeScene states={states} selected={selected} onSelect={(a) => setSelected((cur) => (cur === a ? null : a))} />
        <aside className="space-y-4">
          {selected ? (
            <AgentPanel data={query.data} agent={selected} stateLabel={STATE_LABELS[states[selected]]} onClose={() => setSelected(null)} />
          ) : (
            <ProjectPanel data={query.data} onSelect={setSelected} />
          )}
        </aside>
      </div>
    </div>
  );
}

function useInvalidate(id: string) {
  const utils = trpc.useUtils();
  return () => void utils.projects.get.invalidate({ id });
}

function ProjectPanel({ data, onSelect }: { data: Data; onSelect: (a: AgentName) => void }) {
  const router = useRouter();
  const { project, runs, versions, page } = data;
  const invalidate = useInvalidate(project.id);
  const generate = trpc.projects.generate.useMutation({ onSuccess: invalidate });
  const cancel = trpc.projects.cancel.useMutation({ onSuccess: invalidate });
  const approve = trpc.projects.approveStep.useMutation({ onSuccess: invalidate });
  const remove = trpc.projects.remove.useMutation({ onSuccess: () => router.replace("/app") });

  const latest = latestByAgent(runs);
  const managerRun = latest.manager;
  const managerOut = DELIVERABLE_SCHEMAS.manager.safeParse(managerRun?.output);
  const manager: ManagerOutput | null = managerOut.success ? managerOut.data : null;
  const lastVersion = versions[0];
  const report = SentinelReportSchema.safeParse(page?.sentinel_report ?? latest.sentinel?.output);
  const tokens = runs.reduce((sum, r) => sum + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0);
  const generating = project.status === "generating";
  const error = generate.error ?? cancel.error ?? approve.error;

  return (
    <>
      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">Projeto</h2>

        {generating && !project.awaiting_agent && (
          <Alert tone="info">Os agentes estão trabalhando. Você pode sair desta tela; o trabalho continua.</Alert>
        )}

        {project.awaiting_agent && (
          <Alert tone="warning">
            <p>
              <strong>{AGENT_META[project.awaiting_agent].name}</strong> terminou. Revise (e edite, se quiser) antes de seguir.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => onSelect(project.awaiting_agent!)}>
                Ver entrega
              </Button>
              <Button
                size="sm"
                disabled={approve.isPending}
                onClick={() => approve.mutate({ id: project.id, agent: project.awaiting_agent! })}
              >
                Aprovar e seguir
              </Button>
            </div>
          </Alert>
        )}

        {project.last_error && !generating && <Alert tone="error">{project.last_error}</Alert>}

        {!generating && manager?.status === "needs_info" && managerRun?.status === "needs_input" && (
          <QuestionsForm projectId={project.id} questions={manager.questions} />
        )}
        {!generating && manager?.status === "rejected" && (
          <Alert tone="error">
            <strong>A Gerente não pode seguir com este briefing.</strong> {manager.rejectionReason}
          </Alert>
        )}

        {error && <Alert tone="error">{error.message}</Alert>}

        <div className="flex flex-wrap gap-2">
          {generating ? (
            <Button variant="outline" size="sm" disabled={cancel.isPending} onClick={() => cancel.mutate({ id: project.id })}>
              <Square aria-hidden /> Parar
            </Button>
          ) : (
            <Button size="sm" disabled={generate.isPending} onClick={() => generate.mutate({ id: project.id })}>
              <RefreshCw aria-hidden />
              {runs.length ? "Gerar de novo" : "Chamar os agentes"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            disabled={remove.isPending}
            onClick={() => {
              if (window.confirm("Apagar este projeto e tudo o que os agentes produziram?")) remove.mutate({ id: project.id });
            }}
          >
            <Trash2 aria-hidden /> Apagar
          </Button>
        </div>
        <p className="text-xs text-stone-500">Toque num agente para ver o que ele produziu.</p>
      </Card>

      {page && (
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">Página de vendas</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge tone={page.approved_at ? "green" : "amber"}>
              {page.approved_at ? "Aprovada pela Sentinela" : "Aguardando aprovação"}
            </Badge>
            {page.published_at && <Badge tone="green">Publicada</Badge>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/app/projects/${project.id}/editor`} className={buttonVariants({ size: "sm" })}>
              <Pencil aria-hidden /> Editar e publicar
            </Link>
            {page.published_at && (
              <a href={publishedUrl(page.slug)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm", variant: "outline" })}>
                <ExternalLink aria-hidden /> Ver página
              </a>
            )}
          </div>
        </Card>
      )}

      {report.success && (
        <Card className="space-y-2 p-5">
          <h2 className="font-semibold">Revisão da Sentinela</h2>
          <SentinelReportView report={report.data} />
        </Card>
      )}

      {versions.length > 0 && (
        <Card className="space-y-2 p-5">
          <h2 className="font-semibold">Versões</h2>
          <ul className="space-y-2 text-sm">
            {versions.map((v) => (
              <li key={v.id} className="flex gap-2">
                <Badge tone={v === lastVersion ? "amber" : "neutral"}>v{v.version}</Badge>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2">{v.promise}</span>
                  <span className="text-xs text-stone-500">{new Date(v.created_at).toLocaleString("pt-BR")}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tokens > 0 && (
        <p className="px-1 text-xs text-stone-500">
          Tokens usados neste projeto: {tokens.toLocaleString("pt-BR")}. O custo fica com o provedor da chave usada.
        </p>
      )}
    </>
  );
}

function QuestionsForm({ projectId, questions }: { projectId: string; questions: string[] }) {
  const utils = trpc.useUtils();
  const answer = trpc.projects.answerQuestions.useMutation({ onSuccess: () => utils.projects.get.invalidate({ id: projectId }) });
  return (
    <form
      className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/30"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        answer.mutate({
          id: projectId,
          answers: questions.map((q, i) => ({ question: q, answer: String(f.get(`a${i}`) ?? "").trim() })).filter((a) => a.answer),
        });
      }}
    >
      <p className="font-medium">A Gerente precisa de mais informações:</p>
      {questions.map((q, i) => (
        <div key={i} className="space-y-1">
          <label htmlFor={`a${i}`}>{q}</label>
          <Textarea id={`a${i}`} name={`a${i}`} required maxLength={600} rows={2} />
        </div>
      ))}
      {answer.error && <Alert tone="error">{answer.error.message}</Alert>}
      <Button type="submit" size="sm" disabled={answer.isPending}>
        Responder e continuar
      </Button>
    </form>
  );
}

function AgentPanel({ data, agent, stateLabel, onClose }: { data: Data; agent: AgentName; stateLabel: string; onClose: () => void }) {
  const meta = AGENT_META[agent];
  const { project } = data;
  const run = latestByAgent(data.runs)[agent];
  const invalidate = useInvalidate(project.id);
  const [editing, setEditing] = useState<JsonValue | null>(null);
  const edit = trpc.projects.editDeliverable.useMutation({
    onSuccess: () => {
      setEditing(null);
      invalidate();
    },
  });
  const regenerate = trpc.projects.generate.useMutation({ onSuccess: invalidate });

  const deliverable = (run?.edited_output ?? run?.output) as JsonValue | undefined;
  const canEdit = EDITABLE.includes(agent) && run && deliverable && project.status !== "generating";
  const canRestart = (PIPELINE_ORDER as readonly string[]).includes(agent) && agent !== "manager" && project.status !== "generating" && !!run;
  const sentinel = agent === "sentinel" ? SentinelReportSchema.safeParse(deliverable) : null;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{meta.name}</h2>
          <p className="text-sm text-stone-500">{meta.title}</p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Fechar" onClick={onClose}>
          <X aria-hidden />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <Badge tone="amber">{stateLabel}</Badge>
        {run && <span>rodada {run.round}</span>}
        {run && <span className="font-mono">{run.prompt_version}</span>}
        {run?.edited_output ? <Badge tone="blue">editado por você</Badge> : null}
      </div>

      {run?.error && <Alert tone="error" className="mt-3">{run.error}</Alert>}

      <div className="mt-4 max-h-[60vh] overflow-y-auto pr-1 text-sm">
        {!run && <p className="text-stone-500">Ainda não trabalhou neste projeto.</p>}
        {run && !deliverable && run.status === "running" && <p className="text-stone-500">Trabalhando nisso agora…</p>}
        {editing !== null ? (
          <JsonField fieldKey={agent} value={editing} path={agent} onChange={setEditing} />
        ) : sentinel?.success ? (
          <SentinelReportView report={sentinel.data} />
        ) : deliverable ? (
          <JsonView value={deliverable} />
        ) : null}
      </div>

      {edit.error && <Alert tone="error" className="mt-3">{edit.error.message}</Alert>}
      {regenerate.error && <Alert tone="error" className="mt-3">{regenerate.error.message}</Alert>}

      <div className="mt-4 flex flex-wrap gap-2">
        {editing !== null ? (
          <>
            <Button size="sm" disabled={edit.isPending} onClick={() => run && edit.mutate({ runId: run.id, output: editing })}>
              Salvar edição
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            {canEdit && (
              <Button size="sm" variant="outline" onClick={() => setEditing(structuredClone(deliverable) as JsonValue)}>
                <Pencil aria-hidden /> Editar
              </Button>
            )}
            {agent === "designer" && (
              <Link href={`/app/projects/${project.id}/editor`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                <Pencil aria-hidden /> Abrir editor da página
              </Link>
            )}
            {canRestart && (
              <Button
                size="sm"
                variant="ghost"
                disabled={regenerate.isPending}
                onClick={() => regenerate.mutate({ id: project.id, startFrom: agent as (typeof PIPELINE_ORDER)[number] })}
                title="Refaz esta etapa e as seguintes, usando suas edições anteriores"
              >
                <RefreshCw aria-hidden /> Refazer a partir daqui
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
