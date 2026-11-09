import { asData } from "../../data";
import {
  type AudienceMap,
  type Briefing,
  type CatalogReference,
  type OfferSkeleton,
  OfferSkeletonSchema,
} from "../../schemas";
import type { AgentDefinition } from "../../types";
import { revisionSection, type RevisionNotes } from "../revision";
import { LANGUAGE_NAMES } from "../shared";
import { SYSTEM, VERSION } from "./prompt.v1";

export type StrategistInput = {
  briefing: Briefing;
  audience: AudienceMap;
  reference?: CatalogReference;
  revision?: RevisionNotes;
};

export const strategist: AgentDefinition<StrategistInput, OfferSkeleton> = {
  name: "strategist",
  version: VERSION,
  role: "Defines promise, format, price and product structure",
  system: SYSTEM,
  outputSchema: OfferSkeletonSchema,
  buildPrompt: ({ briefing, audience, reference, revision }) =>
    [
      `Write every text field in ${LANGUAGE_NAMES[briefing.language]}. Currency: ${briefing.currency}.`,
      "Briefing:",
      asData("briefing", briefing),
      "Audience map from the Researcher:",
      asData("audience_map", audience),
      reference ? `Catalog reference (structure only):\n${asData("catalog_reference", reference)}` : "",
      revisionSection(revision),
    ]
      .filter(Boolean)
      .join("\n\n"),
};
