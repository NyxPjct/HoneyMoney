import type { PageDocument } from "@honeymoney/agents";

type Theme = PageDocument["theme"];
type Accent = Theme["accent"];
type Style = Theme["style"];
export type PageFont = NonNullable<Theme["font"]>;

/** accent = buttons and marks, strong = text on light backgrounds, on = text on the accent, dark = accent on dark pages. */
export const ACCENT_COLORS: Record<Accent, { accent: string; strong: string; on: string; dark: string }> = {
  amber: { accent: "#f59e0b", strong: "#92400e", on: "#1f1300", dark: "#fbbf24" },
  emerald: { accent: "#059669", strong: "#065f46", on: "#ffffff", dark: "#34d399" },
  sky: { accent: "#0284c7", strong: "#075985", on: "#ffffff", dark: "#38bdf8" },
  violet: { accent: "#7c3aed", strong: "#5b21b6", on: "#ffffff", dark: "#a78bfa" },
  rose: { accent: "#e11d48", strong: "#9f1239", on: "#ffffff", dark: "#fb7185" },
  slate: { accent: "#334155", strong: "#1e293b", on: "#ffffff", dark: "#cbd5e1" },
  teal: { accent: "#0d9488", strong: "#115e59", on: "#ffffff", dark: "#2dd4bf" },
  orange: { accent: "#ea580c", strong: "#9a3412", on: "#ffffff", dark: "#fb923c" },
  indigo: { accent: "#4f46e5", strong: "#3730a3", on: "#ffffff", dark: "#818cf8" },
  navy: { accent: "#1e3a8a", strong: "#172554", on: "#ffffff", dark: "#93c5fd" },
  forest: { accent: "#166534", strong: "#14532d", on: "#ffffff", dark: "#86efac" },
  burgundy: { accent: "#881337", strong: "#4c0519", on: "#ffffff", dark: "#fda4af" },
  gold: { accent: "#c9a227", strong: "#6b5310", on: "#1a1405", dark: "#e5c76b" },
  coral: { accent: "#f26b5b", strong: "#a4372a", on: "#ffffff", dark: "#ff9a8c" },
  plum: { accent: "#86198f", strong: "#4a044e", on: "#ffffff", dark: "#f0abfc" },
  petrol: { accent: "#155e75", strong: "#083344", on: "#ffffff", dark: "#67e8f9" },
  mocha: { accent: "#7c5c45", strong: "#4a3527", on: "#ffffff", dark: "#d6b8a0" },
  magenta: { accent: "#db2777", strong: "#9d174d", on: "#ffffff", dark: "#f472b6" },
  black: { accent: "#18181b", strong: "#09090b", on: "#ffffff", dark: "#e4e4e7" },
};

export const FONT_FAMILIES: Record<PageFont, { family: string; weight: string; tracking: string }> = {
  modern: { family: '"Bricolage Grotesque Variable", ui-sans-serif, system-ui, sans-serif', weight: "750", tracking: "-0.025em" },
  editorial: { family: '"Fraunces Variable", ui-serif, Georgia, serif', weight: "560", tracking: "-0.015em" },
  friendly: { family: '"Nunito Variable", ui-rounded, ui-sans-serif, system-ui, sans-serif', weight: "800", tracking: "-0.01em" },
  elegant: { family: '"Playfair Display Variable", ui-serif, Georgia, serif', weight: "600", tracking: "-0.01em" },
  classic: { family: '"DM Serif Display", ui-serif, Georgia, serif', weight: "400", tracking: "-0.005em" },
  impact: { family: 'Anton, "Arial Narrow", Impact, sans-serif', weight: "400", tracking: "0.005em" },
  tech: { family: '"Space Grotesk Variable", ui-sans-serif, system-ui, sans-serif', weight: "650", tracking: "-0.03em" },
  clean: { family: '"Manrope Variable", ui-sans-serif, system-ui, sans-serif', weight: "750", tracking: "-0.03em" },
  geometric: { family: '"Outfit Variable", ui-sans-serif, system-ui, sans-serif', weight: "700", tracking: "-0.02em" },
};

