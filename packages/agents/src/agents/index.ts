import type { AgentName } from "../types";
import { copywriter } from "./copywriter";
import { designer } from "./designer";
import { manager } from "./manager";
import { researcher } from "./researcher";
import { sentinel } from "./sentinel";
import { strategist } from "./strategist";

export { copywriter, designer, manager, researcher, sentinel, strategist };
export type { ManagerInput } from "./manager";
export type { ResearcherInput } from "./researcher";
export type { StrategistInput } from "./strategist";
export type { CopywriterInput } from "./copywriter";
export type { DesignerInput } from "./designer";
export type { SentinelInput } from "./sentinel";
export type { RevisionNotes } from "./revision";

export const AGENTS = { manager, researcher, strategist, copywriter, designer, sentinel } as const;

export const PROMPT_VERSIONS: Record<AgentName, string> = {
  manager: manager.version,
  researcher: researcher.version,
  strategist: strategist.version,
  copywriter: copywriter.version,
  designer: designer.version,
  sentinel: sentinel.version,
};
