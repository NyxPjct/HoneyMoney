/**
 * Deterministic checks used by the Manager (prohibited topics) and the Sentinel (claims,
 * prices, copied text). They run in addition to the model review, so a model that misses
 * an income promise can never approve it.
 */
import type {
  Briefing,
  Copy,
  Currency,
  OfferSkeleton,
  PageDocument,
  ProductFormat,
  SentinelIssue as ResponsibleAgentIssue,
} from "./schemas";

type Rule = {
  category: ResponsibleAgentIssue["category"];
  severity: ResponsibleAgentIssue["severity"];
  pattern: RegExp;
  problem: string;
  suggestion: string;
};

const INCOME_SUGGESTION =
  "Remove any amount the buyer will earn. Describe what the product teaches or delivers instead.";

export const CLAIM_RULES: readonly Rule[] = [
  // Income promises (pt-BR, es, en). Verbs like "ganhe" are only flagged together with a
  // per-period amount, because "ganhe 3 bônus no valor de R$ 97" is legitimate copy.
  {
    category: "income_claim",
    severity: "blocker",
    pattern:
      /\b(fatur[ae]r?|fature|faturando|faturei|lucr[ae]r?|lucre|lucrando|earn|earning|earns)\b[^.!?\n]{0,40}(R\$|US\$|\$|€)\s?\d/i,
    problem: "Promises a specific amount of money to the buyer.",
    suggestion: INCOME_SUGGESTION,
  },
  {
    category: "income_claim",
    severity: "blocker",
    pattern:
      /\b(ganh[ae]r?|ganhe|ganhando|gan[ae]r?|ganarás|make|making)\b[^.!?\n]{0,25}(R\$|US\$|\$|€)\s?\d[\d.,]*\s*(mil|k)?\s*(por|\/|ao|no|per|a|al)\s*(dia|m[eê]s|semana|day|month|week|d[ií]a)\b/i,
    problem: "Promises earnings per day/week/month.",
    suggestion: INCOME_SUGGESTION,
  },
  {
    category: "income_claim",
    severity: "blocker",
    pattern: /renda (extra |mensal |passiva )?de (at[eé] )?(R\$|US\$|\$|€)\s?\d|ingresos? (extra )?de (hasta )?(\$|€)\s?\d/i,
    problem: "Promises a specific income.",
    suggestion: INCOME_SUGGESTION,
  },
  {
    category: "income_claim",
    severity: "warning",
    pattern:
      /(R\$|US\$|\$|€)\s?\d[\d.,]*\s*(mil|k)?\+?\s*(por|\/|ao|no|per|al)\s*(dia|m[eê]s|semana|day|month|week|d[ií]a)\b/i,
    problem: "Mentions an amount per day/week/month. Fine for price framing, not for earnings.",
    suggestion: "Make sure this is about the price, not about what the buyer will earn or save.",
  },
  {
    category: "income_claim",
    severity: "blocker",
    pattern:
      /renda (extra |passiva )?garantida|ingresos? (extra |pasivos? )?garantizados?|guaranteed (income|earnings|profits?)|lucro garantido/i,
    problem: "Promises guaranteed income.",
    suggestion: INCOME_SUGGESTION,
  },
  {
    category: "income_claim",
    severity: "blocker",
    pattern: /dinheiro f[aá]cil|dinero f[aá]cil|easy money|fique rico|get rich|hazte rico|enrique[cç]a r[aá]pido/i,
    problem: "Uses get-rich-quick language.",
    suggestion: INCOME_SUGGESTION,
  },
  // Guaranteed results (refund guarantees like "garantia de 7 dias" are fine)
  {
    category: "guaranteed_result",
    severity: "blocker",
    pattern:
      /resultados? garantidos?|garantimos (que|o seu|seu|o) (voc[eê]|resultado|sucesso)|100% (de )?(sucesso|garantido|eficaz)|guaranteed results?|results? guaranteed|resultados? garantizados?/i,
    problem: "Guarantees a result the seller cannot control.",
    suggestion: "Keep the refund guarantee, but do not guarantee outcomes. Describe the method and effort involved.",
  },
  // Health claims
  {
    category: "health_claim",
    severity: "blocker",
    pattern: /\b(cura|curar|curam|cure|cures|curing)\b/i,
    problem: "Claims to cure a condition.",
    suggestion: "Remove cure claims. Health products must not promise treatment outcomes.",
  },
  {
    category: "health_claim",
    severity: "blocker",
    pattern:
      /\b(perca|perder|emagre[cç]a|elimine|eliminar|lose|pierde|pierda|baje|bajar)\s+(at[eé]\s+|up to\s+|hasta\s+)?\d+\s?(kg|quilos|kilos|lbs?|pounds|libras)\b/i,
    problem: "Promises a specific weight loss.",
    suggestion: "Remove the number of kilos/pounds. Talk about habits and knowledge instead.",
  },
  {
    category: "health_claim",
    severity: "blocker",
    pattern:
      /sem (precisar de )?(rem[eé]dio|m[eé]dico)|substitui (o )?(m[eé]dico|tratamento|rem[eé]dio)|replaces? (your )?(doctor|medication|treatment)|reemplaza (al )?(m[eé]dico|tratamiento)/i,
    problem: "Suggests replacing medical treatment.",
    suggestion: "Never suggest skipping a doctor or medication.",
  },
  {
    category: "health_claim",
    severity: "warning",
    pattern: /milagr|miracle|milagro/i,
    problem: "Uses 'miracle' language, common in misleading health and money offers.",
    suggestion: "Prefer concrete, verifiable descriptions.",
  },
];

