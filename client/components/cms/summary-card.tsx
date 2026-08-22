import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { Button, Skeleton } from "@/components/ui";

type SummaryCardState = "loading" | "loaded" | "error";

type SummaryCardProps = {
  label: string;
  href?: Route;
  state?: SummaryCardState;
  value?: number | null;
  delta?: number | null;
  caption?: string;
  icon?: ReactNode;
  onRetry?: () => void;
};

const containerClass = "rounded-xl border border-border bg-card p-5 shadow-sm";

function Header({ label, icon }: { label: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
      {icon ? <span className="text-muted">{icon}</span> : null}
    </div>
  );
}

function Footnote({ delta, caption }: { delta?: number | null; caption?: string }) {
  if (delta !== null && delta !== undefined) {
    if (delta > 0) {
      return <p className="mt-2 text-xs font-medium text-success">+{delta} this month</p>;
    }
    return <p className="mt-2 text-xs text-muted">No change this month</p>;
  }
  if (caption) {
    return <p className="mt-2 text-xs text-muted">{caption}</p>;
  }
  return null;
}

export function SummaryCard({
  label,
  href,
  state = "loaded",
  value,
  delta,
  caption,
  icon,
  onRetry,
}: SummaryCardProps) {
  if (state === "error") {
    return (
      <div className={containerClass}>
        <Header label={label} icon={icon} />
        <p className="mt-3 text-xs text-danger">Couldn’t load {label.toLowerCase()}.</p>
        {onRetry ? (
          <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  const body =
    state === "loading" ? (
      <>
        <Header label={label} icon={icon} />
        <Skeleton className="mt-3 h-9 w-16" />
        <Skeleton className="mt-2 h-3 w-24" />
      </>
    ) : (
      <>
        <Header label={label} icon={icon} />
        <div className="mt-3 font-serif text-3xl font-semibold tabular-nums text-heading">
          {value ?? 0}
        </div>
        <Footnote delta={delta} caption={caption} />
      </>
    );

  if (href) {
    return (
      <Link
        href={href}
        className={`${containerClass} block transition-colors hover:border-primary/40`}
      >
        {body}
      </Link>
    );
  }

  return <div className={containerClass}>{body}</div>;
}
