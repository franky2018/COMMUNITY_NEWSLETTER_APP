import Image from "next/image";
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
        className="flex items-center justify-center"
      >
        <Image
          src="/logo.png"
          alt="Community Newsletter"
          width={519}
          height={141}
          priority
          className="h-11 w-auto"
        />
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
