import type { ButtonHTMLAttributes } from "react";

import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "publish"
  | "ghost";
export type ButtonSize = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary:
    "border border-border bg-card text-heading hover:bg-black/[.04] dark:hover:bg-white/[.06]",
  danger: "bg-danger text-on-danger hover:bg-danger-hover",
  publish: "bg-publish text-on-publish hover:bg-publish-hover",
  ghost: "text-body hover:bg-black/[.05] dark:hover:bg-white/10",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-4 py-2 text-sm",
};

type ButtonClassArgs = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: ButtonClassArgs = {}): string {
  return cn(base, variantClasses[variant], sizeClasses[size], className);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
