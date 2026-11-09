import type { HTMLAttributes } from "react";
import { cn } from "../cn";

const tones = {
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
} as const;

export function Alert({
  className,
  tone = "info",
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: keyof typeof tones }) {
  return <div role="status" className={cn("rounded-lg border px-4 py-3 text-sm", tones[tone], className)} {...props} />;
}
