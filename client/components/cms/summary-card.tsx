import Link from "next/link";
import type { Route } from "next";

type SummaryCardProps = {
  title: string;
  description?: string;
  href?: Route;
};

function CardBody({ title, description }: Pick<SummaryCardProps, "title" | "description">) {
  return (
    <>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{title}</span>
        <span className="text-2xl font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">
          —
        </span>
      </div>
      <p className="mt-3 text-xs text-zinc-500">{description ?? "Not connected yet."}</p>
    </>
  );
}

export function SummaryCard({ title, description, href }: SummaryCardProps) {
  const className =
    "block rounded-xl border border-black/10 bg-black/[.02] p-5 dark:border-white/15 dark:bg-white/[.03]";

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]`}
      >
        <CardBody title={title} description={description} />
      </Link>
    );
  }

  return (
    <div className={className}>
      <CardBody title={title} description={description} />
    </div>
  );
}
