"use client";

import Link from "next/link";

import { NewsletterStatusBadge } from "@/components/cms/newsletters/newsletter-status-badge";
import { Alert, Button, Skeleton, Table, TableWrap, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { Newsletter } from "@/types/api";

import type { ResourceState } from "./use-dashboard-resource";

const RECENT_LIMIT = 5;

function sortRecent(newsletters: Newsletter[]): Newsletter[] {
  return [...newsletters]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_LIMIT);
}

type RecentNewslettersProps = {
  state: ResourceState;
  newsletters: Newsletter[];
  onRetry: () => void;
};

export function RecentNewsletters({ state, newsletters, onRetry }: RecentNewslettersProps) {
  const recent = sortRecent(newsletters);

  return (
    <section aria-label="Recent newsletters" className="mt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-lg font-semibold text-heading">Recent Newsletters</h2>
        <Link
          href="/cms/newsletters"
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
              Unable to load recent newsletters. Something went wrong while fetching the list.
            </Alert>
            <Button variant="secondary" className="mt-3" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : recent.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted">
            No newsletters yet.
          </div>
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Status</Th>
                  <Th>Category</Th>
                  <Th>Created</Th>
                </Tr>
              </THead>
              <TBody>
                {recent.map((newsletter) => (
                  <Tr key={newsletter.id}>
                    <Td>
                      <Link
                        href={`/cms/newsletters/${newsletter.id}`}
                        className="font-medium text-primary transition-colors hover:underline"
                      >
                        {newsletter.title}
                      </Link>
                    </Td>
                    <Td>
                      <NewsletterStatusBadge status={newsletter.status} />
                    </Td>
                    <Td>{newsletter.category?.name ?? "—"}</Td>
                    <Td>
                      <span className="whitespace-nowrap">{formatDate(newsletter.createdAt)}</span>
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
