"use client";

import { ACCENTS, PAGE_FONTS, PAGE_STYLES, type PageDocument } from "@honeymoney/agents";
import { cn } from "@honeymoney/ui";
import { ACCENT_COLORS, DEFAULT_FONT, FONT_FAMILIES, PAGE_PRESETS, type PageFont, pageTokens } from "@honeymoney/ui/page";
import { Check } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

type Theme = PageDocument["theme"];

export const ACCENT_LABELS: Record<Theme["accent"], string> = {
  amber: "Mel",
  emerald: "Esmeralda",
  sky: "Céu",
  violet: "Violeta",
  rose: "Rosa",
  slate: "Grafite",
  teal: "Turquesa",
  orange: "Laranja",
  indigo: "Índigo",
  navy: "Azul-marinho",
  forest: "Verde-floresta",
  burgundy: "Vinho",
  gold: "Dourado",
  coral: "Coral",
  plum: "Ameixa",
  petrol: "Azul-petróleo",
  mocha: "Café",
  magenta: "Magenta",
  black: "Preto",
};

export const STYLE_LABELS: Record<Theme["style"], string> = {
  clean: "Leve",
  bold: "Marcante",
  elegant: "Elegante",
  dark: "Escuro",
  vibrant: "Vibrante",
  minimal: "Minimalista",
  luxury: "Luxo",
  magazine: "Revista",
  playful: "Divertido",
};

export const FONT_LABELS: Record<PageFont, string> = {
  modern: "Moderna",
  editorial: "Editorial",
  friendly: "Amigável",
  elegant: "Elegante",
  classic: "Clássica",
  impact: "Impacto",
  tech: "Tech",
  clean: "Limpa",
  geometric: "Geométrica",
};

/** A tiny rendering of the template: hero background, a heading in the font and the button. */
function Thumb({ theme, label }: { theme: Theme; label: string }) {
  return (
    <span className="block overflow-hidden rounded-md border border-stone-200 dark:border-stone-700" style={pageTokens(theme) as CSSProperties}>
      <span className="flex h-16 flex-col justify-center gap-1.5 px-2.5 text-[var(--hm-hero-ink)] [background:var(--hm-hero)]">
        <span className="font-[family-name:var(--hm-display)] text-[15px] leading-none [font-weight:var(--hm-display-weight)]">{label}</span>
        <span className="h-2.5 w-12 rounded-full bg-[var(--hm-accent)] ring-1 ring-white/40" />
      </span>
      <span className="flex h-5 items-center gap-1 bg-[var(--hm-bg)] px-2.5">
        <span className="h-1 w-10 rounded bg-[var(--hm-line)]" />
        <span className="h-1 w-6 rounded bg-[var(--hm-line)]" />
      </span>
    </span>
  );
}

function Option({ selected, onClick, children, title }: { selected: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={selected}
      className={cn(
        "relative rounded-lg p-1 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-amber-500",
        selected ? "ring-2 ring-amber-500" : "hover:bg-stone-100 dark:hover:bg-stone-800",
      )}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">{title}</legend>
      {children}
    </fieldset>
  );
}

export function ThemePicker({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  const font = theme.font ?? DEFAULT_FONT[theme.style];
  return (
    <div className="space-y-5">
      <Group title="Modelos prontos">
        <div className="grid grid-cols-2 gap-2">
          {PAGE_PRESETS.map((p) => {
            const selected = p.theme.style === theme.style && p.theme.accent === theme.accent && p.theme.font === font;
            return (
              <Option key={p.id} selected={selected} onClick={() => onChange(p.theme)} title={p.description}>
                <Thumb theme={p.theme} label={p.name} />
                <span className="mt-1 block truncate px-0.5 text-xs text-stone-500">{p.description}</span>
              </Option>
            );
          })}
        </div>
      </Group>

      <Group title="Estilo da página">
        <div className="grid grid-cols-3 gap-2">
          {PAGE_STYLES.map((s) => (
            <Option key={s} selected={theme.style === s} onClick={() => onChange({ ...theme, style: s })}>
              <Thumb theme={{ ...theme, style: s }} label={STYLE_LABELS[s]} />
            </Option>
          ))}
        </div>
      </Group>

      <Group title={`Cor: ${ACCENT_LABELS[theme.accent]}`}>
        <div className="flex flex-wrap gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a}
              type="button"
              title={ACCENT_LABELS[a]}
              aria-label={ACCENT_LABELS[a]}
              aria-pressed={theme.accent === a}
              onClick={() => onChange({ ...theme, accent: a })}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:ring-offset-stone-900",
                theme.accent === a ? "ring-2 ring-stone-900 dark:ring-white" : "hover:scale-110",
              )}
              style={{ background: ACCENT_COLORS[a].accent, color: ACCENT_COLORS[a].on }}
            >
              {theme.accent === a && <Check className="h-4 w-4" strokeWidth={3} aria-hidden />}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Fonte dos títulos">
        <div className="grid grid-cols-3 gap-2">
          {PAGE_FONTS.map((f) => (
            <Option key={f} selected={font === f} onClick={() => onChange({ ...theme, font: f })}>
              <span className="block rounded-md border border-stone-200 px-2 py-2 text-center dark:border-stone-700">
                <span
                  className="block text-2xl leading-tight"
                  style={{ fontFamily: FONT_FAMILIES[f].family, fontWeight: Number(FONT_FAMILIES[f].weight) }}
                >
                  Aa
                </span>
                <span className="block text-xs text-stone-500">{FONT_LABELS[f]}</span>
              </span>
            </Option>
          ))}
        </div>
      </Group>
    </div>
  );
}
