"use client";

import { useMemo } from "react";

import { Card, CardBody, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import type { Subscriber } from "@/types/api";

import type { ResourceState } from "./use-dashboard-resource";

const MONTHS = 6;

type Bucket = { label: string; count: number };

function buildBuckets(subscribers: Subscriber[]): Bucket[] {
  const now = new Date();
  const buckets = Array.from({ length: MONTHS }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - offset), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString(undefined, { month: "short" }),
      count: 0,
    };
  });

  const index = new Map(buckets.map((bucket, position) => [bucket.key, position]));

  for (const subscriber of subscribers) {
    const when = new Date(subscriber.subscribedAt);
    if (Number.isNaN(when.getTime())) {
      continue;
    }
    const position = index.get(`${when.getFullYear()}-${when.getMonth()}`);
    if (position !== undefined) {
      buckets[position].count += 1;
    }
  }

  return buckets.map(({ label, count }) => ({ label, count }));
}

type GrowthChartProps = {
  subscribers: Subscriber[];
  state: ResourceState;
};

export function GrowthChart({ subscribers, state }: GrowthChartProps) {
  const buckets = useMemo(() => buildBuckets(subscribers), [subscribers]);
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriber growth</CardTitle>
        <span className="text-xs text-muted">Last {MONTHS} months</span>
      </CardHeader>
      <CardBody>
        {state === "loading" ? (
          <Skeleton className="h-40 w-full" />
        ) : state === "error" ? (
          <p className="text-sm text-muted">Unable to load subscriber growth.</p>
        ) : total === 0 ? (
          <p className="text-sm text-muted">No subscriber activity in this period.</p>
        ) : (
          <div
            className="flex h-40 gap-2"
            role="img"
            aria-label={`New subscribers over the last ${MONTHS} months: ${buckets
              .map((bucket) => `${bucket.label} ${bucket.count}`)
              .join(", ")}`}
          >
            {buckets.map((bucket) => (
              <div key={bucket.label} className="flex h-full flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-primary/80"
                    style={{ height: `${Math.max(4, (bucket.count / max) * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-heading">{bucket.count}</span>
                <span className="text-[11px] text-muted">{bucket.label}</span>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
