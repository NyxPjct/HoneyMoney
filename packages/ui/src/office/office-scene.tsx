import type { AgentName } from "@honeymoney/agents";
import { cn } from "../cn";
import { AgentSprite } from "./agent-sprite";
import { AGENT_META } from "./agents-meta";
import { OFFICE_CSS } from "./office-css";
import { OFFICE_AGENTS, STATE_LABELS, type VisualState } from "./states";

const STATE_TONE: Record<VisualState, string> = {
  waiting: "bg-stone-200 text-stone-700",
  working: "bg-amber-200 text-amber-900",
  handoff: "bg-sky-200 text-sky-900",
  needs_changes: "bg-orange-200 text-orange-900",
  done: "bg-emerald-200 text-emerald-900",
  error: "bg-red-200 text-red-900",
};

export type OfficeSceneProps = {
  states: Record<AgentName, VisualState>;
  selected?: AgentName | null;
  onSelect?: (agent: AgentName) => void;
  className?: string;
  title?: string;
};

/** The animated agent office. Each desk is a button that opens what that agent produced. */
export function OfficeScene({ states, selected, onSelect, className, title = "Escritório HoneyMoney" }: OfficeSceneProps) {
  return (
    <section
      aria-label={title}
      className={cn("overflow-hidden rounded-2xl border border-amber-200/70 shadow-sm dark:border-stone-700", className)}
    >
      <style>{OFFICE_CSS}</style>
      {/* wall */}
      <div className="relative flex h-14 items-center justify-between bg-gradient-to-b from-amber-100 to-amber-50 px-4 text-amber-900">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span aria-hidden className="inline-block h-5 w-5 rounded-full bg-amber-400 shadow-inner" />
          {title}
        </div>
        <div aria-hidden className="hidden gap-3 sm:flex">
          <span className="h-8 w-12 rounded-sm border-2 border-amber-200 bg-sky-100" />
          <span className="h-8 w-12 rounded-sm border-2 border-amber-200 bg-sky-100" />
        </div>
      </div>
      {/* floor */}
      <div
        className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:gap-4 sm:p-5"
        style={{
          backgroundColor: "#fbf3e0",
          backgroundImage:
            "repeating-conic-gradient(#f6e8c8 0% 25%, transparent 0% 50%)",
          backgroundSize: "48px 48px",
        }}
      >
        {OFFICE_AGENTS.map((agent) => {
          const meta = AGENT_META[agent];
          const state = states[agent];
          const isSelected = selected === agent;
          const className = cn(
            "group flex flex-col items-center rounded-xl bg-white/60 p-2 text-stone-900 transition",
            onSelect && "hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
            isSelected && "bg-white ring-2 ring-amber-500",
          );
          const content = (
            <>
              <AgentSprite agent={agent} state={state} size={150} />
              <span className="mt-1 text-sm font-semibold">{meta.name}</span>
              <span className="line-clamp-1 text-[11px] text-stone-500">{meta.deliverable}</span>
              <span className={cn("mt-1 rounded-full px-2 py-0.5 text-[11px] font-medium", STATE_TONE[state])}>
                {STATE_LABELS[state]}
              </span>
            </>
          );
          // Without a handler (e.g. rendered on the server for the landing page) desks are static.
          if (!onSelect) {
            return (
              <div key={agent} className={className}>
                {content}
              </div>
            );
          }
          return (
            <button key={agent} type="button" onClick={() => onSelect(agent)} aria-pressed={isSelected} className={className}>
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
