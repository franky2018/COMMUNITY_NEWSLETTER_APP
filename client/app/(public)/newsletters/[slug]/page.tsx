import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { apiClient } from "@/lib/api/client";
import type { Newsletter } from "@/types/api";

type NewsletterDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type LookupResult = Newsletter | "not-found" | "error";

const getPublicNewsletters = cache(async (): Promise<Newsletter[] | null> => {
  try {
    return await apiClient.get<Newsletter[]>("/newsletters/public");
  } catch {
    return null;
  }
});

async function findNewsletter(slug: string): Promise<LookupResult> {
  const newsletters = await getPublicNewsletters();

  if (newsletters === null) {
    return "error";
  }

  return newsletters.find((newsletter) => newsletter.slug === slug) ?? "not-found";
}

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
    month: "long",
    day: "numeric",
  });
}

// The CMS edits `content` through a plain textarea, so it is plain text.
// Split on blank lines into paragraphs and preserve single line breaks.
function toParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

const backLinkClass =
  "inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400";

function BackToNewsletters({ className }: { className?: string }) {
  return (
    <Link href="/newsletters" className={className ? `${backLinkClass} ${className}` : backLinkClass}>
      <span aria-hidden="true">←</span> Back to newsletters
    </Link>
  );
}

export async function generateMetadata({ params }: NewsletterDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await findNewsletter(slug);

  if (result === "error" || result === "not-found") {
    return {
      title: "Newsletter not found — Community Newsletter",
    };
  }

  const description = result.excerpt?.trim() || undefined;

  return {
    title: `${result.title} — Community Newsletter`,
    description,
    openGraph: {
      title: result.title,
      description,
      type: "article",
    },
  };
}

export default async function NewsletterDetailPage({ params }: NewsletterDetailPageProps) {
  const { slug } = await params;
  const result = await findNewsletter(slug);

  if (result === "error") {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Unable to load this newsletter.</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Something went wrong while loading this newsletter. Please try again in a little while.
        </p>
        <BackToNewsletters className="mt-6 justify-center" />
      </section>
    );
  }

  if (result === "not-found") {
    notFound();
  }

  const newsletter = result;
  const publishedLabel = formatDate(newsletter.publishedAt);
  const paragraphs = toParagraphs(newsletter.content);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <BackToNewsletters />

      <header className="mt-6 border-b border-black/10 pb-6 dark:border-white/15">
        {newsletter.category ? (
          <span className="inline-flex w-fit rounded-full border border-black/10 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-white/15 dark:text-zinc-300">
            {newsletter.category.name}
          </span>
        ) : null}

        <h1 className="mt-3 text-3xl font-semibold tracking-tight break-words sm:text-4xl">
          {newsletter.title}
        </h1>

        {publishedLabel ? (
          <time
            dateTime={newsletter.publishedAt ?? undefined}
            className="mt-3 block text-sm text-zinc-500"
          >
            {publishedLabel}
          </time>
        ) : null}

        {newsletter.excerpt ? (
          <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">{newsletter.excerpt}</p>
        ) : null}
      </header>

      <div className="mt-8 space-y-5 text-base leading-7">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line break-words">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="whitespace-pre-line break-words">{newsletter.content}</p>
        )}
      </div>

      <footer className="mt-10 border-t border-black/10 pt-6 dark:border-white/15">
        <BackToNewsletters />
      </footer>
    </article>
  );
}
