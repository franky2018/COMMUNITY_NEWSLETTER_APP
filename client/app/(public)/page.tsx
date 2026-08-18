import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterFeed } from "@/components/public/newsletter-feed";

export const metadata: Metadata = {
  title: "Community Newsletter",
  description:
    "Read the latest community newsletters and subscribe to get new issues delivered to your inbox.",
};

export default function PublicHomePage() {
  return (
    <>
      <section className="border-b border-black/10 dark:border-white/15">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              News and updates from your community
            </h1>
            <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400">
              Read the latest community newsletters and subscribe to get new issues delivered
              straight to your inbox.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/subscribe"
                className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Subscribe
              </Link>
              <Link
                href="/newsletters"
                className="rounded-md border border-black/15 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              >
                Browse newsletters
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">Latest newsletters</h2>
          <Link
            href="/newsletters"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
          >
            View all →
          </Link>
        </div>

        <div className="mt-6">
          <NewsletterFeed limit={6} />
        </div>
      </section>
    </>
  );
}
