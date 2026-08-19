"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import type { Subscriber } from "@/types/api";
import { SubscriberStatusBadge } from "./subscriber-status-badge";

type StatusFilter = "all" | "active" | "unsubscribed";
type LoadState = "loading" | "loaded" | "error";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "unsubscribed", label: "Unsubscribed" },
];

const cellClass = "px-3 py-3 align-middle text-sm";
const headerClass = "px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500";
const tabBase = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
const retryButton =
  "mt-4 rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

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
        <div
          role="status"
          className={
            createResult.positive
              ? "rounded-md border border-green-600/40 bg-green-600/10 px-3 py-2 text-sm text-green-700 dark:border-green-500/40 dark:text-green-400"
              : "rounded-md border border-amber-600/40 bg-amber-600/10 px-3 py-2 text-sm text-amber-700 dark:border-amber-500/40 dark:text-amber-400"
          }
        >
          {createResult.message}
        </div>
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
                  ? `${tabBase} bg-foreground text-background`
                  : `${tabBase} border border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10`
              }
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      {tableState === "loading" ? (
        <p className="text-sm text-zinc-500">Loading subscribers…</p>
      ) : tableState === "error" ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-600 dark:text-red-400">
          <p className="font-medium">Unable to load subscribers.</p>
          <p className="mt-1">Something went wrong while fetching the list.</p>
          <button type="button" onClick={retryTable} className={retryButton}>
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          usingAll={usingAll}
          canManage={canManage}
          activeLabel={activeLabel}
          onShowAll={() => selectFilter("all")}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full border-collapse">
            <thead className="border-b border-black/10 dark:border-white/15">
              <tr>
                <th className={headerClass}>Email</th>
                <th className={headerClass}>Name</th>
                <th className={headerClass}>Status</th>
                <th className={headerClass}>Subscribed</th>
                <th className={headerClass}>Unsubscribed</th>
                <th className={`${headerClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((subscriber) => (
                <tr
                  key={subscriber.id}
                  className="border-b border-black/5 last:border-b-0 dark:border-white/10"
                >
                  <td className={cellClass}>
                    <span className="select-all">{subscriber.email}</span>
                  </td>
                  <td className={cellClass}>{subscriber.name?.trim() ? subscriber.name : "—"}</td>
                  <td className={cellClass}>
                    <SubscriberStatusBadge status={subscriber.status} />
                  </td>
                  <td className={cellClass}>{formatDate(subscriber.subscribedAt)}</td>
                  <td className={cellClass}>{formatDate(subscriber.unsubscribedAt)}</td>
                  <td className={`${cellClass} text-right`}>
                    <Link
                      href={`/cms/subscribers/${subscriber.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-xl border border-black/10 bg-black/[.02] p-4 dark:border-white/15 dark:bg-white/[.03]">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">{value === null ? "—" : value}</dd>
    </div>
  );
}

function EmptyState({
  usingAll,
  canManage,
  activeLabel,
  onShowAll,
}: {
  usingAll: boolean;
  canManage: boolean;
  activeLabel: string;
  onShowAll: () => void;
}) {
  return (
    <div className="rounded-lg border border-black/10 p-8 text-center dark:border-white/15">
      {usingAll ? (
        <>
          <p className="text-sm text-zinc-500">No subscribers yet.</p>
          {canManage ? (
            <Link
              href="/cms/subscribers/new"
              className="mt-4 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Add Subscriber
            </Link>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-500">No {activeLabel} subscribers.</p>
          <button type="button" onClick={onShowAll} className={`${retryButton} inline-block`}>
            Show all
          </button>
        </>
      )}
    </div>
  );
}