const BODY = '"Figtree Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/** Typeface each template uses when the page does not choose one. */
export const DEFAULT_FONT: Record<Style, PageFont> = {
  clean: "modern",
  bold: "modern",
  elegant: "editorial",
  dark: "modern",
  vibrant: "geometric",
  minimal: "clean",
  luxury: "elegant",
  magazine: "classic",
  playful: "friendly",
};

/** Structure of a template: where the hero content sits and what is behind it. */
export type PageLayout = {
  hero: "split" | "center";
  /** The hero sits on the accent colour or gradient, so its text uses the on-accent colour. */
  heroOnAccent: boolean;
  /** Section titles centred above their content instead of beside it. */
  centered: boolean;
  /** The closing band and the price header are the accent colour (buttons on them are inverted). */
  bandOnAccent: boolean;
};

const LAYOUTS: Record<Style, PageLayout> = {
  clean: { bandOnAccent: true, hero: "split", heroOnAccent: false, centered: false },
  bold: { bandOnAccent: true, hero: "split", heroOnAccent: true, centered: false },
  elegant: { bandOnAccent: true, hero: "split", heroOnAccent: false, centered: false },
  dark: { bandOnAccent: true, hero: "split", heroOnAccent: false, centered: false },
  vibrant: { bandOnAccent: true, hero: "center", heroOnAccent: true, centered: true },
  minimal: { bandOnAccent: true, hero: "center", heroOnAccent: false, centered: false },
  luxury: { bandOnAccent: false, hero: "center", heroOnAccent: false, centered: true },
  magazine: { bandOnAccent: true, hero: "center", heroOnAccent: false, centered: true },
  playful: { bandOnAccent: true, hero: "split", heroOnAccent: false, centered: false },
};

export function pageLayout(theme: Theme): PageLayout {
  return LAYOUTS[theme.style] ?? LAYOUTS.clean;
}

function mix(color: string, pct: number, base: string): string {
  return `color-mix(in srgb, ${color} ${pct}%, ${base})`;
}

