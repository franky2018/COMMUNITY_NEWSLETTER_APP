import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

import { cn } from "./cn";

export function TableWrap({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("overflow-x-auto rounded-lg border border-border bg-card", className)}
      {...props}
    />
  );
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full border-collapse text-sm", className)} {...props} />;
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn("border-b border-border bg-canvas", className)} {...props} />
  );
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-b border-border/70 last:border-b-0", className)}
      {...props}
    />
  );
}

type ThProps = ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" };

export function Th({ align = "left", className, ...props }: ThProps) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  );
}

type TdProps = TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" };

export function Td({ align = "left", className, ...props }: TdProps) {
  return (
    <td
      className={cn(
        "px-3 py-3 align-middle text-sm text-body",
        align === "right" ? "text-right" : "text-left",
        className,
      )}
      {...props}
    />
  );
}
