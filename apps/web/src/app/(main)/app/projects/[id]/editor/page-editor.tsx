"use client";

import { ACCENTS, type PageBlockType, type PageDocument, PAGE_STYLES, SentinelReportSchema } from "@honeymoney/agents";
import { Alert, Badge, Button, buttonVariants, Card, cn, FieldHint, Input, Label, Select } from "@honeymoney/ui";
import { PageRenderer } from "@honeymoney/ui/page";
import { ArrowDown, ArrowLeft, ArrowUp, ChevronDown, ChevronRight, ExternalLink, Eye, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { JsonField, type JsonValue } from "@/components/json-form";
import { SentinelReportView } from "@/components/sentinel-report";
import { trpc } from "@/lib/trpc/client";
import { BLOCK_LABELS, newBlock } from "./block-templates";

export function PageEditor({ projectId }: { projectId: string }) {
  const utils = trpc.useUtils();
  const [reviewing, setReviewing] = useState(false);
  const query = trpc.pages.get.useQuery({ projectId }, { refetchInterval: reviewing ? 4000 : false });
  const [doc, setDoc] = useState<PageDocument | null>(null);
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState<number | null>(0);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [slug, setSlug] = useState("");
  const [reviewStartedAt, setReviewStartedAt] = useState<string | null>(null);

  useEffect(() => {
    if (query.data && !dirty) {
      setDoc(query.data.doc);
      setSlug(query.data.slug);
    }
  }, [query.data, dirty]);

  // Stop polling once the Sentinel has written a new report (or after 3 minutes).
  useEffect(() => {
    if (!reviewing || !query.data) return;
    if (query.data.updated_at !== reviewStartedAt) setReviewing(false);
    const t = window.setTimeout(() => setReviewing(false), 180_000);
    return () => window.clearTimeout(t);
  }, [reviewing, query.data, reviewStartedAt]);

  const refresh = () => void utils.pages.get.invalidate({ projectId });
  const save = trpc.pages.save.useMutation({ onSuccess: () => { setDirty(false); refresh(); } });
  const review = trpc.pages.requestReview.useMutation({
    onSuccess: () => {
      setReviewStartedAt(query.data?.updated_at ?? null);
      setReviewing(true);
    },
  });
  const publish = trpc.pages.publish.useMutation({ onSuccess: refresh });
  const unpublish = trpc.pages.unpublish.useMutation({ onSuccess: refresh });
  const updateSlug = trpc.pages.updateSlug.useMutation({ onSuccess: refresh });

  if (query.isLoading) return <p className="text-sm text-stone-500">Carregando a página…</p>;
  if (query.error) return <Alert tone="error">{query.error.message}</Alert>;
  if (!query.data || !doc) return <Alert tone="error">A página ainda não foi gerada pelos agentes.</Alert>;

  const page = query.data;
  const report = SentinelReportSchema.safeParse(page.sentinel_report);
  const update = (next: PageDocument) => {
    setDoc(next);
    setDirty(true);
  };
  const moveBlock = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= doc.blocks.length) return;
    const blocks = [...doc.blocks];
    [blocks[i], blocks[j]] = [blocks[j]!, blocks[i]!];
    update({ ...doc, blocks });
    setOpen(j);
  };
  const error = save.error ?? review.error ?? publish.error ?? unpublish.error ?? updateSlug.error;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/app/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Escritório
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Página de vendas</h1>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge tone={page.approved_at && !dirty ? "green" : "amber"}>
              {dirty ? "Alterações não salvas" : page.approved_at ? "Aprovada pela Sentinela" : "Precisa de revisão"}
            </Badge>
            {page.published_at && <Badge tone="green">Publicada</Badge>}
            {reviewing && <Badge tone="blue">Sentinela revisando…</Badge>}
          </div>
        </div>
        <div className="flex gap-2 lg:hidden">
          <Button size="sm" variant={mobileView === "edit" ? "default" : "outline"} onClick={() => setMobileView("edit")}>
            <Pencil aria-hidden /> Editar
          </Button>
          <Button size="sm" variant={mobileView === "preview" ? "default" : "outline"} onClick={() => setMobileView("preview")}>
            <Eye aria-hidden /> Ver
          </Button>
        </div>
      </div>

      {error && <Alert tone="error" className="mb-4">{error.message}</Alert>}

      <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
        <div className={cn("space-y-4", mobileView === "preview" && "hidden lg:block")}>
          <Card className="space-y-4 p-5">
            <h2 className="font-semibold">Publicação</h2>
            <div className="space-y-1.5">
              <Label htmlFor="checkout">Link de checkout</Label>
              <Input
                id="checkout"
                type="url"
                placeholder="https://pay.hotmart.com/… ou seu link de pagamento"
                value={doc.checkoutUrl}
                onChange={(e) => update({ ...doc, checkoutUrl: e.target.value.trim() })}
              />
              <FieldHint>Os botões da página levam para este link (precisa começar com https://).</FieldHint>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Endereço</Label>
              <div className="flex gap-2">
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} maxLength={48} />
                <Button
                  variant="outline"
                  disabled={slug === page.slug || updateSlug.isPending}
                  onClick={() => updateSlug.mutate({ projectId, slug })}
                >
                  Salvar
                </Button>
              </div>
              <FieldHint className="break-all">{page.url}</FieldHint>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="accent">Cor</Label>
                <Select
                  id="accent"
                  value={doc.theme.accent}
                  onChange={(e) => update({ ...doc, theme: { ...doc.theme, accent: e.target.value as PageDocument["theme"]["accent"] } })}
                >
                  {ACCENTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="style">Estilo</Label>
                <Select
                  id="style"
                  value={doc.theme.style}
                  onChange={(e) => update({ ...doc, theme: { ...doc.theme, style: e.target.value as PageDocument["theme"]["style"] } })}
                >
                  {PAGE_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s === "clean" ? "Leve" : "Marcante"}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-stone-200 pt-4 dark:border-stone-800">
              <Button disabled={!dirty || save.isPending} onClick={() => save.mutate({ projectId, doc })}>
                {save.isPending ? "Salvando…" : "Salvar"}
              </Button>
              <Button
                variant="outline"
                disabled={dirty || reviewing || review.isPending}
                onClick={() => review.mutate({ projectId })}
                title={dirty ? "Salve antes de pedir revisão" : undefined}
              >
                <ShieldCheck aria-hidden /> Pedir revisão
              </Button>
              {page.published_at ? (
                <>
                  <Button disabled={dirty || page.blockers.length > 0 || publish.isPending} onClick={() => publish.mutate({ projectId })}>
                    Atualizar publicação
                  </Button>
                  <Button variant="ghost" disabled={unpublish.isPending} onClick={() => unpublish.mutate({ projectId })}>
                    Despublicar
                  </Button>
                </>
              ) : (
                <Button disabled={dirty || page.blockers.length > 0 || publish.isPending} onClick={() => publish.mutate({ projectId })}>
                  Publicar
                </Button>
              )}
            </div>
            {publish.data && (
              <Alert tone="success">
                Publicada!{" "}
                <a href={publish.data.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline">
                  Abrir página <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </Alert>
            )}
            {!dirty && page.blockers.length > 0 && (
              <Alert tone="warning">
                <p className="font-medium">Antes de publicar:</p>
                <ul className="mt-1 list-disc pl-5">
                  {page.blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
                {dirty ? null : <p className="mt-1 text-xs">Depois de editar, salve e peça uma nova revisão da Sentinela.</p>}
              </Alert>
            )}
            {page.published_at && (
              <a href={page.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "link", size: "sm" })}>
                Ver página publicada <ExternalLink aria-hidden />
              </a>
            )}
          </Card>

          {report.success && (
            <Card className="p-5">
              <h2 className="mb-2 font-semibold">Última revisão da Sentinela</h2>
              <SentinelReportView report={report.data} />
            </Card>
          )}

          <Card className="p-3">
            <h2 className="px-2 pb-2 pt-1 font-semibold">Blocos</h2>
            <ol className="space-y-2">
              {doc.blocks.map((block, i) => (
                <li key={i} className="rounded-lg border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center gap-1 p-2">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-1 text-left text-sm font-medium"
                      onClick={() => setOpen(open === i ? null : i)}
                      aria-expanded={open === i}
                    >
                      {open === i ? <ChevronDown className="h-4 w-4 shrink-0" aria-hidden /> : <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />}
                      <span className="truncate">{BLOCK_LABELS[block.type]}</span>
                    </button>
                    <Button variant="ghost" size="icon" aria-label="Mover para cima" disabled={i === 0} onClick={() => moveBlock(i, -1)}>
                      <ArrowUp aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Mover para baixo" disabled={i === doc.blocks.length - 1} onClick={() => moveBlock(i, 1)}>
                      <ArrowDown aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover bloco"
                      disabled={doc.blocks.length <= 1}
                      onClick={() => update({ ...doc, blocks: doc.blocks.filter((_, j) => j !== i) })}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                  {open === i && (
                    <div className="border-t border-stone-200 p-3 dark:border-stone-700">
                      <JsonField
                        fieldKey={`block-${i}`}
                        path={`block-${i}`}
                        value={block as unknown as JsonValue}
                        onChange={(v) =>
                          update({ ...doc, blocks: doc.blocks.map((b, j) => (j === i ? (v as unknown as typeof b) : b)) })
                        }
                      />
                    </div>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-3 flex items-center gap-2 px-2 pb-2">
              <Select id="new-block" aria-label="Tipo do novo bloco" defaultValue="text" className="flex-1">
                {(Object.keys(BLOCK_LABELS) as PageBlockType[]).map((t) => (
                  <option key={t} value={t}>
                    {BLOCK_LABELS[t]}
                  </option>
                ))}
              </Select>
              <Button
                variant="outline"
                disabled={doc.blocks.length >= 30}
                onClick={() => {
                  const select = document.getElementById("new-block") as HTMLSelectElement | null;
                  const type = (select?.value ?? "text") as PageBlockType;
                  update({ ...doc, blocks: [...doc.blocks, newBlock(type)] });
                  setOpen(doc.blocks.length);
                }}
              >
                <Plus aria-hidden /> Bloco
              </Button>
            </div>
          </Card>
        </div>

        <div className={cn(mobileView === "edit" && "hidden lg:block")}>
          <div className="sticky top-4 overflow-hidden rounded-xl border border-stone-200 shadow-sm dark:border-stone-700">
            <div className="flex items-center gap-1.5 border-b border-stone-200 bg-stone-100 px-3 py-2 dark:border-stone-700 dark:bg-stone-800">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-2 truncate text-xs text-stone-500">{page.url}</span>
            </div>
            <div className="max-h-[80vh] overflow-y-auto">
              <PageRenderer doc={doc} preview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
