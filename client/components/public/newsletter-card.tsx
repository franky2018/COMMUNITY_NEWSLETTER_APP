import Image from "next/image";
import Link from "next/link";

import type { Newsletter } from "@/types/api";
import { Badge } from "@/components/ui";

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
      className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
    >
      {newsletter.featuredImageUrl ? (
        <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg bg-canvas">
          <Image
            src={newsletter.featuredImageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : null}

      {newsletter.category ? (
        <Badge tone="neutral" className="mb-2 w-fit">
          {newsletter.category.name}
        </Badge>
      ) : null}

      <h3 className="line-clamp-2 break-words font-serif text-base font-semibold text-heading">
        {newsletter.title}
      </h3>

      {newsletter.excerpt ? (
        <p className="mt-2 line-clamp-3 break-words text-sm text-body">{newsletter.excerpt}</p>
      ) : null}

      {publishedLabel ? (
        <time dateTime={newsletter.publishedAt ?? undefined} className="mt-auto pt-4 text-xs text-muted">
          {publishedLabel}
        </time>
      ) : null}
    </Link>
  );
}
