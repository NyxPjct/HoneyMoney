import type { AgentName, PipelineAgent } from "@honeymoney/agents";

/** Every event the web app sends to the queue. */
export type Events = {
  "project/generation.requested": {
    data: { projectId: string; userId: string; startFrom?: PipelineAgent };
  };
  "project/step.approved": {
    data: { projectId: string; userId: string; agent: AgentName };
  };
  "project/generation.cancelled": {
    data: { projectId: string; userId: string };
  };
  "page/review.requested": {
    data: { projectId: string; userId: string };
  };
};
