import type { Metadata } from "next";

import { NewsletterFeed } from "@/components/public/newsletter-feed";

export const metadata: Metadata = {
  title: "Newsletters — Community Newsletter",
  description: "Browse all published community newsletters.",
};

export default function NewslettersPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-heading">Newsletters</h1>
        <p className="mt-2 text-sm text-muted">
          Browse the latest published community newsletters.
        </p>
      </header>

      <div className="mt-8">
        <NewsletterFeed />
      </div>
    </section>
  );
}
