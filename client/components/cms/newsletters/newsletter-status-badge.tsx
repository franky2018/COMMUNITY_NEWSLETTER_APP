import type { NewsletterStatus } from "@/types/api";

const STATUS_STYLES: Record<NewsletterStatus, string> = {
  DRAFT: "border-black/15 text-zinc-600 dark:border-white/20 dark:text-zinc-400",
  PUBLISHED: "border-green-600/40 text-green-700 dark:border-green-500/40 dark:text-green-400",
  ARCHIVED: "border-black/10 text-zinc-500 dark:border-white/10 dark:text-zinc-500",
};

export function NewsletterStatusBadge({ status }: { status: NewsletterStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
