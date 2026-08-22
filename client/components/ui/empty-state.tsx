import type { ReactNode } from "react";

import { cn } from "./cn";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border bg-card p-10 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-3 flex justify-center text-muted">{icon}</div> : null}
      <h3 className="font-serif text-base font-semibold text-heading">{title}</h3>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
