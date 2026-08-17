import type { SubscriberStatus } from "@/types/api";

const STATUS_STYLES: Record<SubscriberStatus, string> = {
  ACTIVE: "border-green-600/40 text-green-700 dark:border-green-500/40 dark:text-green-400",
  UNSUBSCRIBED: "border-black/15 text-zinc-500 dark:border-white/20 dark:text-zinc-500",
};

export function SubscriberStatusBadge({ status }: { status: SubscriberStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
