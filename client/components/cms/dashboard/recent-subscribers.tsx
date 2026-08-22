"use client";

import Link from "next/link";

import { SubscriberStatusBadge } from "@/components/cms/subscribers/subscriber-status-badge";
import { Alert, Button, Skeleton, Table, TableWrap, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { Subscriber } from "@/types/api";

import type { ResourceState } from "./use-dashboard-resource";

const RECENT_LIMIT = 5;

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
        <h2 className="font-serif text-lg font-semibold text-heading">Recent Subscribers</h2>
        <Link
          href="/cms/subscribers"
          className="text-sm font-medium text-primary transition-colors hover:underline"
        >
          View all →
        </Link>
      </div>

      <div className="mt-4">
        {state === "loading" ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : state === "error" ? (
          <div>
            <Alert variant="error">
              Unable to load recent subscribers. Something went wrong while fetching the list.
            </Alert>
            <Button variant="secondary" className="mt-3" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted">
            No subscribers yet.
          </div>
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <Tr>
                  <Th>Email</Th>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Subscribed</Th>
                </Tr>
              </THead>
              <TBody>
                {recent.map((subscriber) => (
                  <Tr key={subscriber.id}>
                    <Td>
                      <span className="select-all font-medium text-heading">{subscriber.email}</span>
                    </Td>
                    <Td>{subscriber.name?.trim() ? subscriber.name : "—"}</Td>
                    <Td>
                      <SubscriberStatusBadge status={subscriber.status} />
                    </Td>
                    <Td>
                      <span className="whitespace-nowrap">{formatDate(subscriber.subscribedAt)}</span>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </div>
    </section>
  );
}
