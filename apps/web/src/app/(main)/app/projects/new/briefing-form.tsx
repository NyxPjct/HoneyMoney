"use client";

import { CURRENCIES, LOCALES, PRODUCT_FORMATS } from "@honeymoney/agents";
import { Alert, Button, Card, FieldHint, Input, Label, Select, Textarea } from "@honeymoney/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FORMAT_LABELS, LOCALE_LABELS, PROVIDER_LABELS } from "@/lib/labels";
import { trpc } from "@/lib/trpc/client";

/** "27", "27,90", "1.297,00" or "19.99" -> cents. */
export function parsePriceToCents(raw: string): number | undefined {
  const cleaned = raw.trim().replace(/[^\d.,]/g, "");
  if (!cleaned) return undefined;
  const normalized = /,\d{1,2}$/.test(cleaned) ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, "");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : undefined;
}

export function BriefingForm() {
  const router = useRouter();
  const keys = trpc.keys.list.useQuery();
  const [reviewEachStep, setReviewEachStep] = useState(false);
  const create = trpc.projects.create.useMutation({
    onSuccess: ({ id }) => router.push(`/app/projects/${id}`),
  });

  const providers = [
    ...(keys.data?.instance.available ? (["instance"] as const) : []),
    ...(keys.data?.keys.map((k) => k.provider) ?? []),
  ];
  const noProvider = keys.isSuccess && providers.length === 0;

  return (
    <form
      className="mt-6 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const str = (k: string) => String(f.get(k) ?? "").trim();
        create.mutate({
          name: str("name"),
          aiProvider: str("aiProvider") as "instance",
          reviewEachStep,
          briefing: {
            skill: str("skill"),
            audience: str("audience"),
            format: str("format") as "ebook",
            formatDetails: str("formatDetails") || undefined,
            priceCents: parsePriceToCents(str("price")),
            currency: str("currency") as "BRL",
            language: str("language") as "pt-BR",
            extra: str("extra") || undefined,
          },
        });
      }}
    >
      <Card className="space-y-5 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome do projeto</Label>
          <Input id="name" name="name" required maxLength={120} placeholder="Ex.: Planilha de orçamento para CLT" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="skill">O que você sabe fazer?</Label>
          <Textarea
            id="skill"
            name="skill"
            required
            minLength={3}
            maxLength={600}
            placeholder="Ex.: Organizo o orçamento da minha família há 10 anos com uma planilha simples."
          />
          <FieldHint>Sua experiência real é a base do produto.</FieldHint>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="audience">Quem você quer ajudar?</Label>
          <Textarea
            id="audience"
            name="audience"
            required
            minLength={3}
            maxLength={600}
            placeholder="Ex.: Pessoas CLT que chegam ao fim do mês sem saber para onde foi o salário."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="format">Formato</Label>
            <Select id="format" name="format" defaultValue="ebook">
              {PRODUCT_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {FORMAT_LABELS[f]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="formatDetails">Detalhes do formato (opcional)</Label>
            <Input id="formatDetails" name="formatDetails" maxLength={300} placeholder="Ex.: 40 páginas, PDF" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">Preço que você imagina (opcional)</Label>
            <Input id="price" name="price" inputMode="decimal" placeholder="Ex.: 27,00" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Moeda</Label>
            <Select id="currency" name="currency" defaultValue="BRL">
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="language">Idioma da oferta</Label>
            <Select id="language" name="language" defaultValue="pt-BR">
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_LABELS[l]}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="extra">Algo mais que os agentes devem saber? (opcional)</Label>
          <Textarea id="extra" name="extra" maxLength={1500} placeholder="Diferenciais, tom de voz, o que você não quer…" />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="aiProvider">Modelo de IA</Label>
          <Select id="aiProvider" name="aiProvider" disabled={noProvider} required>
            {providers.map((p) => (
              <option key={p} value={p}>
                {PROVIDER_LABELS[p]}
              </option>
            ))}
          </Select>
          {noProvider ? (
            <Alert tone="warning">
              Nenhum modelo disponível. <Link href="/app/settings" className="underline">Adicione sua chave de IA</Link>{" "}
              para começar.
            </Alert>
          ) : (
            <FieldHint>
              O custo de IA é de quem roda. Com sua chave, você paga direto ao provedor; o modelo gratuito tem limite diário.
            </FieldHint>
          )}
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-amber-500"
            checked={reviewEachStep}
            onChange={(e) => setReviewEachStep(e.target.checked)}
          />
          <span>
            <strong>Revisar cada etapa.</strong> Os agentes param depois de cada entrega para você editar e aprovar antes de
            seguir.
          </span>
        </label>
      </Card>

      {create.error && <Alert tone="error">{create.error.message}</Alert>}
      <div className="flex justify-end gap-3">
        <Link href="/app" className="inline-flex h-10 items-center px-4 text-sm text-stone-600 hover:underline">
          Cancelar
        </Link>
        <Button type="submit" disabled={create.isPending || noProvider || keys.isLoading}>
          {create.isPending ? "Chamando os agentes…" : "Criar e chamar os agentes"}
        </Button>
      </div>
    </form>
  );
}
