import type { ReactNode } from "react";

import { cn } from "./cn";

export type BadgeTone = "neutral" | "success" | "danger" | "warning" | "primary";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-border bg-black/[.04] text-muted dark:bg-white/[.06]",
  success: "border-success/40 bg-success-soft text-success",
  danger: "border-danger/40 bg-danger-soft text-danger",
  warning: "border-warning/40 bg-warning-soft text-warning",
  primary: "border-primary/40 bg-primary-soft text-primary",
};

const dotClasses: Record<BadgeTone, string> = {
  neutral: "bg-muted",
  success: "bg-success",
  danger: "bg-danger",
  warning: "bg-warning",
  primary: "bg-primary",
};

type BadgeProps = {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
};

export function Badge({ tone = "neutral", dot = false, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", dotClasses[tone])} /> : null}
      {children}
    </span>
  );
}
