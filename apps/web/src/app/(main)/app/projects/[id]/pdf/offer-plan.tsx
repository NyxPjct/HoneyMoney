import type { AudienceMap, Briefing, Copy, OfferSkeleton, PageDocument } from "@honeymoney/agents";
import { pageTokens } from "@honeymoney/ui/page";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { FORMAT_LABELS } from "@/lib/labels";
import { PrintButton } from "./print-button";


const display =
  "font-[family-name:var(--hm-display)] [font-weight:var(--hm-display-weight)] tracking-[var(--hm-display-tracking)]";

function money(cents: number, currency: string) {
  const locale = currency === "BRL" ? "pt-BR" : currency === "EUR" ? "es-ES" : "en-US";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

/** One A4 sheet on screen; on paper the browser paginates the content. */
function Sheet({ children, cover = false }: { children: ReactNode; cover?: boolean }) {
  return (
    <section
      className={
        cover
          ? "pdf-sheet pdf-cover relative flex min-h-[297mm] flex-col overflow-hidden p-[18mm] text-[var(--hm-on-accent)] [background:var(--hm-band)]"
          : "pdf-sheet bg-white px-[18mm] py-[16mm] text-[#1f1d1b]"
      }
    >
      {children}
    </section>
  );
}

function Chapter({ n, title, intro, children }: { n: number; title: string; intro?: string; children: ReactNode }) {
  return (
    <Sheet>
      <header className="mb-8 border-b-2 border-[var(--hm-accent)] pb-5">
        <p className="text-sm font-semibold text-[var(--hm-accent-strong)]">Capítulo {n}</p>
        <h2 className={`${display} mt-1 text-[2rem] leading-tight`}>{title}</h2>
        {intro && <p className="mt-2 max-w-[60ch] text-[0.95rem] text-[#5d5852]">{intro}</p>}
      </header>
      <div className="space-y-8">{children}</div>
    </Sheet>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pdf-avoid">
      <h3 className="mb-3 text-[1.05rem] font-bold">{title}</h3>
      <div className="text-[0.95rem] leading-relaxed text-[#3b3834]">{children}</div>
    </div>
  );
}

function Bullets({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5">
          <span aria-hidden className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--hm-accent)]" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

const NEXT_STEPS = [
  "Produza o material seguindo os módulos e aulas do capítulo 2. Comece pela vitória rápida do primeiro módulo.",
  "Cadastre o produto numa plataforma de pagamento (por exemplo Hotmart, Kiwify ou Eduzz) com o preço sugerido e a garantia de 7 dias.",
  "Cole o link de checkout no editor da página, peça a revisão da Sentinela e publique.",
  "Programe os e-mails do capítulo 4 na sua ferramenta de e-mail, trocando [link] pelo link da página.",
  "Teste os anúncios do capítulo 5 com um orçamento pequeno e fique com o que trouxer mais visitas qualificadas.",
  "Responda às dúvidas de quem comprar e use as perguntas para melhorar a página e o material.",
];

export type OfferPlanProps = {
  projectId: string;
  offer: OfferSkeleton;
  copy: Copy;
  audience?: AudienceMap;
  briefing?: Briefing;
  theme: PageDocument["theme"];
};

/** The offer plan as A4 sheets: printed to PDF by the browser. */
export function OfferPlan({ projectId: id, offer, copy, audience, briefing, theme }: OfferPlanProps) {
  const today = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date());
  const formatLabel = FORMAT_LABELS[offer.format] ?? offer.format;

  return (
    <div style={pageTokens({ ...theme, style: theme.style === "dark" || theme.style === "luxury" ? "clean" : theme.style }) as CSSProperties}>
      <style>{`
        @page { size: A4; margin: 16mm 0 14mm; }
        @page :first { margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          .pdf-toolbar { display: none !important; }
          .pdf-sheet { box-shadow: none !important; margin: 0 !important; break-after: page; padding-top: 0 !important; padding-bottom: 0 !important; }
          .pdf-cover { height: 296mm !important; min-height: 0 !important; padding: 18mm !important; }
          .pdf-sheet:last-child { break-after: auto; }
          .pdf-avoid { break-inside: avoid; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="pdf-toolbar mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/app/projects/${id}`} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Escritório
        </Link>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-stone-500 sm:block">Na janela de impressão, escolha “Salvar como PDF”.</p>
          <PrintButton />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[210mm] space-y-8 font-[family-name:var(--hm-body)] print:max-w-none print:space-y-0 [&>.pdf-sheet]:shadow-[0_10px_40px_-12px_rgb(0_0_0/0.25)]">
        <Sheet cover>
          <span aria-hidden className="pointer-events-none absolute -bottom-40 -right-40 h-[150mm] w-[150mm] rounded-full bg-white/10" />
          <span aria-hidden className="pointer-events-none absolute -bottom-10 -right-10 h-[80mm] w-[80mm] rounded-full bg-white/10" />
          <p className="text-sm font-semibold opacity-85">Plano da oferta · {formatLabel}</p>
          <div className="relative mt-auto">
            <h1 className={`${display} text-[3.4rem] leading-[1.02]`}>{offer.productName}</h1>
            <p className="mt-6 max-w-[48ch] text-xl leading-snug opacity-95">{offer.promise}</p>
            {offer.bigIdea && <p className="mt-6 max-w-[52ch] border-l-2 border-current pl-4 opacity-90">{offer.bigIdea}</p>}
          </div>
          <dl className="relative mt-16 grid grid-cols-3 gap-6 border-t border-current/30 pt-6 text-sm">
            <div>
              <dt className="opacity-75">Preço sugerido</dt>
              <dd className="mt-1 text-lg font-bold">{money(offer.suggestedPrice.amountCents, offer.suggestedPrice.currency)}</dd>
            </div>
            <div>
              <dt className="opacity-75">Conteúdo</dt>
              <dd className="mt-1 text-lg font-bold">{offer.modules.length} módulos{offer.bonuses.length ? ` + ${offer.bonuses.length} bônus` : ""}</dd>
            </div>
            <div>
              <dt className="opacity-75">Preparado em</dt>
              <dd className="mt-1 text-lg font-bold">{today}</dd>
            </div>
          </dl>
          <p className="relative mt-8 text-xs opacity-75">
            Preparado com os agentes do HoneyMoney. Revise e adapte antes de usar. Nenhum resultado é garantido.
          </p>
        </Sheet>

        <Sheet>
          <h2 className={`${display} mb-6 text-[2rem]`}>Sumário</h2>
          <ol className="divide-y divide-[#e7e3dd] border-y border-[#e7e3dd]">
            {[
              ["Seu público", "quem vai comprar, o que sente e o que pensa"],
              ["A oferta", "promessa, transformação, conteúdo do produto, bônus, preço e garantia"],
              ["Página de vendas", "textos prontos para cada parte da página"],
              ["E-mails", "sequência de lançamento e acompanhamento"],
              ["Anúncios", "variações para Instagram e Facebook"],
              ["Próximos passos", "o que fazer a partir de agora"],
            ].map(([t, s], i) => (
              <li key={t} className="flex items-baseline gap-5 py-4">
                <span className={`${display} w-8 text-2xl text-[var(--hm-accent)]`}>{i + 1}</span>
                <span>
                  <span className="block font-bold">{t}</span>
                  <span className="text-sm text-[#5d5852]">{s}</span>
                </span>
              </li>
            ))}
          </ol>
          {briefing && (
            <div className="mt-10 rounded-lg bg-[var(--hm-accent-soft)] p-6 text-[0.95rem] leading-relaxed">
              <p className="mb-2 font-bold">O ponto de partida (seu briefing)</p>
              <p className="text-[#3b3834]">{briefing.skill}</p>
              <p className="mt-2 text-[#3b3834]">
                <strong>Para quem:</strong> {briefing.audience}
              </p>
            </div>
          )}
        </Sheet>

        {audience && (
          <Chapter n={1} title="Seu público" intro={audience.audienceProfile}>
            <div className="grid grid-cols-2 gap-x-10 gap-y-8">
              <Block title="Nicho">
                <p>
                  {audience.niche} — {audience.subNiche}
                </p>
              </Block>
              <Block title="Vocabulário que eles usam">
                <p>{audience.vocabulary.join(", ")}</p>
              </Block>
              <Block title="Dores">
                <Bullets items={audience.pains} />
              </Block>
              <Block title="Desejos">
                <Bullets items={audience.desires} />
              </Block>
              <Block title="Objeções">
                <Bullets items={audience.objections} />
              </Block>
              {audience.failedAttempts && (
                <Block title="O que já tentaram">
                  <Bullets items={audience.failedAttempts} />
                </Block>
              )}
              {audience.triggers && (
                <Block title="Momentos que levam a buscar uma solução">
                  <Bullets items={audience.triggers} />
                </Block>
              )}
            </div>
          </Chapter>
        )}

        <Chapter n={2} title="A oferta" intro={offer.promise}>
          {offer.transformation && (
            <div className="pdf-avoid grid grid-cols-2 overflow-hidden rounded-lg border border-[#e7e3dd] text-[0.95rem]">
              <div className="bg-[#f6f4f1] p-5">
                <p className="mb-2 font-bold text-[#5d5852]">Antes</p>
                <p>{offer.transformation.before}</p>
              </div>
              <div className="bg-[var(--hm-accent-soft)] p-5">
                <p className="mb-2 font-bold text-[var(--hm-accent-strong)]">Depois</p>
                <p>{offer.transformation.after}</p>
              </div>
            </div>
          )}
          <Block title={`Conteúdo do produto (${formatLabel.toLowerCase()})`}>
            <ol className="space-y-5">
              {offer.modules.map((m, i) => (
                <li key={i} className="pdf-avoid grid grid-cols-[2.5rem_1fr] gap-3">
                  <span className={`${display} text-2xl leading-none text-[var(--hm-accent)]`}>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <p className="font-bold text-[#1f1d1b]">{m.title}</p>
                    <p className="mt-1">{m.description}</p>
                    <ul className="mt-2 list-disc space-y-0.5 pl-5 text-[0.9rem]">
                      {m.lessons.map((l, j) => (
                        <li key={j}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          </Block>
          {offer.bonuses.length > 0 && (
            <Block title="Bônus">
              <ul className="space-y-2">
                {offer.bonuses.map((b, i) => (
                  <li key={i}>
                    <strong className="text-[#1f1d1b]">{b.title}:</strong> {b.description}
                  </li>
                ))}
              </ul>
            </Block>
          )}
          <div className="pdf-avoid grid grid-cols-2 gap-8">
            <Block title={`Preço sugerido: ${money(offer.suggestedPrice.amountCents, offer.suggestedPrice.currency)}`}>
              <p>{offer.suggestedPrice.rationale}</p>
            </Block>
            <Block title="Garantia">
              <p>{offer.guarantee}</p>
            </Block>
          </div>
          <Block title="Diferenciais">
            <Bullets items={offer.differentiators} />
          </Block>
          <Block title="Por que este formato">
            <p>{offer.formatRationale}</p>
          </Block>
        </Chapter>

        <Chapter n={3} title="Página de vendas" intro="Os textos de cada parte da página, para revisar e reaproveitar.">
          <div className="pdf-avoid rounded-lg border-l-4 border-[var(--hm-accent)] bg-[#f6f4f1] p-6">
            <p className={`${display} text-2xl leading-snug text-[#1f1d1b]`}>{copy.headline}</p>
            <p className="mt-2">{copy.subheadline}</p>
            <p className="mt-4 text-sm text-[#5d5852]">
              Botão: <strong>{copy.salesPage.cta}</strong>
              {copy.salesPage.ctaMicrocopy ? ` · ${copy.salesPage.ctaMicrocopy}` : ""}
            </p>
          </div>
          <Block title="Abertura">
            <Prose text={copy.salesPage.hook} />
          </Block>
          <Block title="Problema">
            <Prose text={copy.salesPage.problem} />
          </Block>
          <Block title="Solução">
            <Prose text={copy.salesPage.solution} />
          </Block>
          <Block title="Benefícios">
            <Bullets items={copy.salesPage.benefits} />
          </Block>
          <div className="grid grid-cols-2 gap-8">
            <Block title="Para quem é">
              <Bullets items={copy.salesPage.forWho} />
            </Block>
            <Block title="Para quem não é">
              <Bullets items={copy.salesPage.notForWho} />
            </Block>
          </div>
          {copy.salesPage.authorStory && (
            <Block title="Quem criou">
              <Prose text={copy.salesPage.authorStory} />
            </Block>
          )}
          <Block title="Perguntas frequentes">
            <dl className="space-y-4">
              {copy.salesPage.faq.map((f, i) => (
                <div key={i} className="pdf-avoid">
                  <dt className="font-semibold text-[#1f1d1b]">{f.question}</dt>
                  <dd className="mt-1">{f.answer}</dd>
                </div>
              ))}
            </dl>
          </Block>
          <Block title="Garantia">
            <p>{copy.salesPage.guaranteeText}</p>
          </Block>
        </Chapter>

        <Chapter n={4} title="E-mails" intro="Troque [link] pelo endereço da sua página antes de enviar.">
          {copy.emails.map((e, i) => (
            <div key={i} className="pdf-avoid rounded-lg border border-[#e7e3dd] p-6">
              <p className="text-sm text-[#5d5852]">E-mail {i + 1}</p>
              <p className="mt-1 text-lg font-bold">{e.subject}</p>
              <div className="mt-3 text-[0.93rem] leading-relaxed text-[#3b3834]">
                <Prose text={e.body} />
              </div>
            </div>
          ))}
        </Chapter>

        <Chapter n={5} title="Anúncios" intro="Cada variação usa um ângulo diferente. Teste e fique com as que funcionarem melhor.">
          <div className="grid grid-cols-2 gap-5">
            {copy.ads.map((a, i) => (
              <div key={i} className="pdf-avoid flex flex-col rounded-lg border border-[#e7e3dd] p-5 text-[0.92rem]">
                <p className="text-sm text-[#5d5852]">Variação {i + 1}</p>
                <p className="mt-2 whitespace-pre-line leading-relaxed">{a.primaryText}</p>
                <div className="mt-auto border-t border-[#e7e3dd] pt-3">
                  <p className="font-bold">{a.headline}</p>
                  <p className="text-[#5d5852]">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Chapter>

        <Chapter n={6} title="Próximos passos">
          <ol className="space-y-5">
            {NEXT_STEPS.map((s, i) => (
              <li key={i} className="pdf-avoid flex gap-4 text-[0.98rem] leading-relaxed">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--hm-accent)] font-bold text-[var(--hm-on-accent)]">
                  {i + 1}
                </span>
                <span className="pt-1">{s}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-[#5d5852]">
            Lembrete: não prometa renda, resultados garantidos nem cura. A garantia é de reembolso, não de resultado.
          </p>
        </Chapter>
      </div>
    </div>
  );
}
