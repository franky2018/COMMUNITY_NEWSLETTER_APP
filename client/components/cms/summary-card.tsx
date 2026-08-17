import Link from "next/link";
import type { Route } from "next";

export type SummaryCardItem = {
  label: string;
  value: number;
};

type SummaryCardState = "loading" | "loaded" | "error";

type SummaryCardProps = {
  title: string;
  href?: Route;
  state?: SummaryCardState;
  value?: number | null;
  caption?: string;
  items?: SummaryCardItem[];
  onRetry?: () => void;
};

const containerClass =
  "block rounded-xl border border-black/10 bg-black/[.02] p-5 dark:border-white/15 dark:bg-white/[.03]";

const skeletonBar = "animate-pulse rounded bg-black/10 dark:bg-white/10";

function LoadingBody({ title }: { title: string }) {
  return (
    <>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{title}</span>
        <span className={`inline-block h-7 w-12 ${skeletonBar}`} />
      </div>
      <div className={`mt-4 h-3 w-2/3 ${skeletonBar}`} />
    </>
  );
}

function LoadedBody({
  title,
  value,
  caption,
  items,
}: Pick<SummaryCardProps, "title" | "value" | "caption" | "items">) {
  return (
    <>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{title}</span>
        <span className="text-2xl font-semibold tabular-nums">{value ?? 0}</span>
      </div>
      {items && items.length > 0 ? (
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
          {items.map((item) => (
            <div key={item.label}>
              <dt className="inline">{item.label}: </dt>
              <dd className="inline font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : caption ? (
        <p className="mt-3 text-xs text-zinc-500">{caption}</p>
      ) : null}
    </>
  );
}

export function SummaryCard({
  title,
  href,
  state = "loaded",
  value,
  caption,
  items,
  onRetry,
}: SummaryCardProps) {
  if (state === "error") {
    return (
      <div className={containerClass}>
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{title}</span>
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">
          Couldn’t load {title.toLowerCase()}.
        </p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-md border border-black/15 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  const body =
    state === "loading" ? (
      <LoadingBody title={title} />
    ) : (
      <LoadedBody title={title} value={value} caption={caption} items={items} />
    );

  if (href) {
    return (
      <Link
        href={href}
        className={`${containerClass} transition-colors hover:bg-black/[.04] dark:hover:bg-white/[.06]`}
      >
        {body}
      </Link>
    );
  }

  return <div className={containerClass}>{body}</div>;
}
