"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import type { Newsletter } from "@/types/api";
import { Button, EmptyState, Skeleton, buttonClasses } from "@/components/ui";
import { NewsletterCard } from "./newsletter-card";

type LoadState = "loading" | "loaded" | "error";

const gridClass = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

type NewsletterFeedProps = {
  limit?: number;
};

function FeedSkeleton() {
  return (
    <div className={gridClass} aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-3 h-5 w-3/4" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-5/6" />
          <Skeleton className="mt-4 h-3 w-24" />
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
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="font-serif text-base font-semibold text-heading">
          We couldn’t load newsletters right now.
        </p>
        <p className="mt-1 text-sm text-muted">Please check your connection and try again.</p>
        <Button variant="secondary" onClick={() => void load()} className="mt-4">
          Try again
        </Button>
      </div>
    );
  }

  if (newsletters.length === 0) {
    return (
      <EmptyState
        title="No newsletters have been published yet."
        description="Check back soon, or subscribe to get new issues in your inbox."
        action={
          <Link href="/subscribe" className={buttonClasses()}>
            Subscribe
          </Link>
        }
      />
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