/** Topics the product refuses to help with (spec: trading, binary options, bets, "sócio" schemes). */
const PROHIBITED_TOPICS: readonly { pattern: RegExp; label: string }[] = [
  { pattern: /op[cç][oõ]es bin[aá]rias|binary options?|opciones binarias/i, label: "binary options" },
  { pattern: /\b(day[\s-]?trad(e|ing)|forex|trading|trader)\b/i, label: "trading" },
  {
    pattern: /\b(apostas?|apuestas?|betting|bets?|cassino|casino|tigrinho|bet365|aviator)\b/i,
    label: "betting / gambling",
  },
  { pattern: /sinais (de|para) (trade|cripto|apostas|opç)|signals? (for|de) (trading|crypto|bets)/i, label: "trading signals" },
  {
    pattern: /pir[aâ]mide financeira|esquema de s[oó]cios?|marketing multin[ií]vel|ponzi|pyramid scheme/i,
    label: "pyramid / 'partner' schemes",
  },
];

export function detectProhibitedTopic(text: string): string | null {
  for (const topic of PROHIBITED_TOPICS) {
    if (topic.pattern.test(text)) return topic.label;
  }
  return null;
}

export function briefingText(briefing: Briefing): string {
  return [
    briefing.skill,
    briefing.audience,
    briefing.formatDetails ?? "",
    briefing.extra ?? "",
    ...(briefing.answers ?? []).flatMap((a) => [a.question, a.answer]),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Text collection
// ---------------------------------------------------------------------------

export type TextField = { agent: ResponsibleAgentIssue["agent"]; path: string; text: string };

function walk(value: unknown, path: string, agent: TextField["agent"], out: TextField[]): void {
  if (typeof value === "string") {
    if (value.trim()) out.push({ agent, path, text: value });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, agent, out));
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      // Structural fields are not prose.
      if (k === "type" || k === "accent" || k === "style" || k === "checkoutUrl" || k === "currency" || k === "format")
        continue;
      walk(v, path ? `${path}.${k}` : k, agent, out);
    }
  }
}

