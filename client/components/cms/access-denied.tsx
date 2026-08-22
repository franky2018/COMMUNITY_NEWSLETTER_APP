import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { buttonClasses } from "@/components/ui";

type AccessDeniedProps = {
  title?: string;
  description?: ReactNode;
  backHref?: Route;
  backLabel?: string;
  className?: string;
};

export function AccessDenied({
  title = "Access denied",
  description = "You don't have permission to view this page.",
  backHref,
  backLabel = "Go back",
  className,
}: AccessDeniedProps) {
  return (
    <div
      className={`mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm ${className ?? "mt-8"}`}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h1 className="font-serif text-xl font-semibold text-heading">{title}</h1>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {backHref ? (
        <Link href={backHref} className={buttonClasses({ variant: "secondary", className: "mt-6" })}>
          {backLabel}
        </Link>
      ) : null}
    </div>
  );
}
