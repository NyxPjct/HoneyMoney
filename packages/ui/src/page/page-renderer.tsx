import type { PageBlock, PageDocument } from "@honeymoney/agents";
import { Check, Gift, Plus, X } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "../cn";
import { pageTokens } from "./theme";

/** Only https links are ever rendered as hrefs. */
export function safeCheckoutUrl(url: string): string | null {
  return /^https:\/\/[^\s<>"']+$/i.test(url) ? url : null;
}

type Ctx = { doc: PageDocument; preview: boolean };

// Every colour comes from the CSS variables set by pageTokens(), so one set of classes serves
// all accents and styles.
const ink = "text-[var(--hm-ink)]";
const muted = "text-[var(--hm-muted)]";
const display = "font-[family-name:var(--hm-display)] [font-weight:var(--hm-display-weight)] tracking-[var(--hm-display-tracking)]";

function Cta({ label, ctx, inverted = false, wide = false }: { label: string; ctx: Ctx; inverted?: boolean; wide?: boolean }) {
  const href = safeCheckoutUrl(ctx.doc.checkoutUrl);
  const cls = cn(
    "inline-flex min-h-14 items-center justify-center gap-2 rounded-[var(--hm-radius-button)] px-8 py-3 text-center text-base font-bold",
    "transition-[filter,transform] duration-150 hover:brightness-110 active:translate-y-px",
    "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--hm-accent)]",
    inverted
      ? "bg-[var(--hm-on-accent)] text-[var(--hm-accent-strong)] shadow-[0_6px_0_rgb(0_0_0/0.15)]"
      : "bg-[var(--hm-accent)] text-[var(--hm-on-accent)] shadow-[0_6px_0_var(--hm-accent-strong)]",
    wide && "w-full",
  );
  if (href) {
    return (
      <a href={href} className={cls} rel="noopener noreferrer nofollow" target="_blank">
        {label}
      </a>
    );
  }
  return (
    <span className={cn("inline-flex flex-col items-center gap-2", wide && "w-full")}>
      <span className={cn(cls, "cursor-not-allowed opacity-80")} aria-disabled>
        {label}
      </span>
      {ctx.preview && (
        <span className={cn("rounded bg-[var(--hm-card)] px-2 py-0.5 text-xs", muted)}>
          Cole o link de checkout para ativar o botão.
        </span>
      )}
    </span>
  );
}

function Section({ children, alt, id }: { children: ReactNode; alt?: boolean; id?: string }) {
  return (
    <section id={id} className={cn("px-5 py-16 sm:px-8 sm:py-24", alt ? "bg-[var(--hm-alt)]" : "bg-[var(--hm-bg)]")}>
      <div className="mx-auto max-w-5xl">{children}</div>
    </section>
  );
}

function H2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn(display, "text-3xl leading-[1.1] text-balance sm:text-[2.6rem]", ink, className)}>{children}</h2>;
}

function Paragraphs({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn("space-y-5 text-lg leading-[1.7]", muted, className)}>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i} className="whitespace-pre-line text-pretty">
          {p}
        </p>
      ))}
    </div>
  );
}

function CheckMark({ tone = "accent" }: { tone?: "accent" | "muted" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
        tone === "accent" ? "bg-[var(--hm-accent)] text-[var(--hm-on-accent)]" : "bg-[var(--hm-line)] text-[var(--hm-muted)]",
      )}
    >
      {tone === "accent" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <X className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
  );
}

/** Title on the left, prose on the right: the reading column stays under ~70 characters. */
function SplitText({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] md:gap-14">
      <H2 className="md:sticky md:top-8 md:self-start">{title}</H2>
      <Paragraphs text={text} className="max-w-[62ch]" />
    </div>
  );
}

function Initials({ name }: { name: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        display,
        "flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--hm-accent)] text-3xl text-[var(--hm-on-accent)]",
      )}
    >
      {letters || "✶"}
    </span>
  );
}

