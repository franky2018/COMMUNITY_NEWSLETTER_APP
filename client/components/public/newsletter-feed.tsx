"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import type { Newsletter } from "@/types/api";
import { NewsletterCard } from "./newsletter-card";

type LoadState = "loading" | "loaded" | "error";

const gridClass = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

const primaryCtaClass =
  "inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90";

const retryButtonClass =
  "mt-4 rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

type NewsletterFeedProps = {
  limit?: number;
};

function FeedSkeleton() {
  return (
    <div className={gridClass} aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col rounded-xl border border-black/10 bg-black/[.02] p-5 dark:border-white/15 dark:bg-white/[.03]"
        >
          <div className="h-4 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-3 h-5 w-3/4 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 h-3 w-24 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function NewsletterFeed({ limit }: NewsletterFeedProps) {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(async (signal?: AbortSignal) => {
    setState("loading");

    try {
      const data = await apiClient.get<Newsletter[]>("/newsletters/public", { signal });

      if (signal?.aborted) {
        return;
      }

      setNewsletters(data);
      setState("loaded");
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
        return;
      }

      setState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    return () => controller.abort();
  }, [load]);

  if (state === "loading") {
    return <FeedSkeleton />;
  }

  if (state === "error") {
    return (
      <div className="rounded-xl border border-black/10 p-8 text-center dark:border-white/15">
        <p className="text-sm font-medium">We couldn’t load newsletters right now.</p>
        <p className="mt-1 text-sm text-zinc-500">Please check your connection and try again.</p>
        <button type="button" onClick={() => void load()} className={retryButtonClass}>
          Try again
        </button>
      </div>
    );
  }

  if (newsletters.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-black/15 p-10 text-center dark:border-white/20">
        <p className="text-sm font-medium">No newsletters have been published yet.</p>
        <p className="mt-1 text-sm text-zinc-500">
          Check back soon, or subscribe to get new issues in your inbox.
        </p>
        <Link href="/subscribe" className={`mt-4 ${primaryCtaClass}`}>
          Subscribe
        </Link>
      </div>
    );
  }

  const visible = typeof limit === "number" ? newsletters.slice(0, limit) : newsletters;

  return (
    <div className={gridClass}>
      {visible.map((newsletter) => (
        <NewsletterCard key={newsletter.id} newsletter={newsletter} />
      ))}
    </div>
  );
}
