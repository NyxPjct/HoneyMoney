import { asData } from "../../data";
import { briefingText, detectProhibitedTopic } from "../../safety";
import { type Briefing, type ManagerOutput, ManagerOutputSchema } from "../../schemas";
import type { AgentDefinition } from "../../types";
import { LANGUAGE_NAMES } from "../shared";
import { SYSTEM, VERSION } from "./prompt.v1";

export type ManagerInput = { briefing: Briefing };

export const manager: AgentDefinition<ManagerInput, ManagerOutput> = {
  name: "manager",
  version: VERSION,
  role: "Coordinates the queue and asks you when information is missing",
  system: SYSTEM,
  outputSchema: ManagerOutputSchema,
  precheck: ({ briefing }) => {
    const topic = detectProhibitedTopic(briefingText(briefing));
    if (!topic) return null;
    return {
      status: "rejected",
      summary: "The briefing is about a topic HoneyMoney does not support.",
      questions: [],
      rejectionReason: `HoneyMoney helps you create and sell your own products. It does not work with ${topic}.`,
    };
  },
  buildPrompt: ({ briefing }) =>
    [
      `Write questions and summary in ${LANGUAGE_NAMES[briefing.language]}.`,
      "Briefing:",
      asData("briefing", briefing),
    ].join("\n"),
};
