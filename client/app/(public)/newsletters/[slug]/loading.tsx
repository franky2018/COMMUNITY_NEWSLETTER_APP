import { Skeleton } from "@/components/ui";

export default function NewsletterDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14" role="status">
      <span className="sr-only">Loading newsletter…</span>

      <div aria-hidden="true">
        <Skeleton className="h-4 w-32" />

        <div className="mt-6 border-b border-border pb-6">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="mt-3 h-9 w-3/4" />
          <Skeleton className="mt-4 h-3 w-40" />
        </div>

        <div className="mt-8 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-full" />
          ))}
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}
