"use client";

import type { ReactNode } from "react";

import { SummaryCard } from "@/components/cms/summary-card";
import type { Category, Newsletter, Subscriber } from "@/types/api";

import type { DashboardResource } from "./use-dashboard-resource";

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const NewslettersIcon: ReactNode = (
  <svg {...iconProps}>
    <path d="M4 4h13a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V4Z" />
    <path d="M8 8h7M8 12h7M8 16h4" />
  </svg>
);

const PublishedIcon: ReactNode = (
  <svg {...iconProps}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <path d="m9 11 3 3L22 4" />
  </svg>
);

const DraftIcon: ReactNode = (
  <svg {...iconProps}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const SubscribersIcon: ReactNode = (
  <svg {...iconProps}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CategoriesIcon: ReactNode = (
  <svg {...iconProps}>
    <path d="M20.6 13.4 12 4.8V4H4v8h.8l8.6 8.6a2 2 0 0 0 2.8 0l4.4-4.4a2 2 0 0 0 0-2.8Z" />
    <circle cx="7.5" cy="7.5" r="1" />
  </svg>
);

function isThisMonth(value?: string | null): boolean {
  if (!value) {
    return false;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function newsletterStats(data: Newsletter[]) {
  let published = 0;
  let draft = 0;
  let createdThisMonth = 0;
  let publishedThisMonth = 0;

  for (const newsletter of data) {
    if (newsletter.status === "PUBLISHED") {
      published += 1;
      if (isThisMonth(newsletter.publishedAt)) {
        publishedThisMonth += 1;
      }
    } else if (newsletter.status === "DRAFT") {
      draft += 1;
    }
    if (isThisMonth(newsletter.createdAt)) {
      createdThisMonth += 1;
    }
  }

  return { total: data.length, published, draft, createdThisMonth, publishedThisMonth };
}

function subscriberStats(data: Subscriber[]) {
  let active = 0;
  let joinedThisMonth = 0;

  for (const subscriber of data) {
    if (subscriber.status === "ACTIVE") {
      active += 1;
    }
    if (isThisMonth(subscriber.subscribedAt)) {
      joinedThisMonth += 1;
    }
  }

  return { active, joinedThisMonth };
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

  return (
    <section aria-label="Overview" className="mt-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Total Newsletters"
          href="/cms/newsletters"
          state={newsletters.state}
          value={nStats?.total ?? null}
          delta={nStats?.createdThisMonth ?? null}
          icon={NewslettersIcon}
          onRetry={newsletters.reload}
        />

        <SummaryCard
          label="Published"
          href="/cms/newsletters"
          state={newsletters.state}
          value={nStats?.published ?? null}
          delta={nStats?.publishedThisMonth ?? null}
          icon={PublishedIcon}
          onRetry={newsletters.reload}
        />

        <SummaryCard
          label="Drafts"
          href="/cms/newsletters"
          state={newsletters.state}
          value={nStats?.draft ?? null}
          caption="Awaiting review"
          icon={DraftIcon}
          onRetry={newsletters.reload}
        />

        {canViewSubscribers ? (
          <SummaryCard
            label="Subscribers"
            href="/cms/subscribers"
            state={subscribers.state}
            value={sStats?.active ?? null}
            delta={sStats?.joinedThisMonth ?? null}
            icon={SubscribersIcon}
            onRetry={subscribers.reload}
          />
        ) : (
          <SummaryCard
            label="Categories"
            href="/cms/categories"
            state={categories.state}
            value={categories.data?.length ?? null}
            caption="Total categories"
            icon={CategoriesIcon}
            onRetry={categories.reload}
          />
        )}
      </div>
    </section>
  );
}
