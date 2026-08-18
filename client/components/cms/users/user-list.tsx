"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import type { User, UserRole } from "@/types/api";
import { UserRoleBadge } from "./user-role-badge";
import { UserStatusBadge } from "./user-status-badge";

type RoleFilter = "all" | UserRole;
type LoadState = "loading" | "loaded" | "error";

const FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ADMIN", label: "Admins" },
  { value: "EDITOR", label: "Editors" },
  { value: "AUTHOR", label: "Authors" },
];

const cellClass = "px-3 py-3 align-middle text-sm";
const headerClass = "px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500";
const tabBase = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
const retryButton =
  "mt-4 rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

function parseFilter(value: string | null): RoleFilter {
  if (value === "ADMIN" || value === "EDITOR" || value === "AUTHOR") {
    return value;
  }
  return "all";
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

export function UserList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = parseFilter(searchParams.get("role"));
  const justCreated = searchParams.get("created") === "1";

  const [users, setUsers] = useState<User[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(async (signal?: AbortSignal) => {
    setState("loading");
    try {
      const data = await apiClient.get<User[]>("/users", { requiresAuth: true, signal });
      setUsers(data);
      setState("loaded");
    } catch (error) {
      if (isAbort(error, signal)) {
        return;
      }
      setState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const stats = useMemo(() => {
    if (state !== "loaded") {
      return null;
    }
    let active = 0;
    for (const user of users) {
      if (user.isActive) {
        active += 1;
      }
    }
    return { total: users.length, active, inactive: users.length - active };
  }, [state, users]);

  const rows = useMemo(
    () => (filter === "all" ? users : users.filter((user) => user.role === filter)),
    [filter, users],
  );

  function selectFilter(next: RoleFilter) {
    if (next === filter) {
      return;
    }
    router.replace(next === "all" ? "/cms/users" : `/cms/users?role=${next}`);
  }

  const activeLabel = FILTERS.find((entry) => entry.value === filter)?.label.toLowerCase() ?? "";

  return (
    <div className="mt-8 space-y-6">
      {justCreated ? (
        <div
          role="status"
          className="rounded-md border border-green-600/40 bg-green-600/10 px-3 py-2 text-sm text-green-700 dark:border-green-500/40 dark:text-green-400"
        >
          User created.
        </div>
      ) : null}

      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={stats ? stats.total : null} />
        <StatCard label="Active" value={stats ? stats.active : null} />
        <StatCard label="Inactive" value={stats ? stats.inactive : null} />
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

      {state === "loading" ? (
        <p className="text-sm text-zinc-500">Loading users…</p>
      ) : state === "error" ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-600 dark:text-red-400">
          <p className="font-medium">Unable to load users.</p>
          <p className="mt-1">Something went wrong while fetching the list.</p>
          <button type="button" onClick={() => load()} className={retryButton}>
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          usingAll={filter === "all"}
          activeLabel={activeLabel}
          onShowAll={() => selectFilter("all")}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
          <table className="w-full border-collapse">
            <thead className="border-b border-black/10 dark:border-white/15">
              <tr>
                <th className={headerClass}>Name</th>
                <th className={headerClass}>Email</th>
                <th className={headerClass}>Role</th>
                <th className={headerClass}>Status</th>
                <th className={headerClass}>Created</th>
                <th className={`${headerClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-black/5 last:border-b-0 dark:border-white/10"
                >
                  <td className={`${cellClass} font-medium`}>{user.name}</td>
                  <td className={cellClass}>
                    <span className="select-all">{user.email}</span>
                  </td>
                  <td className={cellClass}>
                    <UserRoleBadge role={user.role} />
                  </td>
                  <td className={cellClass}>
                    <UserStatusBadge isActive={user.isActive} />
                  </td>
                  <td className={cellClass}>{formatDate(user.createdAt)}</td>
                  <td className={`${cellClass} text-right`}>
                    <Link
                      href={`/cms/users/${user.id}`}
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
  activeLabel,
  onShowAll,
}: {
  usingAll: boolean;
  activeLabel: string;
  onShowAll: () => void;
}) {
  return (
    <div className="rounded-lg border border-black/10 p-8 text-center dark:border-white/15">
      {usingAll ? (
        <>
          <p className="text-sm text-zinc-500">No users yet.</p>
          <Link
            href="/cms/users/new"
            className="mt-4 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            New User
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-500">No {activeLabel} found.</p>
          <button type="button" onClick={onShowAll} className={`${retryButton} inline-block`}>
            Show all
          </button>
        </>
      )}
    </div>
  );
}
