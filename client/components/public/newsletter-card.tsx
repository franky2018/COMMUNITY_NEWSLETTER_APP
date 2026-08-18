import Link from "next/link";

import type { Newsletter } from "@/types/api";

function formatDate(value?: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type NewsletterCardProps = {
  newsletter: Newsletter;
};

export function NewsletterCard({ newsletter }: NewsletterCardProps) {
  const publishedLabel = formatDate(newsletter.publishedAt);

  return (
    <Link
      href={`/newsletters/${newsletter.slug}`}
      className="flex min-w-0 flex-col rounded-xl border border-black/10 bg-black/[.02] p-5 transition-colors hover:bg-black/[.04] dark:border-white/15 dark:bg-white/[.03] dark:hover:bg-white/[.06]"
    >
      {newsletter.category ? (
        <span className="mb-2 inline-flex w-fit rounded-full border border-black/10 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-white/15 dark:text-zinc-300">
          {newsletter.category.name}
        </span>
      ) : null}

      <h3 className="line-clamp-2 text-base font-semibold break-words">{newsletter.title}</h3>

      {newsletter.excerpt ? (
        <p className="mt-2 line-clamp-3 text-sm text-zinc-600 break-words dark:text-zinc-400">
          {newsletter.excerpt}
        </p>
      ) : null}

      {publishedLabel ? (
        <time dateTime={newsletter.publishedAt ?? undefined} className="mt-auto pt-4 text-xs text-zinc-500">
          {publishedLabel}
        </time>
      ) : null}
    </Link>
  );
}
