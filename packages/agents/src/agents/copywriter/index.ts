import { asData } from "../../data";
import { type AudienceMap, type Briefing, type Copy, CopySchema, type OfferSkeleton } from "../../schemas";
import type { AgentDefinition } from "../../types";
import { revisionSection, type RevisionNotes } from "../revision";
import { LANGUAGE_NAMES } from "../shared";
import { SYSTEM, VERSION } from "./prompt.v1";

export type CopywriterInput = {
  briefing: Briefing;
  audience: AudienceMap;
  offer: OfferSkeleton;
  revision?: RevisionNotes;
};

export const copywriter: AgentDefinition<CopywriterInput, Copy> = {
  name: "copywriter",
  version: VERSION,
  role: "Writes headline, sales page, e-mails and ads",
  system: SYSTEM,
  outputSchema: CopySchema,
  buildPrompt: ({ briefing, audience, offer, revision }) =>
    [
      `Write every text field in ${LANGUAGE_NAMES[briefing.language]}.`,
      "Briefing:",
      asData("briefing", briefing),
      "Audience map:",
      asData("audience_map", audience),
      "Offer skeleton from the Strategist:",
      asData("offer", offer),
      revisionSection(revision),
    ]
      .filter(Boolean)
      .join("\n\n"),
};
