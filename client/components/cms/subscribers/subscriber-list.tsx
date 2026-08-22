"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import type { Subscriber } from "@/types/api";
import {
  Alert,
  Button,
  EmptyState,
  Skeleton,
  Table,
  TableWrap,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  buttonClasses,
} from "@/components/ui";
import { SubscriberStatusBadge } from "./subscriber-status-badge";

type StatusFilter = "all" | "active" | "unsubscribed";
type LoadState = "loading" | "loaded" | "error";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "unsubscribed", label: "Unsubscribed" },
];

const tabBase = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";

const SUBSCRIBER_RESULTS: Record<string, { message: string; positive: boolean }> = {
  created: { message: "Subscriber added.", positive: true },
  reactivated: {
    message: "Subscriber reactivated — they had previously unsubscribed.",
    positive: true,
  },
  already_active: {
    message: "This email is already an active subscriber. No changes were made.",
    positive: false,
  },
};

function parseFilter(value: string | null): StatusFilter {
  if (value === "ACTIVE") {
    return "active";
  }
  if (value === "UNSUBSCRIBED") {
    return "unsubscribed";
  }
  return "all";
}

function apiQueryForFilter(filter: StatusFilter): string {
  if (filter === "active") {
    return "?status=ACTIVE";
  }
  if (filter === "unsubscribed") {
    return "?status=UNSUBSCRIBED";
  }
  return "";
}

function isAbort(error: unknown, signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted) || (error instanceof DOMException && error.name === "AbortError");
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function SubscriberList({ canManage }: { canManage: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = parseFilter(searchParams.get("status"));
  const createResult = SUBSCRIBER_RESULTS[searchParams.get("result") ?? ""] ?? null;

  const [allSubscribers, setAllSubscribers] = useState<Subscriber[]>([]);
  const [allState, setAllState] = useState<LoadState>("loading");

  const [filtered, setFiltered] = useState<Subscriber[]>([]);
  const [filteredState, setFilteredState] = useState<LoadState>("loading");

  const loadAll = useCallback(async (signal?: AbortSignal) => {
    setAllState("loading");
    try {
      const data = await apiClient.get<Subscriber[]>("/subscribers", { requiresAuth: true, signal });
      setAllSubscribers(data);
      setAllState("loaded");
    } catch (error) {
      if (isAbort(error, signal)) {
        return;
      }
      setAllState("error");
    }
  }, []);

  const loadFiltered = useCallback(async (activeFilter: StatusFilter, signal?: AbortSignal) => {
    setFilteredState("loading");
    try {
      const data = await apiClient.get<Subscriber[]>(
        `/subscribers${apiQueryForFilter(activeFilter)}`,
        { requiresAuth: true, signal },
      );
      setFiltered(data);
      setFilteredState("loaded");
    } catch (error) {
      if (isAbort(error, signal)) {
        return;
      }
      setFilteredState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadAll(controller.signal);
    return () => controller.abort();
  }, [loadAll]);

  useEffect(() => {
    if (filter === "all") {
      return;
    }
    const controller = new AbortController();
    loadFiltered(filter, controller.signal);
    return () => controller.abort();
  }, [filter, loadFiltered]);

  const stats = useMemo(() => {
    if (allState !== "loaded") {
      return null;
    }
    let active = 0;
    let unsubscribed = 0;
    for (const subscriber of allSubscribers) {
      if (subscriber.status === "ACTIVE") {
        active += 1;
      } else if (subscriber.status === "UNSUBSCRIBED") {
        unsubscribed += 1;
      }
    }
    return { total: allSubscribers.length, active, unsubscribed };
  }, [allState, allSubscribers]);

  function selectFilter(next: StatusFilter) {
    if (next === filter) {
      return;
    }
    router.replace(next === "all" ? "/cms/subscribers" : `/cms/subscribers?status=${next}`);
  }

  const usingAll = filter === "all";
  const tableState = usingAll ? allState : filteredState;
  const rows = usingAll ? allSubscribers : filtered;
  const activeLabel = FILTERS.find((entry) => entry.value === filter)?.label.toLowerCase() ?? "";

  function retryTable() {
    if (usingAll) {
      loadAll();
    } else {
      loadFiltered(filter);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {createResult ? (
        <Alert variant={createResult.positive ? "success" : "warning"}>{createResult.message}</Alert>
      ) : null}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={stats ? stats.total : null} />
        <StatCard label="Active" value={stats ? stats.active : null} />
        <StatCard label="Unsubscribed" value={stats ? stats.unsubscribed : null} />
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((entry) => {
          const selected = entry.value === filter;
          return (
            <button
              key={entry.value}
              type="button"
              onClick={() => selectFilter(entry.value)}
              aria-pressed={selected}
              className={
                selected
                  ? `${tabBase} bg-primary text-on-primary`
                  : `${tabBase} border border-border text-body hover:bg-black/4 dark:hover:bg-white/10`
              }
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      {tableState === "loading" ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : tableState === "error" ? (
        <div>
          <Alert variant="error">
            Unable to load subscribers. Something went wrong while fetching the list.
          </Alert>
          <Button variant="secondary" className="mt-3" onClick={retryTable}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={usingAll ? "No subscribers yet." : `No ${activeLabel} subscribers.`}
          action={
            usingAll ? (
              canManage ? (
                <Link href="/cms/subscribers/new" className={buttonClasses()}>
                  Add Subscriber
                </Link>
              ) : undefined
            ) : (
              <Button variant="secondary" onClick={() => selectFilter("all")}>
                Show all
              </Button>
            )
          }
        />
      ) : (
        <TableWrap>
          <Table>
            <THead>
              <Tr>
                <Th>Email</Th>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Subscribed</Th>
                <Th>Unsubscribed</Th>
                <Th align="right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((subscriber) => (
                <Tr key={subscriber.id}>
                  <Td>
                    <span className="select-all font-medium text-heading">{subscriber.email}</span>
                  </Td>
                  <Td>{subscriber.name?.trim() ? subscriber.name : "—"}</Td>
                  <Td>
                    <SubscriberStatusBadge status={subscriber.status} />
                  </Td>
                  <Td>{formatDate(subscriber.subscribedAt)}</Td>
                  <Td>{formatDate(subscriber.unsubscribedAt)}</Td>
                  <Td align="right">
                    <Link
                      href={`/cms/subscribers/${subscriber.id}`}
                      className="text-sm font-medium text-primary transition-colors hover:underline"
                    >
                      View
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums text-heading">
        {value === null ? "—" : value}
      </dd>
    </div>
  );
}
