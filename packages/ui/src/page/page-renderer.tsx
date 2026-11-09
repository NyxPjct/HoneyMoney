import type { PageBlock, PageDocument } from "@honeymoney/agents";
import type { ReactNode } from "react";
import { cn } from "../cn";

type Accent = PageDocument["theme"]["accent"];

/** Literal class names so Tailwind can see them. */
const ACCENT: Record<Accent, { bg: string; text: string; soft: string; border: string; button: string }> = {
  amber: { bg: "bg-amber-500", text: "text-amber-700", soft: "bg-amber-50", border: "border-amber-200", button: "bg-amber-500 text-stone-950 hover:bg-amber-400" },
  emerald: { bg: "bg-emerald-600", text: "text-emerald-700", soft: "bg-emerald-50", border: "border-emerald-200", button: "bg-emerald-600 text-white hover:bg-emerald-500" },
  sky: { bg: "bg-sky-600", text: "text-sky-700", soft: "bg-sky-50", border: "border-sky-200", button: "bg-sky-600 text-white hover:bg-sky-500" },
  violet: { bg: "bg-violet-600", text: "text-violet-700", soft: "bg-violet-50", border: "border-violet-200", button: "bg-violet-600 text-white hover:bg-violet-500" },
  rose: { bg: "bg-rose-600", text: "text-rose-700", soft: "bg-rose-50", border: "border-rose-200", button: "bg-rose-600 text-white hover:bg-rose-500" },
  slate: { bg: "bg-slate-800", text: "text-slate-700", soft: "bg-slate-50", border: "border-slate-200", button: "bg-slate-800 text-white hover:bg-slate-700" },
};

/** Only https links are ever rendered as hrefs. */
export function safeCheckoutUrl(url: string): string | null {
  return /^https:\/\/[^\s<>"']+$/i.test(url) ? url : null;
}

function Cta({ label, doc, preview }: { label: string; doc: PageDocument; preview: boolean }) {
  const href = safeCheckoutUrl(doc.checkoutUrl);
  const cls = cn(
    "inline-flex min-h-12 items-center justify-center rounded-xl px-8 py-3 text-base font-semibold shadow-sm transition",
    ACCENT[doc.theme.accent].button,
  );
  if (href) {
    return (
      <a href={href} className={cls} rel="noopener noreferrer nofollow" target="_blank">
        {label}
      </a>
    );
  }
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span className={cn(cls, "cursor-not-allowed opacity-70")} aria-disabled>
        {label}
      </span>
      {preview && <span className="text-xs text-stone-500">Configure o link de checkout para ativar o botão.</span>}
    </span>
  );
}

function Section({ children, soft, doc }: { children: ReactNode; soft?: boolean; doc: PageDocument }) {
  return (
    <section className={cn("px-5 py-12 sm:py-16", soft && ACCENT[doc.theme.accent].soft)}>
      <div className="mx-auto max-w-3xl">{children}</div>
    </section>
  );
}

