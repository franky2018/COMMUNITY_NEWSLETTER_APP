"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { UserActions } from "@/components/cms/users/user-actions";
import { UserRoleBadge } from "@/components/cms/users/user-role-badge";
import { UserStatusBadge } from "@/components/cms/users/user-status-badge";
import { UserNoAccess } from "@/components/cms/users/user-access";
import { AccessDenied } from "@/components/cms/access-denied";
import { Alert } from "@/components/ui";
import type { User } from "@/types/api";

type LoadState = "loading" | "loaded" | "not-found" | "forbidden" | "error";

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const { role, user: currentUser } = useAuth();

  const id = params.id;
  const canManage = role === "ADMIN";

  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!id || !canManage) {
      return;
    }

    const controller = new AbortController();

    async function load() {
      setState("loading");

      try {
        const data = await apiClient.get<User>(`/users/${id}`, {
          requiresAuth: true,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setUser(data);
        setState("loaded");
      } catch (error) {
        if (
          controller.signal.aborted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          setState("not-found");
        } else if (error instanceof ApiError && error.status === 403) {
          setState("forbidden");
        } else {
          setState("error");
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [id, canManage]);

  function handleChanged(updated: User) {
    setUser(updated);
    setActionError("");
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="text-sm text-muted">
        <Link href="/cms/users" className="transition-colors hover:text-primary">
          Users
        </Link>
        <span className="px-1">/</span>
        <span className="text-heading">Details</span>
      </div>

      {role && !canManage ? (
        <UserNoAccess />
      ) : state === "loading" ? (
        <p className="mt-8 text-sm text-muted">Loading user…</p>
      ) : state === "not-found" ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="font-serif text-lg font-semibold text-heading">User not found</p>
          <p className="mt-1 text-sm text-muted">It may have been removed or the link is incorrect.</p>
          <Link
            href="/cms/users"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Back to users
          </Link>
        </div>
      ) : state === "forbidden" ? (
        <AccessDenied
          title="You don’t have access to this user."
          description="You may not have permission to view this record."
          backHref="/cms/users"
          backLabel="Back to users"
        />
      ) : state === "error" || !user ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="font-serif text-lg font-semibold text-heading">Unable to load this user.</p>
          <p className="mt-1 text-sm text-muted">Something went wrong. Please try again.</p>
          <Link
            href="/cms/users"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Back to users
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-2 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate font-serif text-2xl font-semibold text-heading">{user.name}</h1>
              <UserRoleBadge role={user.role} />
              <UserStatusBadge isActive={user.isActive} />
            </div>
            <p className="mt-1 text-sm text-muted">
              <span className="select-all">{user.email}</span>
            </p>
          </div>

          {actionError ? (
            <Alert variant="error" className="mt-4">
              {actionError}
            </Alert>
          ) : null}

          <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <Field label="Name">{user.name}</Field>
            <Field label="Email">
              <span className="select-all">{user.email}</span>
            </Field>
            <Field label="Role">
              <UserRoleBadge role={user.role} />
            </Field>
            <Field label="Status">
              <UserStatusBadge isActive={user.isActive} />
            </Field>
            <Field label="Created at">{formatDate(user.createdAt)}</Field>
            <Field label="Updated at">{formatDate(user.updatedAt)}</Field>
          </dl>

          <UserActions
            user={user}
            currentUserId={currentUser?.id ?? null}
            onChanged={handleChanged}
            onError={setActionError}
          />
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-heading">{children}</dd>
    </div>
  );
}
