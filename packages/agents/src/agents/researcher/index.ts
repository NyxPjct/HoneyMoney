import { asData } from "../../data";
import { type AudienceMap, AudienceMapOutputSchema, type Briefing, type CatalogReference } from "../../schemas";
import type { AgentDefinition } from "../../types";
import { LANGUAGE_NAMES } from "../shared";
import { revisionSection, type RevisionNotes } from "../revision";
import { SYSTEM, VERSION } from "./prompt.v2";

export type ResearcherInput = {
  briefing: Briefing;
  reference?: CatalogReference;
  revision?: RevisionNotes;
};

export const researcher: AgentDefinition<ResearcherInput, AudienceMap> = {
  name: "researcher",
  version: VERSION,
  role: "Maps niche, pains and objections of the audience",
  system: SYSTEM,
  outputSchema: AudienceMapOutputSchema,
  buildPrompt: ({ briefing, reference, revision }) =>
    [
      `Write every text field in ${LANGUAGE_NAMES[briefing.language]}.`,
      "Briefing:",
      asData("briefing", briefing),
      reference ? `Catalog reference (structure only):\n${asData("catalog_reference", reference)}` : "",
      revisionSection(revision),
    ]
      .filter(Boolean)
      .join("\n\n"),
};
