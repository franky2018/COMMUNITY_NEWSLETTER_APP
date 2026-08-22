import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "./cn";

const controlBase =
  "w-full rounded-md border bg-card px-3 py-2 text-sm text-heading outline-none transition-colors placeholder:text-muted focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50";

function controlClasses(error: boolean | undefined, className?: string): string {
  return cn(
    controlBase,
    error
      ? "border-danger focus:border-danger focus:ring-danger/30"
      : "border-input focus:border-primary focus:ring-primary/30",
    className,
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { error?: boolean };

export function Input({ error, className, ...props }: InputProps) {
  return <input className={controlClasses(error, className)} {...props} />;
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea className={cn(controlClasses(error, className), "resize-y")} {...props} />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean };

export function Select({ error, className, ...props }: SelectProps) {
  return <select className={controlClasses(error, className)} {...props} />;
}

type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function Label({ required, children, className, ...props }: LabelProps) {
  return (
    <label
      className={cn("block text-sm font-medium text-heading", className)}
      {...props}
    >
      {children}
      {required ? <span className="text-danger"> *</span> : null}
    </label>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) {
    return null;
  }

  return (
    <p className="text-xs text-danger" role="alert">
      {children}
    </p>
  );
}

export function FieldHint({ children }: { children?: ReactNode }) {
  if (!children) {
    return null;
  }

  return <p className="text-xs text-muted">{children}</p>;
}
