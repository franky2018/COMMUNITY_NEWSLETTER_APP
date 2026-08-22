import Link from "next/link";

import { NewsletterList } from "@/components/cms/newsletters/newsletter-list";
import { buttonClasses } from "@/components/ui";

export default function NewslettersPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-heading">Newsletters</h1>
          <p className="mt-1 text-sm text-muted">
            Create, edit, publish, and archive community newsletters.
          </p>
        </div>
        <Link href="/cms/newsletters/new" className={buttonClasses()}>
          New Newsletter
        </Link>
      </header>

      <NewsletterList />
    </div>
  );
}
