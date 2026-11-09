import { asData } from "../data";
import type { SentinelIssue } from "../schemas";

export type RevisionNotes = { issues: SentinelIssue[]; previous?: unknown };

export function revisionSection(revision: RevisionNotes | undefined): string {
  if (!revision || revision.issues.length === 0) return "";
  return [
    "## Revision requested by the Sentinel",
    "Your previous deliverable was sent back. Fix every issue below and keep everything else that was good.",
    asData("sentinel_issues", revision.issues),
    revision.previous ? `Previous deliverable:\n${asData("previous_deliverable", revision.previous)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
