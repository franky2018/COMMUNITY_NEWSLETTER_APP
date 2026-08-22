"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { SubscriberActions } from "@/components/cms/subscribers/subscriber-actions";
import { SubscriberStatusBadge } from "@/components/cms/subscribers/subscriber-status-badge";
import { SubscriberNoAccess } from "@/components/cms/subscribers/subscriber-access";
import { AccessDenied } from "@/components/cms/access-denied";
import { Alert } from "@/components/ui";
import type { Subscriber } from "@/types/api";

type LoadState = "loading" | "loaded" | "not-found" | "forbidden" | "error";

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function SubscriberDetailPage() {
  const params = useParams<{ id: string }>();
  const { role } = useAuth();

  const id = params.id;
  const canManage = role === "ADMIN" || role === "EDITOR";

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
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
        const data = await apiClient.get<Subscriber>(`/subscribers/${id}`, {
          requiresAuth: true,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setSubscriber(data);
        setState("loaded");
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
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

  function handleUnsubscribed(updated: Subscriber) {
    setSubscriber(updated);
    setActionError("");
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="text-sm text-muted">
        <Link href="/cms/subscribers" className="transition-colors hover:text-primary">
          Subscribers
        </Link>
        <span className="px-1">/</span>
        <span className="text-heading">Details</span>
      </div>

      {role && !canManage ? (
        <SubscriberNoAccess />
      ) : state === "loading" ? (
        <p className="mt-8 text-sm text-muted">Loading subscriber…</p>
      ) : state === "not-found" ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="font-serif text-lg font-semibold text-heading">Subscriber not found</p>
          <p className="mt-1 text-sm text-muted">It may have been removed or the link is incorrect.</p>
          <Link
            href="/cms/subscribers"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Back to subscribers
          </Link>
        </div>
      ) : state === "forbidden" ? (
        <AccessDenied
          title="You don’t have access to this subscriber."
          description="You may not have permission to view this record."
          backHref="/cms/subscribers"
          backLabel="Back to subscribers"
        />
      ) : state === "error" || !subscriber ? (
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="font-serif text-lg font-semibold text-heading">Unable to load this subscriber.</p>
          <p className="mt-1 text-sm text-muted">Something went wrong. Please try again.</p>
          <Link
            href="/cms/subscribers"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Back to subscribers
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate font-serif text-2xl font-semibold text-heading">
                  <span className="select-all">{subscriber.email}</span>
                </h1>
                <SubscriberStatusBadge status={subscriber.status} />
              </div>
              {subscriber.name?.trim() ? (
                <p className="mt-1 text-sm text-muted">{subscriber.name}</p>
              ) : null}
            </div>

            {role ? (
              <SubscriberActions
                subscriber={subscriber}
                role={role}
                onChanged={handleUnsubscribed}
                onError={setActionError}
              />
            ) : null}
          </div>

          {actionError ? (
            <Alert variant="error" className="mt-4">
              {actionError}
            </Alert>
          ) : null}

          <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <Field label="Email">
              <span className="select-all">{subscriber.email}</span>
            </Field>
            <Field label="Name">{subscriber.name?.trim() ? subscriber.name : "—"}</Field>
            <Field label="Status">
              <SubscriberStatusBadge status={subscriber.status} />
            </Field>
            <Field label="Subscribed at">{formatDate(subscriber.subscribedAt)}</Field>
            <Field label="Unsubscribed at">{formatDate(subscriber.unsubscribedAt)}</Field>
            <Field label="Created at">{formatDate(subscriber.createdAt)}</Field>
            <Field label="Updated at">{formatDate(subscriber.updatedAt)}</Field>
          </dl>
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
