import { asData } from "../../data";
import { type Briefing, type Copy, type Locale, type OfferSkeleton, type PageDocument, PageDocumentSchema } from "../../schemas";
import type { AgentDefinition } from "../../types";
import { revisionSection, type RevisionNotes } from "../revision";
import { LANGUAGE_NAMES } from "../shared";
import { SYSTEM, VERSION } from "./prompt.v2";

export type DesignerInput = {
  briefing: Briefing;
  offer: OfferSkeleton;
  copy: Copy;
  revision?: RevisionNotes;
};

/** Days of the refund guarantee mentioned in the offer, if any ("7 dias", "7 days", "30 días"). */
export function guaranteeDays(text: string): number | undefined {
  const m = /(\d{1,2})\s*(dias|days|días|dia|day|día)\b/i.exec(text);
  const n = m ? Number(m[1]) : NaN;
  return n >= 1 && n <= 90 ? n : undefined;
}

/**
 * Fills presentation details the model left out using the copy and the offer, so a page from a
 * smaller model still looks complete. Never adds new claims: every value comes from earlier agents.
 */
const BONUS_LABEL: Record<Locale, string> = { "pt-BR": "Bônus", es: "Bono", en: "Bonus" };

export function polishPage(doc: PageDocument, copy: Copy, offer: OfferSkeleton, language: Locale = "pt-BR"): PageDocument {
  const sp = copy.salesPage;
  const blocks = doc.blocks.map((block) => {
    switch (block.type) {
      case "hero":
        return {
          ...block,
          eyebrow: block.eyebrow || sp.eyebrow,
          highlights: block.highlights?.length ? block.highlights : sp.highlights,
          trustLine: block.trustLine || sp.ctaMicrocopy,
        };
      case "price":
        return {
          ...block,
          includes: block.includes?.length
            ? block.includes
            : [...offer.modules.map((m) => m.title), ...offer.bonuses.map((b) => `${BONUS_LABEL[language]}: ${b.title}`)].slice(0, 12),
          note: block.note || sp.ctaMicrocopy || "",
        };
      case "guarantee":
        return { ...block, days: block.days ?? guaranteeDays(`${offer.guarantee} ${block.title} ${block.text}`) };
      default:
        return block;
    }
  });
  return { ...doc, blocks, checkoutUrl: "" };
}

export const designer: AgentDefinition<DesignerInput, PageDocument> = {
  name: "designer",
  version: VERSION,
  role: "Assembles the sales page in blocks",
  system: SYSTEM,
  outputSchema: PageDocumentSchema,
  // The model never chooses where buyers are sent (polishPage resets checkoutUrl).
  postprocess: (input, output) => polishPage(output, input.copy, input.offer, input.briefing.language),
  buildPrompt: ({ briefing, offer, copy, revision }) =>
    [
      `Write every text field in ${LANGUAGE_NAMES[briefing.language]}.`,
      "Briefing (facts about the creator and the product):",
      asData("briefing", briefing),
      "Offer skeleton:",
      asData("offer", offer),
      "Copy from the Copywriter:",
      asData("copy", copy),
      revisionSection(revision),
    ]
      .filter(Boolean)
      .join("\n\n"),
};