export function collectTexts(d: { offer?: OfferSkeleton; copy?: Copy; page?: PageDocument }): TextField[] {
  const out: TextField[] = [];
  if (d.offer) walk(d.offer, "offer", "strategist", out);
  if (d.copy) walk(d.copy, "copy", "copywriter", out);
  if (d.page) walk(d.page, "page", "designer", out);
  return out;
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

export function checkClaims(fields: readonly TextField[]): ResponsibleAgentIssue[] {
  const issues: ResponsibleAgentIssue[] = [];
  for (const field of fields) {
    for (const rule of CLAIM_RULES) {
      const match = rule.pattern.exec(field.text);
      if (match) {
        issues.push({
          agent: field.agent,
          severity: rule.severity,
          category: rule.category,
          location: field.path,
          problem: `${rule.problem} Found: "${excerpt(field.text, match.index)}"`,
          suggestion: rule.suggestion,
        });
      }
    }
    const topic = detectProhibitedTopic(field.text);
    if (topic) {
      issues.push({
        agent: field.agent,
        severity: "blocker",
        category: "prohibited_topic",
        location: field.path,
        problem: `Mentions a topic HoneyMoney does not support (${topic}).`,
        suggestion: "Remove it. HoneyMoney only helps create and sell your own products.",
      });
    }
  }
  return issues;
}

function excerpt(text: string, index: number): string {
  const start = Math.max(0, index - 20);
  return text.slice(start, index + 60).replace(/\s+/g, " ").trim();
}

/** Approximate conversion, only used to sanity-check suggested prices. */
const TO_BRL: Record<Currency, number> = { BRL: 1, USD: 5, EUR: 5.5 };

/** Typical price ranges in BRL for each format (min, max). */
export const PRICE_RANGES_BRL: Record<ProductFormat, readonly [number, number]> = {
  ebook: [7, 197],
  spreadsheet: [7, 197],
  template: [7, 297],
  course: [27, 2997],
  mentoring: [97, 9997],
  other: [5, 4997],
};

export function checkPrice(offer: OfferSkeleton): ResponsibleAgentIssue[] {
  const brl = (offer.suggestedPrice.amountCents / 100) * TO_BRL[offer.suggestedPrice.currency];
  const [min, max] = PRICE_RANGES_BRL[offer.format];
  if (brl <= 0) {
    return [
      {
        agent: "strategist",
        severity: "warning",
        category: "price_mismatch",
        location: "offer.suggestedPrice",
        problem: "The suggested price is zero.",
        suggestion: "If the product is free on purpose, keep it; otherwise suggest a price.",
      },
    ];
  }
  if (brl > max * 3) {
    return [
      {
        agent: "strategist",
        severity: "blocker",
        category: "price_mismatch",
        location: "offer.suggestedPrice",
        problem: `Price is far above what is usual for this format (typical range R$ ${min}–${max}).`,
        suggestion: "Lower the price or change the format so price and delivery match.",
      },
    ];
  }
  if (brl < min || brl > max) {
    return [
      {
        agent: "strategist",
        severity: "warning",
        category: "price_mismatch",
        location: "offer.suggestedPrice",
        problem: `Price is outside the usual range for this format (R$ ${min}–${max}).`,
        suggestion: "Double-check that the price matches what is delivered.",
      },
    ];
  }
  return [];
}

const SHINGLE_SIZE = 8;

function shingles(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i + SHINGLE_SIZE <= words.length; i++) out.add(words.slice(i, i + SHINGLE_SIZE).join(" "));
  return out;
}

/** Flags fields that share an 8-word sequence with reference texts (third-party copy must not be reused). */
export function checkCopiedText(fields: readonly TextField[], referenceTexts: readonly string[]): ResponsibleAgentIssue[] {
  if (referenceTexts.length === 0) return [];
  const reference = new Set<string>();
  for (const t of referenceTexts) for (const s of shingles(t)) reference.add(s);
  const issues: ResponsibleAgentIssue[] = [];
  for (const field of fields) {
    for (const s of shingles(field.text)) {
      if (reference.has(s)) {
        issues.push({
          agent: field.agent,
          severity: "blocker",
          category: "copied_text",
          location: field.path,
          problem: `Reuses text from the reference offer: "${s}…"`,
          suggestion: "Rewrite in original words. Use the reference only for structure and angles.",
        });
        break;
      }
    }
  }
  return issues;
}

export function runDeterministicChecks(d: {
  offer?: OfferSkeleton;
  copy?: Copy;
  page?: PageDocument;
  referenceTexts?: readonly string[];
}): ResponsibleAgentIssue[] {
  const fields = collectTexts(d);
  return [
    ...checkClaims(fields),
    ...(d.offer ? checkPrice(d.offer) : []),
    ...checkCopiedText(fields, d.referenceTexts ?? []),
  ];
}
