"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import type { User, UserRole } from "@/types/api";
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

const tabBase = "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";

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

  const usingAll = filter === "all";
  const activeLabel = FILTERS.find((entry) => entry.value === filter)?.label.toLowerCase() ?? "";

  return (
    <div className="mt-8 space-y-6">
      {justCreated ? <Alert variant="success">User created.</Alert> : null}

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
                  ? `${tabBase} bg-primary text-on-primary`
                  : `${tabBase} border border-border text-body hover:bg-black/4 dark:hover:bg-white/10`
              }
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      {state === "loading" ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : state === "error" ? (
        <div>
          <Alert variant="error">
            Unable to load users. Something went wrong while fetching the list.
          </Alert>
          <Button variant="secondary" className="mt-3" onClick={() => load()}>
            Try again
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title={usingAll ? "No users yet." : `No ${activeLabel} found.`}
          action={
            usingAll ? (
              <Link href="/cms/users/new" className={buttonClasses()}>
                New User
              </Link>
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
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th align="right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {rows.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <span className="font-medium text-heading">{user.name}</span>
                  </Td>
                  <Td>
                    <span className="select-all">{user.email}</span>
                  </Td>
                  <Td>
                    <UserRoleBadge role={user.role} />
                  </Td>
                  <Td>
                    <UserStatusBadge isActive={user.isActive} />
                  </Td>
                  <Td>{formatDate(user.createdAt)}</Td>
                  <Td align="right">
                    <Link
                      href={`/cms/users/${user.id}`}
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
