import { asData } from "../../data";
import { runDeterministicChecks } from "../../safety";
import {
  type AudienceMap,
  type Briefing,
  type CatalogReference,
  type Copy,
  type OfferSkeleton,
  type PageDocument,
  type SentinelIssue,
  type SentinelReport,
  SentinelReportSchema,
} from "../../schemas";
import type { AgentDefinition } from "../../types";
import { LANGUAGE_NAMES } from "../shared";
import { SYSTEM, VERSION } from "./prompt.v1";

export type SentinelInput = {
  briefing: Briefing;
  audience?: AudienceMap;
  offer?: OfferSkeleton;
  copy?: Copy;
  page?: PageDocument;
  reference?: CatalogReference;
  /** Third-party texts that must not be copied (Phase 2 catalog). */
  referenceTexts?: string[];
};

function dedupe(issues: SentinelIssue[]): SentinelIssue[] {
  const seen = new Set<string>();
  return issues.filter((i) => {
    const key = `${i.agent}|${i.category}|${i.location}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const sentinel: AgentDefinition<SentinelInput, SentinelReport> = {
  name: "sentinel",
  version: VERSION,
  role: "Reviews everything: exaggerated promises, health or income claims, errors",
  system: SYSTEM,
  outputSchema: SentinelReportSchema,
  postprocess: (input, report) => {
    const ruleIssues = runDeterministicChecks({
      offer: input.offer,
      copy: input.copy,
      page: input.page,
      referenceTexts: input.referenceTexts,
    });
    // Rule-based findings first so they survive deduplication.
    const issues = dedupe([...ruleIssues, ...report.issues]).slice(0, 30);
    const approved = !issues.some((i) => i.severity === "blocker");
    return { ...report, approved, issues };
  },
  buildPrompt: (input) =>
    [
      `Deliverables language: ${LANGUAGE_NAMES[input.briefing.language]}.`,
      "Briefing:",
      asData("briefing", input.briefing),
      input.audience ? `Audience map (researcher):\n${asData("audience_map", input.audience)}` : "",
      input.offer ? `Offer skeleton (strategist):\n${asData("offer", input.offer)}` : "",
      input.copy ? `Copy (copywriter):\n${asData("copy", input.copy)}` : "",
      input.page ? `Sales page blocks (designer):\n${asData("page", input.page)}` : "",
      input.reference ? `Catalog reference:\n${asData("catalog_reference", input.reference)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
};
