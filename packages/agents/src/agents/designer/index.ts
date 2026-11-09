import { asData } from "../../data";
import { type Briefing, type Copy, type OfferSkeleton, type PageDocument, PageDocumentSchema } from "../../schemas";
import type { AgentDefinition } from "../../types";
import { revisionSection, type RevisionNotes } from "../revision";
import { LANGUAGE_NAMES } from "../shared";
import { SYSTEM, VERSION } from "./prompt.v1";

export type DesignerInput = {
  briefing: Briefing;
  offer: OfferSkeleton;
  copy: Copy;
  revision?: RevisionNotes;
};

export const designer: AgentDefinition<DesignerInput, PageDocument> = {
  name: "designer",
  version: VERSION,
  role: "Assembles the sales page in blocks",
  system: SYSTEM,
  outputSchema: PageDocumentSchema,
  // The model never chooses where buyers are sent.
  postprocess: (_input, output) => ({ ...output, checkoutUrl: "" }),
  buildPrompt: ({ briefing, offer, copy, revision }) =>
    [
      `Write every text field in ${LANGUAGE_NAMES[briefing.language]}.`,
      "Offer skeleton:",
      asData("offer", offer),
      "Copy from the Copywriter:",
      asData("copy", copy),
      revisionSection(revision),
    ]
      .filter(Boolean)
      .join("\n\n"),
};
