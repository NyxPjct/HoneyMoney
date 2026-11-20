import { DELIVERABLE_SCHEMAS, type Deliverables } from "./schemas";
import type { AgentName } from "./types";

export type DeliverableRow = {
  agent: AgentName;
  status: string;
  output: unknown;
  edited_output: unknown;
  created_at: string;
};

const USABLE_STATUSES = new Set(["succeeded", "changes_requested", "needs_input"]);

/**
 * Latest usable deliverable per agent: newest successful run wins, and the user's edit wins
 * over the model's output. Anything that no longer validates is ignored.
 */
export function pickLatestDeliverables(rows: readonly DeliverableRow[]): Partial<Deliverables> {
  const sorted = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const out: Partial<Record<AgentName, unknown>> = {};
  for (const row of sorted) {
    if (out[row.agent] !== undefined || !USABLE_STATUSES.has(row.status)) continue;
    const value = row.edited_output ?? row.output;
    const parsed = DELIVERABLE_SCHEMAS[row.agent].safeParse(value);
    if (parsed.success) out[row.agent] = parsed.data;
  }
  return out as Partial<Deliverables>;
}
