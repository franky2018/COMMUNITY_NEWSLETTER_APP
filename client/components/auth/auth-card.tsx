import Link from "next/link";
import type { ReactNode } from "react";

import { Card } from "@/components/ui";

type AuthCardProps = {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="space-y-6">
      <Link
        href="/"
        aria-label="Community Newsletter home"
        className="flex items-center justify-center gap-2.5"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h13a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V4Z" />
            <path d="M8 8h7M8 12h7M8 16h4" />
          </svg>
        </span>
        <span className="font-serif text-lg font-semibold text-heading">Community Newsletter</span>
      </Link>

      <Card className="p-6 sm:p-8">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl font-semibold text-heading">{title}</h1>
          {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
        </div>
        <div className="mt-6">{children}</div>
      </Card>

      {footer ? <div className="text-center text-sm text-muted">{footer}</div> : null}
    </div>
  );
}
