import type { PageDocument } from "@honeymoney/agents";

type Theme = PageDocument["theme"];
type Accent = Theme["accent"];

/** accent = buttons and marks, strong = text on light backgrounds, on = text on the accent. */
const ACCENTS: Record<Accent, { accent: string; strong: string; on: string; dark: string }> = {
  amber: { accent: "#f59e0b", strong: "#92400e", on: "#1f1300", dark: "#fbbf24" },
  emerald: { accent: "#059669", strong: "#065f46", on: "#ffffff", dark: "#34d399" },
  sky: { accent: "#0284c7", strong: "#075985", on: "#ffffff", dark: "#38bdf8" },
  violet: { accent: "#7c3aed", strong: "#5b21b6", on: "#ffffff", dark: "#a78bfa" },
  rose: { accent: "#e11d48", strong: "#9f1239", on: "#ffffff", dark: "#fb7185" },
  slate: { accent: "#334155", strong: "#1e293b", on: "#ffffff", dark: "#cbd5e1" },
  teal: { accent: "#0d9488", strong: "#115e59", on: "#ffffff", dark: "#2dd4bf" },
  orange: { accent: "#ea580c", strong: "#9a3412", on: "#ffffff", dark: "#fb923c" },
  indigo: { accent: "#4f46e5", strong: "#3730a3", on: "#ffffff", dark: "#818cf8" },
};

const FONTS = {
  modern: { family: '"Bricolage Grotesque Variable", ui-sans-serif, system-ui, sans-serif', weight: "750", tracking: "-0.025em" },
  editorial: { family: '"Fraunces Variable", ui-serif, Georgia, serif', weight: "560", tracking: "-0.015em" },
  friendly: { family: '"Nunito Variable", ui-rounded, ui-sans-serif, system-ui, sans-serif', weight: "800", tracking: "-0.01em" },
} as const;

const BODY = '"Figtree Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function mix(color: string, pct: number, base: string): string {
  return `color-mix(in srgb, ${color} ${pct}%, ${base})`;
}

/** CSS custom properties for a page theme. Every colour on the page comes from these. */
export function pageTokens(theme: Theme): Record<string, string> {
  const a = ACCENTS[theme.accent] ?? ACCENTS.amber;
  const fontKey = theme.font ?? (theme.style === "elegant" ? "editorial" : "modern");
  const font = FONTS[fontKey];
  const common = {
    "--hm-display": font.family,
    "--hm-display-weight": theme.style === "bold" && fontKey !== "editorial" ? "820" : font.weight,
    "--hm-display-tracking": font.tracking,
    "--hm-body": BODY,
  };

  switch (theme.style) {
    case "dark": {
      const bg = "#14161c";
      return {
        ...common,
        "--hm-bg": bg,
        "--hm-alt": "#1a1d25",
        "--hm-hero": `radial-gradient(120% 90% at 0% 0%, ${mix(a.dark, 16, bg)}, ${bg} 60%)`,
        "--hm-card": "#20242e",
        "--hm-ink": "#f3f4f6",
        "--hm-muted": "#a8adb8",
        "--hm-line": "#2d323d",
        "--hm-shadow": "rgb(0 0 0 / 0.6)",
        "--hm-accent": a.dark,
        "--hm-accent-strong": a.dark,
        "--hm-accent-soft": mix(a.dark, 16, bg),
        "--hm-on-accent": "#0d0f14",
        "--hm-radius": "1.25rem",
        "--hm-radius-button": "0.9rem",
      };
    }
    case "elegant": {
      const bg = "#fbfbfa";
      return {
        ...common,
        "--hm-bg": bg,
        "--hm-alt": mix(a.accent, 5, "#f2f1ee"),
        "--hm-hero": mix(a.accent, 7, "#f6f5f2"),
        "--hm-card": "#ffffff",
        "--hm-ink": "#23211e",
        "--hm-muted": "#5e5951",
        "--hm-line": "#e3dfd8",
        "--hm-shadow": "rgb(35 33 30 / 0.28)",
        "--hm-accent": a.accent,
        "--hm-accent-strong": a.strong,
        "--hm-accent-soft": mix(a.accent, 12, bg),
        "--hm-on-accent": a.on,
        "--hm-radius": "0.5rem",
        "--hm-radius-button": "999px",
      };
    }
    case "bold":
      return {
        ...common,
        "--hm-bg": "#ffffff",
        "--hm-alt": "#f4f4f3",
        "--hm-hero": a.accent,
        "--hm-card": "#ffffff",
        "--hm-ink": "#0f0e0d",
        "--hm-muted": "#46423e",
        "--hm-line": "#dcd9d5",
        "--hm-shadow": "rgb(15 14 13 / 0.35)",
        "--hm-accent": a.accent,
        "--hm-accent-strong": a.strong,
        "--hm-accent-soft": mix(a.accent, 14, "#ffffff"),
        "--hm-on-accent": a.on,
        "--hm-radius": "0.75rem",
        "--hm-radius-button": "0.6rem",
      };
    default: {
      const bg = "#ffffff";
      return {
        ...common,
        "--hm-bg": bg,
        "--hm-alt": mix(a.accent, 6, bg),
        "--hm-hero": `linear-gradient(180deg, ${mix(a.accent, 10, bg)}, ${bg})`,
        "--hm-card": "#ffffff",
        "--hm-ink": "#1c1a18",
        "--hm-muted": "#57524d",
        "--hm-line": "#e8e5e1",
        "--hm-shadow": mix(a.strong, 45, "transparent"),
        "--hm-accent": a.accent,
        "--hm-accent-strong": a.strong,
        "--hm-accent-soft": mix(a.accent, 14, bg),
        "--hm-on-accent": a.on,
        "--hm-radius": "1.25rem",
        "--hm-radius-button": "0.9rem",
      };
    }
  }
}
