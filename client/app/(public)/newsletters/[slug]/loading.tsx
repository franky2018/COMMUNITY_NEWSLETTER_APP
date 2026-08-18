export default function NewsletterDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14" role="status">
      <span className="sr-only">Loading newsletter…</span>

      <div aria-hidden="true">
        <div className="h-4 w-32 animate-pulse rounded bg-black/10 dark:bg-white/10" />

        <div className="mt-6 border-b border-black/10 pb-6 dark:border-white/15">
          <div className="h-5 w-24 animate-pulse rounded-full bg-black/10 dark:bg-white/10" />
          <div className="mt-3 h-9 w-3/4 animate-pulse rounded bg-black/10 dark:bg-white/10" />
          <div className="mt-4 h-3 w-40 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>

        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-3 w-full animate-pulse rounded bg-black/10 dark:bg-white/10"
            />
          ))}
          <div className="h-3 w-2/3 animate-pulse rounded bg-black/10 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}
