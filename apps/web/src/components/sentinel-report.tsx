import type { SentinelReport } from "@honeymoney/agents";
import { Badge } from "@honeymoney/ui";
import { AGENT_META } from "@honeymoney/ui/office";
import { CATEGORY_LABELS } from "@/lib/labels";

export function SentinelReportView({ report }: { report: SentinelReport }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center gap-2">
        <Badge tone={report.approved ? "green" : "red"}>{report.approved ? "Aprovado" : "Precisa de ajustes"}</Badge>
      </div>
      <p>{report.summary}</p>
      {report.issues.length > 0 && (
        <ul className="space-y-2">
          {report.issues.map((issue, i) => (
            <li key={i} className="rounded-lg border border-stone-200 p-3 dark:border-stone-700">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={issue.severity === "blocker" ? "red" : "amber"}>
                  {issue.severity === "blocker" ? "Bloqueia" : "Sugestão"}
                </Badge>
                <Badge>{CATEGORY_LABELS[issue.category] ?? issue.category}</Badge>
                <span className="text-xs text-stone-500">→ {AGENT_META[issue.agent].name}</span>
              </div>
              <p className="mt-2">{issue.problem}</p>
              {issue.suggestion && <p className="mt-1 text-stone-500">Sugestão: {issue.suggestion}</p>}
              {issue.location && <p className="mt-1 font-mono text-[11px] text-stone-400">{issue.location}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
