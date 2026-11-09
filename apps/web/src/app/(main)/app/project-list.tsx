"use client";

import { Badge, buttonVariants, Card } from "@honeymoney/ui";
import { Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { PROVIDER_LABELS, STATUS_LABELS } from "@/lib/labels";
import { trpc } from "@/lib/trpc/client";

export function ProjectList() {
  const projects = trpc.projects.list.useQuery();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seus projetos</h1>
          <p className="text-sm text-stone-500">Cada oferta é um projeto com histórico de versões.</p>
        </div>
        <Link href="/app/projects/new" className={buttonVariants()}>
          <Plus aria-hidden />
          Nova oferta
        </Link>
      </div>

      {projects.isLoading && <p className="mt-8 text-sm text-stone-500">Carregando…</p>}
      {projects.error && <p className="mt-8 text-sm text-red-600">{projects.error.message}</p>}

      {projects.data?.length === 0 && (
        <Card className="mt-8 flex flex-col items-center gap-3 p-10 text-center">
          <Sparkles className="h-8 w-8 text-amber-500" aria-hidden />
          <h2 className="text-lg font-semibold">Nenhuma oferta ainda</h2>
          <p className="max-w-md text-sm text-stone-500">
            Conte o que você sabe fazer e para quem. Os agentes cuidam da pesquisa, da estrutura, da copy e da página.
          </p>
          <Link href="/app/projects/new" className={buttonVariants()}>
            Criar minha primeira oferta
          </Link>
        </Card>
      )}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.data?.map((p) => {
          const status = STATUS_LABELS[p.status] ?? STATUS_LABELS.draft!;
          return (
            <li key={p.id}>
              <Link href={`/app/projects/${p.id}`} className="block h-full">
                <Card className="h-full p-5 transition hover:border-amber-300 hover:shadow">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="line-clamp-2 font-semibold">{p.name}</h2>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-stone-500">{PROVIDER_LABELS[p.ai_provider]}</p>
                  <p className="text-xs text-stone-500">
                    Atualizado em {new Date(p.updated_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
