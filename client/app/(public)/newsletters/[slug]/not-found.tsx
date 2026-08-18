import Link from "next/link";

export default function NewsletterNotFound() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-medium text-zinc-500">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Newsletter not found</h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        We couldn’t find the newsletter you’re looking for. It may have been moved or is no longer
        published.
      </p>
      <Link
        href="/newsletters"
        className="mt-6 inline-block rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        Back to newsletters
      </Link>
    </section>
  );
}
