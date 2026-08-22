import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "./cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-xl border border-border bg-card shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cn("flex items-center justify-between gap-3 border-b border-border px-5 py-4", className)}
      {...props}
    />
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("font-serif text-lg font-semibold text-heading", className)}>
      {children}
    </h2>
  );
}

export function CardBody({ className, ...props }: CardProps) {
  return <div className={cn("p-5", className)} {...props} />;
}
