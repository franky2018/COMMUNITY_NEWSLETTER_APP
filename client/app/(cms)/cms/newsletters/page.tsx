import Link from "next/link";

import { NewsletterList } from "@/components/cms/newsletters/newsletter-list";

export default function NewslettersPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Newsletters</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Create, edit, publish, and archive community newsletters.
          </p>
        </div>
        <Link
          href="/cms/newsletters/new"
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          New Newsletter
        </Link>
      </header>

      <NewsletterList />
    </div>
  );
}