/** Circular seal with the number of refund days. */
function GuaranteeSeal({ days }: { days?: number }) {
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 shrink-0" role="img" aria-label={days ? `${days} dias de garantia` : "Garantia"}>
      <circle cx="60" cy="60" r="56" fill="var(--hm-accent)" />
      <circle cx="60" cy="60" r="47" fill="none" stroke="var(--hm-on-accent)" strokeOpacity="0.45" strokeWidth="1.5" strokeDasharray="3 4" />
      {days ? (
        <>
          <text x="60" y="64" textAnchor="middle" fill="var(--hm-on-accent)" fontSize="40" fontWeight="800" fontFamily="var(--hm-display)">
            {days}
          </text>
          <text x="60" y="84" textAnchor="middle" fill="var(--hm-on-accent)" fontSize="13" fontWeight="700" fontFamily="var(--hm-body)">
            {days === 1 ? "dia" : "dias"}
          </text>
        </>
      ) : (
        <path d="M42 61 L55 74 L80 47" fill="none" stroke="var(--hm-on-accent)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/** Steps and modules are numbered by the layout; drop a number the model also wrote ("1. Acesso"). */
function withoutNumber(title: string): string {
  return title.replace(/^\s*(passo|etapa|step|paso|módulo|module|modulo)?\s*\d+\s*[.):\-–—]\s*/i, "") || title;
}

export function renderBlock(block: PageBlock, ctx: Ctx) {
  const { doc } = ctx;
  const bold = doc.theme.style === "bold";
  switch (block.type) {
    case "hero":
      return (
        <header
          className={cn(
            "relative overflow-hidden px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20",
            bold ? "bg-[var(--hm-accent)] text-[var(--hm-on-accent)]" : "[background:var(--hm-hero)]",
          )}
        >
          {/* One large soft shape gives depth without imagery. */}
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full blur-3xl",
              bold ? "bg-white/15" : "bg-[var(--hm-accent)] opacity-[0.12]",
            )}
          />
          <div className="relative mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
            <div>
              {block.eyebrow && (
                <p
                  className={cn(
                    "mb-6 inline-flex rounded-full px-3.5 py-1.5 text-sm font-semibold",
                    bold ? "bg-white/20 text-current" : "bg-[var(--hm-accent-soft)] text-[var(--hm-accent-strong)]",
                  )}
                >
                  {block.eyebrow}
                </p>
              )}
              <h1
                className={cn(
                  display,
                  "text-[2.5rem] leading-[1.04] text-balance sm:text-6xl lg:text-[4.1rem]",
                  !bold && ink,
                )}
              >
                {block.headline}
              </h1>
              <p className={cn("mt-6 max-w-[56ch] text-lg leading-relaxed sm:text-xl", bold ? "opacity-90" : muted)}>
                {block.subheadline}
              </p>
              <div className="mt-9 flex flex-col items-start gap-3">
                <Cta label={block.ctaLabel} ctx={ctx} inverted={bold} />
                {block.trustLine && <p className={cn("text-sm", bold ? "opacity-85" : muted)}>{block.trustLine}</p>}
              </div>
            </div>
            {block.highlights && block.highlights.length > 0 && (
              <ul
                className={cn(
                  "rounded-[var(--hm-radius)] p-6 sm:p-7",
                  bold
                    ? "bg-white/12 ring-1 ring-white/30"
                    : "bg-[var(--hm-card)] shadow-[0_24px_60px_-28px_var(--hm-shadow)] ring-1 ring-[var(--hm-line)]",
                )}
              >
                {block.highlights.map((h, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-start gap-3 py-3 text-base font-semibold sm:text-lg",
                      i > 0 && (bold ? "border-t border-white/25" : "border-t border-[var(--hm-line)]"),
                      !bold && ink,
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                        bold ? "bg-white text-[var(--hm-accent-strong)]" : "bg-[var(--hm-accent)] text-[var(--hm-on-accent)]",
                      )}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>
      );

    case "problem":
    case "text":
      return (
        <Section>
          <SplitText title={block.title} text={block.text} />
        </Section>
      );

    case "solution":
      return (
        <Section alt>
          <SplitText title={block.title} text={block.text} />
        </Section>
      );

    case "highlight":
      return (
        <section className="bg-[var(--hm-bg)] px-5 py-14 sm:px-8 sm:py-20">
          <figure className="mx-auto max-w-4xl border-l-4 border-[var(--hm-accent)] pl-6 sm:pl-10">
            <blockquote className={cn(display, "text-2xl leading-snug text-balance sm:text-4xl", ink)}>{block.text}</blockquote>
          </figure>
        </section>
      );

    case "comparison":
      return (
        <Section alt>
          <H2 className="max-w-3xl">{block.title}</H2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-6">
            <div className="rounded-[var(--hm-radius)] bg-[var(--hm-card)] p-6 ring-1 ring-[var(--hm-line)] sm:p-8">
              <p className={cn("mb-5 text-lg font-bold", muted)}>{block.withoutLabel}</p>
              <ul className="space-y-4">
                {block.rows.map((r, i) => (
                  <li key={i} className={cn("flex gap-3", muted)}>
                    <CheckMark tone="muted" />
                    <span>{r.without}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[var(--hm-radius)] bg-[var(--hm-card)] p-6 shadow-[0_24px_60px_-30px_var(--hm-shadow)] ring-2 ring-[var(--hm-accent)] sm:p-8">
              <p className="mb-5 text-lg font-bold text-[var(--hm-accent-strong)]">{block.withLabel}</p>
              <ul className="space-y-4">
                {block.rows.map((r, i) => (
                  <li key={i} className={cn("flex gap-3 font-medium", ink)}>
                    <CheckMark />
                    <span>{r.with}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      );

    case "benefits":
      return (
        <Section>
          <H2 className="max-w-3xl">{block.title}</H2>
          <ul className="mt-10 grid gap-x-12 md:grid-cols-2">
            {block.items.map((item, i) => (
              <li key={i} className={cn("flex gap-4 border-t border-[var(--hm-line)] py-5 text-lg leading-snug", ink)}>
                <CheckMark />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      );

    case "steps":
      return (
        <Section alt>
          <H2 className="max-w-3xl">{block.title}</H2>
          <ol className="relative mt-12 grid gap-10 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))] md:gap-8">
            {block.items.map((item, i) => (
              <li key={i} className="relative">
                <span
                  aria-hidden
                  className={cn(
                    display,
                    "flex h-14 w-14 items-center justify-center rounded-full bg-[var(--hm-accent)] text-2xl text-[var(--hm-on-accent)]",
                  )}
                >
                  {i + 1}
                </span>
                <h3 className={cn("mt-5 text-xl font-bold", ink)}>{withoutNumber(item.title)}</h3>
                <p className={cn("mt-2 leading-relaxed", muted)}>{item.description}</p>
              </li>
            ))}
          </ol>
        </Section>
      );

    case "modules":
      return (
        <Section>
          <H2 className="max-w-3xl">{block.title}</H2>
          <ol className="mt-10 divide-y divide-[var(--hm-line)] border-y border-[var(--hm-line)]">
            {block.items.map((item, i) => (
              <li key={i} className="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-6">
                <span aria-hidden className={cn(display, "text-4xl leading-none text-[var(--hm-accent)] sm:text-5xl")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className={cn("text-xl font-bold leading-snug", ink)}>{withoutNumber(item.title)}</h3>
                  <p className={cn("mt-2 max-w-[65ch] leading-relaxed", muted)}>{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      );

    case "bonuses":
      return (
        <Section alt>
          <H2 className="max-w-3xl">{block.title}</H2>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {block.items.map((item, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-[var(--hm-radius)] border-2 border-dashed border-[var(--hm-accent)] bg-[var(--hm-card)] p-6"
              >
                <span
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--hm-accent-soft)] text-[var(--hm-accent-strong)]"
                >
                  <Gift className="h-5 w-5" />
                </span>
                <div>
                  <h3 className={cn("text-lg font-bold", ink)}>{item.title}</h3>
                  <p className={cn("mt-1 leading-relaxed", muted)}>{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      );

    case "audience":
      return (
        <Section>
          <H2 className="max-w-3xl">{block.title}</H2>
          <div className={cn("mt-10 grid gap-10", block.notForWho.length > 0 && "md:grid-cols-2")}>
            <ul className="space-y-4">
              {block.forWho.map((item, i) => (
                <li key={i} className={cn("flex gap-3 text-lg", ink)}>
                  <CheckMark />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {block.notForWho.length > 0 && (
              <ul className="space-y-4 md:border-l md:border-[var(--hm-line)] md:pl-10">
                {block.notForWho.map((item, i) => (
                  <li key={i} className={cn("flex gap-3 text-lg", muted)}>
                    <CheckMark tone="muted" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
      );

    case "author":
      return (
        <Section alt>
          <div className="mx-auto flex max-w-3xl flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
            <Initials name={block.name} />
            <div>
              <H2>{block.title}</H2>
              {block.name && <p className="mt-2 text-lg font-semibold text-[var(--hm-accent-strong)]">{block.name}</p>}
              <Paragraphs text={block.text} className="mt-5" />
            </div>
          </div>
        </Section>
      );

    case "price":
      return (
        <Section alt id="oferta">
          <div className="mx-auto max-w-md">
            {/* The ticket: top stub with the price, perforation, then what is included. */}
            <div className="overflow-hidden rounded-[var(--hm-radius)] bg-[var(--hm-card)] shadow-[0_40px_80px_-40px_var(--hm-shadow)] ring-1 ring-[var(--hm-line)]">
              <div className="bg-[var(--hm-accent)] px-7 pb-8 pt-7 text-center text-[var(--hm-on-accent)]">
                {block.badge && (
                  <p className="mb-4 inline-flex rounded-full bg-white/20 px-3 py-1 text-sm font-semibold">{block.badge}</p>
                )}
                <p className="text-lg font-semibold opacity-90">{block.title}</p>
                <p className={cn(display, "mt-2 text-5xl leading-none sm:text-6xl")}>{block.priceLabel}</p>
              </div>
              <div aria-hidden className="relative h-6">
                <span className="absolute -left-3 top-0 h-6 w-6 rounded-full bg-[var(--hm-alt)]" />
                <span className="absolute -right-3 top-0 h-6 w-6 rounded-full bg-[var(--hm-alt)]" />
                <span className="absolute inset-x-6 top-1/2 border-t-2 border-dashed border-[var(--hm-line)]" />
              </div>
              <div className="px-7 pb-8 pt-2">
                {block.includes && block.includes.length > 0 && (
                  <ul className="mb-7 space-y-3">
                    {block.includes.map((item, i) => (
                      <li key={i} className={cn("flex gap-3 text-[0.98rem] leading-snug", ink)}>
                        <CheckMark />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Cta label={block.ctaLabel} ctx={ctx} wide />
                {block.note && <p className={cn("mt-4 text-center text-sm", muted)}>{block.note}</p>}
              </div>
            </div>
          </div>
        </Section>
      );

    case "guarantee":
      return (
        <Section>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 text-center sm:flex-row sm:items-center sm:text-left">
            <GuaranteeSeal days={block.days} />
            <div>
              <H2 className="text-2xl sm:text-3xl">{block.title}</H2>
              <p className={cn("mt-4 text-lg leading-relaxed", muted)}>{block.text}</p>
            </div>
          </div>
        </Section>
      );

    case "faq":
      return (
        <Section alt>
          <div className="grid gap-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
            <H2 className="md:sticky md:top-8 md:self-start">{block.title}</H2>
            <div className="divide-y divide-[var(--hm-line)] border-y border-[var(--hm-line)]">
              {block.items.map((item, i) => (
                <details key={i} className="group py-1">
                  <summary
                    className={cn(
                      "flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hm-accent)]",
                      ink,
                    )}
                  >
                    {item.question}
                    <Plus
                      aria-hidden
                      className="h-5 w-5 shrink-0 text-[var(--hm-accent)] transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none"
                    />
                  </summary>
                  <p className={cn("pb-5 pr-9 leading-relaxed", muted)}>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>
      );

    case "cta":
      return (
        <section className="bg-[var(--hm-accent)] px-5 py-20 text-center text-[var(--hm-on-accent)] sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className={cn(display, "text-3xl leading-tight text-balance sm:text-5xl")}>{block.headline}</h2>
            {block.subheadline && <p className="mx-auto mt-5 max-w-[56ch] text-lg opacity-90">{block.subheadline}</p>}
            <div className="mt-9">
              <Cta label={block.ctaLabel} ctx={ctx} inverted />
            </div>
          </div>
        </section>
      );
  }
}

/** Renders a sales page. Text only: user and model content never becomes HTML. */
export function PageRenderer({ doc, preview = false, className }: { doc: PageDocument; preview?: boolean; className?: string }) {
  const ctx: Ctx = { doc, preview };
  const hero = doc.blocks.find((b) => b.type === "hero");
  const price = doc.blocks.find((b) => b.type === "price");
  const stickyLabel = price?.type === "price" ? price.ctaLabel : hero?.type === "hero" ? hero.ctaLabel : null;
  return (
    <div
      className={cn("bg-[var(--hm-bg)] font-[family-name:var(--hm-body)] text-[var(--hm-ink)] antialiased", className)}
      style={pageTokens(doc.theme) as CSSProperties}
      data-style={doc.theme.style}
    >
      {doc.blocks.map((block, i) => (
        <div key={i} data-block={block.type}>
          {renderBlock(block, ctx)}
        </div>
      ))}
      <footer className={cn("border-t border-[var(--hm-line)] bg-[var(--hm-bg)] px-5 pb-28 pt-10 text-center text-xs sm:pb-10", muted)}>
        Página criada com HoneyMoney, ferramenta gratuita e open source. O conteúdo é de responsabilidade do autor.
      </footer>
      {stickyLabel && (
        <div className="sticky bottom-0 z-10 border-t border-[var(--hm-line)] bg-[var(--hm-bg)]/95 px-4 py-3 backdrop-blur sm:hidden">
          {price?.type === "price" && (
            <p className={cn("mb-2 text-center text-sm", muted)}>
              {price.title}: <strong className={ink}>{price.priceLabel}</strong>
            </p>
          )}
          <Cta label={stickyLabel} ctx={{ ...ctx, preview: false }} wide />
        </div>
      )}
    </div>
  );
}