/** Rotates the hue of a #rrggbb colour (for two-colour gradients that work in every browser). */
export function shiftHue(hex: string, degrees: number, lightness = 0): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  h = (h + degrees + 360) % 360;
  const L = Math.min(1, Math.max(0, l + lightness));
  const c = (1 - Math.abs(2 * L - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - c / 2;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return `#${[r1, g1, b1].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("")}`;
}

type Tokens = Record<string, string>;

/** CSS custom properties for a page theme. Every colour, border and shadow on the page comes from these. */
export function pageTokens(theme: Theme): Tokens {
  const a = ACCENT_COLORS[theme.accent] ?? ACCENT_COLORS.amber;
  const fontKey = theme.font ?? DEFAULT_FONT[theme.style] ?? "modern";
  const font = FONT_FAMILIES[fontKey] ?? FONT_FAMILIES.modern;
  const layout = pageLayout(theme);
  const base: Tokens = {
    "--hm-display": font.family,
    "--hm-display-weight": theme.style === "bold" && ["modern", "friendly", "clean", "geometric"].includes(fontKey) ? "820" : font.weight,
    "--hm-display-tracking": font.tracking,
    "--hm-body": BODY,
    "--hm-accent": a.accent,
    "--hm-accent-strong": a.strong,
    "--hm-on-accent": a.on,
    "--hm-band": a.accent,
    "--hm-card-bw": "1px",
    "--hm-section-bw": "0px",
    "--hm-button-shadow": `0 6px 0 ${a.strong}`,
    "--hm-radius": "1.25rem",
    "--hm-radius-button": "0.9rem",
  };
  const light = (bg: string, extra: Tokens): Tokens => ({
    ...base,
    "--hm-bg": bg,
    "--hm-card": "#ffffff",
    "--hm-ink": "#1c1a18",
    "--hm-muted": "#57524d",
    "--hm-line": "#e8e5e1",
    "--hm-accent-soft": mix(a.accent, 14, bg),
    "--hm-shadow": mix(a.strong, 45, "transparent"),
    ...extra,
  });

  let t: Tokens;
  switch (theme.style) {
    case "dark": {
      const bg = "#14161c";
      t = {
        ...base,
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
        "--hm-band": a.dark,
        "--hm-button-shadow": `0 6px 0 ${mix(a.dark, 45, "#000")}`,
      };
      break;
    }
    case "luxury": {
      const bg = "#100f0d";
      t = {
        ...base,
        "--hm-bg": bg,
        "--hm-alt": "#17150f",
        "--hm-hero": `radial-gradient(80% 70% at 50% 0%, ${mix(a.dark, 14, bg)}, ${bg} 70%)`,
        "--hm-card": "#1a1813",
        "--hm-ink": "#f4efe6",
        "--hm-muted": "#b5ab9c",
        "--hm-line": mix(a.dark, 30, "#2a2720"),
        "--hm-shadow": "rgb(0 0 0 / 0.7)",
        "--hm-accent": a.dark,
        "--hm-accent-strong": a.dark,
        "--hm-accent-soft": mix(a.dark, 12, bg),
        "--hm-on-accent": "#100f0d",
        "--hm-band": `linear-gradient(135deg, ${mix(a.dark, 22, bg)}, ${bg})`,
        "--hm-button-shadow": "none",
        "--hm-section-bw": "1px",
        "--hm-radius": "0.25rem",
        "--hm-radius-button": "0.25rem",
      };
      break;
    }
    case "elegant":
      t = light("#fbfbfa", {
        "--hm-alt": mix(a.accent, 5, "#f2f1ee"),
        "--hm-hero": mix(a.accent, 7, "#f6f5f2"),
        "--hm-ink": "#23211e",
        "--hm-muted": "#5e5951",
        "--hm-line": "#e3dfd8",
        "--hm-shadow": "rgb(35 33 30 / 0.28)",
        "--hm-radius": "0.5rem",
        "--hm-radius-button": "999px",
      });
      break;
    case "bold":
      t = light("#ffffff", {
        "--hm-alt": "#f4f4f3",
        "--hm-hero": a.accent,
        "--hm-ink": "#0f0e0d",
        "--hm-muted": "#46423e",
        "--hm-line": "#dcd9d5",
        "--hm-shadow": "rgb(15 14 13 / 0.35)",
        "--hm-radius": "0.75rem",
        "--hm-radius-button": "0.6rem",
      });
      break;
    case "vibrant": {
      const second = shiftHue(a.accent, 42, -0.04);
      const gradient = `linear-gradient(135deg, ${a.accent} 0%, ${second} 100%)`;
      t = light("#ffffff", {
        "--hm-alt": `linear-gradient(180deg, ${mix(a.accent, 7, "#fff")}, ${mix(second, 7, "#fff")})`,
        "--hm-hero": gradient,
        "--hm-band": gradient,
        "--hm-ink": "#16141f",
        "--hm-shadow": mix(a.strong, 50, "transparent"),
        "--hm-radius": "1.75rem",
        "--hm-radius-button": "999px",
        "--hm-card-bw": "0px",
        "--hm-button-shadow": `0 14px 30px -10px ${mix(a.strong, 70, "transparent")}`,
      });
      break;
    }
    case "minimal":
      t = light("#ffffff", {
        "--hm-alt": "#ffffff",
        "--hm-hero": "#ffffff",
        "--hm-ink": "#0a0a0a",
        "--hm-muted": "#525252",
        "--hm-line": "#e5e5e5",
        "--hm-shadow": "transparent",
        "--hm-section-bw": "1px",
        "--hm-radius": "0.375rem",
        "--hm-radius-button": "0.375rem",
        "--hm-button-shadow": "none",
      });
      break;
    case "magazine":
      t = light("#fbf9f6", {
        "--hm-alt": "#f3efe8",
        "--hm-hero": "#fbf9f6",
        "--hm-card": "#fffdfa",
        "--hm-ink": "#1d1b18",
        "--hm-muted": "#5b554c",
        "--hm-line": "#d9d2c6",
        "--hm-shadow": "rgb(29 27 24 / 0.2)",
        "--hm-section-bw": "1px",
        "--hm-radius": "0.25rem",
        "--hm-radius-button": "0.25rem",
        "--hm-button-shadow": "none",
      });
      break;
    case "playful": {
      const bg = mix(a.accent, 7, "#fffdf8");
      t = light(bg, {
        "--hm-alt": mix(a.accent, 14, "#fffdf8"),
        "--hm-hero": mix(a.accent, 18, "#fffdf8"),
        "--hm-ink": "#17140f",
        "--hm-muted": "#4b453d",
        "--hm-line": "#17140f",
        "--hm-card-bw": "2px",
        "--hm-shadow": "#17140f",
        "--hm-card-shadow": "6px 6px 0 #17140f",
        "--hm-button-shadow": "4px 4px 0 #17140f",
        "--hm-radius": "1.25rem",
        "--hm-radius-button": "0.9rem",
      });
      break;
    }
    default: {
      const bg = "#ffffff";
      t = light(bg, {
        "--hm-alt": mix(a.accent, 6, bg),
        "--hm-hero": `linear-gradient(180deg, ${mix(a.accent, 10, bg)}, ${bg})`,
      });
    }
  }

  // Text on the closing band / price header, and the soft shape behind the hero.
  t["--hm-on-band"] = layout.bandOnAccent ? t["--hm-on-accent"]! : t["--hm-ink"]!;
  t["--hm-blob"] = theme.style === "minimal" || theme.style === "magazine" ? "0" : layout.heroOnAccent ? "1" : "0.12";
  // Cards: playful sets its own hard shadow; the others derive theirs from the shadow colour.
  t["--hm-card-border"] ??= t["--hm-line"]!;
  t["--hm-card-shadow"] ??= `0 24px 60px -30px ${t["--hm-shadow"]}`;
  // Text inside the hero.
  t["--hm-hero-ink"] = layout.heroOnAccent ? t["--hm-on-accent"]! : t["--hm-ink"]!;
  t["--hm-hero-muted"] = layout.heroOnAccent ? mix(t["--hm-on-accent"]!, 85, "transparent") : t["--hm-muted"]!;
  return t;
}

/** One-click combinations offered in the editor. */
export const PAGE_PRESETS: readonly { id: string; name: string; description: string; theme: Required<Theme> }[] = [
  { id: "launch", name: "Lançamento", description: "Gradiente vibrante, chama atenção", theme: { style: "vibrant", accent: "magenta", font: "geometric" } },
  { id: "premium", name: "Minimalista", description: "Preto e branco, muito espaço", theme: { style: "minimal", accent: "black", font: "clean" } },
  { id: "luxury", name: "Luxo", description: "Fundo escuro, dourado e serifa", theme: { style: "luxury", accent: "gold", font: "elegant" } },
  { id: "magazine", name: "Revista", description: "Editorial, títulos centralizados", theme: { style: "magazine", accent: "burgundy", font: "classic" } },
  { id: "playful", name: "Divertido", description: "Cores leves e cartões de adesivo", theme: { style: "playful", accent: "coral", font: "friendly" } },
  { id: "impact", name: "Impacto", description: "Blocos de cor e letras fortes", theme: { style: "bold", accent: "orange", font: "impact" } },
  { id: "tech", name: "Tech", description: "Escuro, moderno, para cursos digitais", theme: { style: "dark", accent: "indigo", font: "tech" } },
  { id: "corporate", name: "Corporativo", description: "Azul-marinho, sóbrio e confiável", theme: { style: "clean", accent: "navy", font: "clean" } },
  { id: "natural", name: "Natural", description: "Verde, sereno e acolhedor", theme: { style: "elegant", accent: "forest", font: "editorial" } },
  { id: "beauty", name: "Beleza", description: "Rosa elegante com serifa", theme: { style: "elegant", accent: "rose", font: "elegant" } },
];
