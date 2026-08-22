import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterFeed } from "@/components/public/newsletter-feed";
import { buttonClasses } from "@/components/ui";

export const metadata: Metadata = {
  title: "Community Newsletter",
  description:
    "Read the latest community newsletters and subscribe to get new issues delivered to your inbox.",
};

export default function PublicHomePage() {
  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl font-semibold tracking-tight text-heading sm:text-5xl">
              News and updates from your community
            </h1>
            <p className="mt-4 text-base text-body">
              Read the latest community newsletters and subscribe to get new issues delivered
              straight to your inbox.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/subscribe" className={buttonClasses({ className: "px-5 py-2.5" })}>
                Subscribe
              </Link>
              <Link
                href="/newsletters"
                className={buttonClasses({ variant: "secondary", className: "px-5 py-2.5" })}
              >
                Browse newsletters
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-heading">
            Latest newsletters
          </h2>
          <Link
            href="/newsletters"
            className="text-sm font-medium text-muted transition-colors hover:text-primary"
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
