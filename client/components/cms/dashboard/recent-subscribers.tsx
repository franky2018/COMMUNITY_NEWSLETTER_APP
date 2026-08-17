"use client";

import Link from "next/link";

import { SubscriberStatusBadge } from "@/components/cms/subscribers/subscriber-status-badge";
import type { Subscriber } from "@/types/api";

import type { ResourceState } from "./use-dashboard-resource";

const RECENT_LIMIT = 5;

const headerClass = "px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500";
const cellClass = "px-3 py-3 align-middle text-sm";
const retryButtonClass =
  "mt-4 rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function sortRecent(subscribers: Subscriber[]): Subscriber[] {
  return [...subscribers]
    .sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime())
    .slice(0, RECENT_LIMIT);
}

type RecentSubscribersProps = {
  state: ResourceState;
  subscribers: Subscriber[];
  onRetry: () => void;
};

export function RecentSubscribers({ state, subscribers, onRetry }: RecentSubscribersProps) {
  const recent = sortRecent(subscribers);

  return (
    <section aria-label="Recent subscribers" className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Recent Subscribers</h2>
        <Link href="/cms/subscribers" className="text-sm font-medium hover:underline">
          View all subscribers →
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
        {state === "loading" ? (
          <div className="divide-y divide-black/5 dark:divide-white/10">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 px-3 py-3.5">
                <div className="h-4 w-52 animate-pulse rounded bg-black/10 dark:bg-white/10" />
                <div className="h-4 w-16 animate-pulse rounded bg-black/10 dark:bg-white/10" />
                <div className="ml-auto h-4 w-20 animate-pulse rounded bg-black/10 dark:bg-white/10" />
              </div>
            ))}
          </div>
        ) : state === "error" ? (
          <div className="p-6 text-sm">
            <p className="font-medium">Unable to load recent subscribers.</p>
            <p className="mt-1 text-zinc-500">Something went wrong while fetching the list.</p>
            <button type="button" onClick={onRetry} className={retryButtonClass}>
              Try again
            </button>
          </div>
        ) : recent.length === 0 ? (
          <p className="p-6 text-sm text-zinc-500">No subscribers yet.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="border-b border-black/10 dark:border-white/15">
              <tr>
                <th className={headerClass}>Email</th>
                <th className={headerClass}>Name</th>
                <th className={headerClass}>Status</th>
                <th className={headerClass}>Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((subscriber) => (
                <tr
                  key={subscriber.id}
                  className="border-b border-black/5 last:border-b-0 dark:border-white/10"
                >
                  <td className={cellClass}>
                    <span className="select-all">{subscriber.email}</span>
                  </td>
                  <td className={`${cellClass} text-zinc-600 dark:text-zinc-400`}>
                    {subscriber.name?.trim() ? subscriber.name : "—"}
                  </td>
                  <td className={cellClass}>
                    <SubscriberStatusBadge status={subscriber.status} />
                  </td>
                  <td className={`${cellClass} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                    {formatDate(subscriber.subscribedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
