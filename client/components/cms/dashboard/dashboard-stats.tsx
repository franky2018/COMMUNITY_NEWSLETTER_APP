"use client";

import { SummaryCard } from "@/components/cms/summary-card";
import type { Category, Newsletter, Subscriber } from "@/types/api";

import type { DashboardResource } from "./use-dashboard-resource";

function newsletterStats(data: Newsletter[]) {
  let published = 0;
  let draft = 0;
  let archived = 0;

  for (const newsletter of data) {
    if (newsletter.status === "PUBLISHED") {
      published += 1;
    } else if (newsletter.status === "DRAFT") {
      draft += 1;
    } else if (newsletter.status === "ARCHIVED") {
      archived += 1;
    }
  }

  return { total: data.length, published, draft, archived };
}

function subscriberStats(data: Subscriber[]) {
  let active = 0;
  let unsubscribed = 0;

  for (const subscriber of data) {
    if (subscriber.status === "ACTIVE") {
      active += 1;
    } else if (subscriber.status === "UNSUBSCRIBED") {
      unsubscribed += 1;
    }
  }

  return { total: data.length, active, unsubscribed };
}

type DashboardStatsProps = {
  newsletters: DashboardResource<Newsletter[]>;
  categories: DashboardResource<Category[]>;
  subscribers: DashboardResource<Subscriber[]>;
  canViewSubscribers: boolean;
};

export function DashboardStats({
  newsletters,
  categories,
  subscribers,
  canViewSubscribers,
}: DashboardStatsProps) {
  const nStats = newsletters.data ? newsletterStats(newsletters.data) : null;
  const sStats = subscribers.data ? subscriberStats(subscribers.data) : null;

  const gridClass = canViewSubscribers
    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    : "grid grid-cols-1 gap-4 sm:grid-cols-2";

  return (
    <section aria-label="Overview" className="mt-8">
      <div className={gridClass}>
        <SummaryCard
          title="Newsletters"
          href="/cms/newsletters"
          state={newsletters.state}
          value={nStats?.total ?? null}
          items={
            nStats
              ? [
                  { label: "Published", value: nStats.published },
                  { label: "Draft", value: nStats.draft },
                  { label: "Archived", value: nStats.archived },
                ]
              : undefined
          }
          onRetry={newsletters.reload}
        />

        <SummaryCard
          title="Categories"
          href="/cms/categories"
          state={categories.state}
          value={categories.data?.length ?? null}
          caption="Total categories"
          onRetry={categories.reload}
        />

        {canViewSubscribers ? (
          <SummaryCard
            title="Subscribers"
            href="/cms/subscribers"
            state={subscribers.state}
            value={sStats?.total ?? null}
            items={
              sStats
                ? [
                    { label: "Active", value: sStats.active },
                    { label: "Unsubscribed", value: sStats.unsubscribed },
                  ]
                : undefined
            }
            onRetry={subscribers.reload}
          />
        ) : null}
      </div>
    </section>
  );
}
