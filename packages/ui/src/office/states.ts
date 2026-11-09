import type { AgentName } from "@honeymoney/agents";

export type VisualState = "waiting" | "working" | "handoff" | "needs_changes" | "done" | "error";

export type RunLike = {
  agent: AgentName;
  status: "queued" | "running" | "succeeded" | "failed" | "needs_input" | "changes_requested";
  created_at: string;
  finished_at: string | null;
  output?: unknown;
};

export type ProjectLike = {
  status: "draft" | "generating" | "review" | "published";
  awaiting_agent: AgentName | null;
};

export const OFFICE_AGENTS: readonly AgentName[] = [
  "manager",
  "researcher",
  "strategist",
  "copywriter",
  "designer",
  "sentinel",
];

/** How long an agent shows the "handing off" animation after finishing. */
export const HANDOFF_MS = 4000;

export function latestRuns(runs: readonly RunLike[]): Partial<Record<AgentName, RunLike>> {
  const out: Partial<Record<AgentName, RunLike>> = {};
  for (const run of runs) {
    const current = out[run.agent];
    if (!current || run.created_at > current.created_at) out[run.agent] = run;
  }
  return out;
}

/**
 * The office mirrors the backend: each character's animation comes from the real state of
 * that agent's latest run (agent_runs), plus the project status.
 */
export function deriveOfficeStates(
  runs: readonly RunLike[],
  project: ProjectLike,
  now: number = Date.now(),
): Record<AgentName, VisualState> {
  const latest = latestRuns(runs);
  const generating = project.status === "generating";
  const sentinelRun = latest.sentinel;
  const sentBack = new Set<string>();
  if (sentinelRun?.status === "changes_requested") {
    const issues = (sentinelRun.output as { issues?: { agent: string; severity: string }[] } | undefined)?.issues ?? [];
    for (const issue of issues) if (issue.severity === "blocker") sentBack.add(issue.agent);
  }

  const states = {} as Record<AgentName, VisualState>;
  for (const agent of OFFICE_AGENTS) {
    const run = latest[agent];
    let state: VisualState = "waiting";
    if (run) {
      switch (run.status) {
        case "queued":
        case "running":
          state = "working";
          break;
        case "failed":
          state = "error";
          break;
        case "needs_input":
        case "changes_requested":
          state = "needs_changes";
          break;
        case "succeeded": {
          const finished = run.finished_at ? Date.parse(run.finished_at) : 0;
          if (project.awaiting_agent === agent) state = "handoff";
          else if (generating && now - finished < HANDOFF_MS) state = "handoff";
          else state = "done";
          break;
        }
      }
      // Sent back by the Sentinel and not redone yet.
      if (
        sentBack.has(agent) &&
        sentinelRun &&
        run.created_at < sentinelRun.created_at &&
        state !== "working"
      ) {
        state = "needs_changes";
      }
    }
    states[agent] = state;
  }

  // The Manager coordinates the queue while the team works.
  if (generating && states.manager === "done") states.manager = "working";
  return states;
}

export const STATE_LABELS: Record<VisualState, string> = {
  waiting: "Esperando",
  working: "Trabalhando",
  handoff: "Entregando",
  needs_changes: "Pedindo ajuste",
  done: "Concluído",
  error: "Erro",
};
