import Link from "next/link";

import { buttonClasses } from "@/components/ui";

export default function NewsletterNotFound() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-heading">
        Newsletter not found
      </h1>
      <p className="mt-3 text-sm text-body">
        We couldn’t find the newsletter you’re looking for. It may have been moved or is no longer
        published.
      </p>
      <Link href="/newsletters" className={buttonClasses({ variant: "secondary", className: "mt-6" })}>
        Back to newsletters
      </Link>
    </section>
  );
}