function H2({ children, doc }: { children: ReactNode; doc: PageDocument }) {
  return (
    <h2 className={cn("mb-6 text-2xl font-bold tracking-tight sm:text-3xl", doc.theme.style === "bold" && "uppercase")}>
      {children}
      <span className={cn("mt-3 block h-1 w-12 rounded-full", ACCENT[doc.theme.accent].bg)} />
    </h2>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-lg leading-relaxed text-stone-700">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

export function renderBlock(block: PageBlock, doc: PageDocument, preview: boolean, index: number) {
  const accent = ACCENT[doc.theme.accent];
  switch (block.type) {
    case "hero":
      return (
        <header
          className={cn(
            "px-5 py-16 text-center sm:py-24",
            doc.theme.style === "bold" ? cn(accent.bg, "text-white") : accent.soft,
          )}
        >
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{block.headline}</h1>
            <p className={cn("mx-auto mt-5 max-w-2xl text-lg sm:text-xl", doc.theme.style === "bold" ? "text-white/90" : "text-stone-600")}>
              {block.subheadline}
            </p>
            <div className="mt-8">
              <Cta label={block.ctaLabel} doc={doc} preview={preview} />
            </div>
          </div>
        </header>
      );
    case "problem":
    case "solution":
    case "text":
      return (
        <Section doc={doc} soft={block.type === "solution"}>
          <H2 doc={doc}>{block.title}</H2>
          <Paragraphs text={block.text} />
        </Section>
      );
    case "benefits":
      return (
        <Section doc={doc}>
          <H2 doc={doc}>{block.title}</H2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {block.items.map((item, i) => (
              <li key={i} className={cn("flex gap-3 rounded-xl border bg-white p-4", accent.border)}>
                <span aria-hidden className={cn("mt-1 h-5 w-5 shrink-0 rounded-full", accent.bg)} />
                <span className="text-stone-800">{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      );
    case "modules":
    case "bonuses":
      return (
        <Section doc={doc} soft={block.type === "bonuses"}>
          <H2 doc={doc}>{block.title}</H2>
          <ol className="space-y-3">
            {block.items.map((item, i) => (
              <li key={i} className={cn("rounded-xl border bg-white p-5", accent.border)}>
                <p className="font-semibold">
                  <span className={cn("mr-2", accent.text)}>{block.type === "modules" ? `${i + 1}.` : "+"}</span>
                  {item.title}
                </p>
                <p className="mt-1 text-stone-600">{item.description}</p>
              </li>
            ))}
          </ol>
        </Section>
      );
    case "audience":
      return (
        <Section doc={doc}>
          <H2 doc={doc}>{block.title}</H2>
          <div className="grid gap-6 sm:grid-cols-2">
            <ul className="space-y-2">
              {block.forWho.map((item, i) => (
                <li key={i} className="flex gap-2 text-stone-800">
                  <span aria-hidden className="text-emerald-600">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            {block.notForWho.length > 0 && (
              <ul className="space-y-2">
                {block.notForWho.map((item, i) => (
                  <li key={i} className="flex gap-2 text-stone-600">
                    <span aria-hidden className="text-red-500">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      );
    case "price":
      return (
        <Section doc={doc} soft>
          <div className={cn("mx-auto max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm", accent.border)}>
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">{block.title}</p>
            <p className="my-4 text-4xl font-extrabold">{block.priceLabel}</p>
            <Cta label={block.ctaLabel} doc={doc} preview={preview} />
            {block.note && <p className="mt-4 text-sm text-stone-500">{block.note}</p>}
          </div>
        </Section>
      );
    case "guarantee":
      return (
        <Section doc={doc}>
          <div className={cn("flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-center", accent.border, accent.soft)}>
            <span aria-hidden className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl text-white", accent.bg)}>
              ✓
            </span>
            <div>
              <h2 className="text-xl font-bold">{block.title}</h2>
              <p className="mt-1 text-stone-700">{block.text}</p>
            </div>
          </div>
        </Section>
      );
    case "faq":
      return (
        <Section doc={doc}>
          <H2 doc={doc}>{block.title}</H2>
          <div className="space-y-3">
            {block.items.map((item, i) => (
              <details key={i} className={cn("group rounded-xl border bg-white p-4", accent.border)} open={index === -1}>
                <summary className="cursor-pointer list-none font-semibold">{item.question}</summary>
                <p className="mt-2 text-stone-600">{item.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      );
    case "cta":
      return (
        <section className={cn("px-5 py-16 text-center text-white", accent.bg)}>
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">{block.headline}</h2>
            <div className="mt-6 [&_a]:bg-white [&_a]:text-stone-900 [&_span]:bg-white [&_span]:text-stone-900">
              <Cta label={block.ctaLabel} doc={doc} preview={preview} />
            </div>
          </div>
        </section>
      );
  }
}

/** Renders a sales page. Text only: user and model content never becomes HTML. */
export function PageRenderer({ doc, preview = false, className }: { doc: PageDocument; preview?: boolean; className?: string }) {
  return (
    <div className={cn("bg-white text-stone-900", className)}>
      {doc.blocks.map((block, i) => (
        <div key={i} data-block={block.type}>
          {renderBlock(block, doc, preview, i)}
        </div>
      ))}
      <footer className="border-t border-stone-200 px-5 py-8 text-center text-xs text-stone-500">
        Página criada com HoneyMoney, ferramenta gratuita e open source. O conteúdo é de responsabilidade do autor.
      </footer>
    </div>
  );
}
