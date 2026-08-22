import type { ReactNode } from "react";

import { cn } from "./cn";

export type AlertVariant = "error" | "success" | "warning" | "info";

const variantClasses: Record<AlertVariant, string> = {
  error: "border-danger/40 bg-danger-soft text-danger",
  success: "border-success/40 bg-success-soft text-success",
  warning: "border-warning/40 bg-warning-soft text-warning",
  info: "border-primary/40 bg-primary-soft text-primary",
};

type AlertProps = {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
};

export function Alert({ variant = "info", children, className }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
