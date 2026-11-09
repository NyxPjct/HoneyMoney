import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../cn";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    tone: {
      neutral: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
      amber: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-300",
      green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
      red: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
      blue: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
