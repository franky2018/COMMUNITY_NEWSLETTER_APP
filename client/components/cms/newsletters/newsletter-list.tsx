"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { Newsletter } from "@/types/api";
import { NewsletterActions } from "./newsletter-actions";
import { NewsletterStatusBadge } from "./newsletter-status-badge";

type LoadState = "loading" | "loaded" | "error";

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const cellClass = "px-3 py-3 align-middle text-sm";
const headerClass = "px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500";

export function NewsletterList() {
  const { role } = useAuth();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setState("loading");

    try {
      const data = await apiClient.get<Newsletter[]>("/newsletters", {
        requiresAuth: true,
        signal,
      });

      if (signal?.aborted) {
        return;
      }

      setNewsletters(data);
      setState("loaded");
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
        return;
      }

      setState("error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);

    return () => controller.abort();
  }, [load]);

  const handleChanged = useCallback((updated: Newsletter) => {
    setActionError("");
    setNewsletters((current) =>
      current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
    );
  }, []);

  if (state === "loading") {
    return <p className="mt-8 text-sm text-zinc-500">Loading newsletters…</p>;
  }

  if (state === "error") {
    return (
      <div className="mt-8 rounded-lg border border-black/10 p-6 text-sm dark:border-white/15">
        <p className="font-medium">Unable to load newsletters.</p>
        <p className="mt-1 text-zinc-500">Something went wrong while fetching the list.</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Try again
        </button>
      </div>
    );
  }

  if (newsletters.length === 0) {
    return (
      <div className="mt-8 rounded-lg border border-dashed border-black/15 p-10 text-center dark:border-white/20">
        <p className="text-sm font-medium">No newsletters yet</p>
        <p className="mt-1 text-sm text-zinc-500">
          Create your first newsletter to get started.
        </p>
        <Link
          href="/cms/newsletters/new"
          className="mt-4 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          New Newsletter
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {actionError ? (
        <div
          role="alert"
          className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {actionError}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/15">
        <table className="w-full border-collapse">
          <thead className="border-b border-black/10 dark:border-white/15">
            <tr>
              <th className={headerClass}>Title</th>
              <th className={headerClass}>Status</th>
              <th className={headerClass}>Category</th>
              <th className={headerClass}>Author</th>
              <th className={headerClass}>Created</th>
              <th className={headerClass}>Published</th>
              <th className={`${headerClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {newsletters.map((newsletter) => (
              <tr
                key={newsletter.id}
                className="border-b border-black/5 last:border-b-0 dark:border-white/10"
              >
                <td className={`${cellClass} font-medium`}>
                  <Link
                    href={`/cms/newsletters/${newsletter.id}`}
                    className="hover:underline"
                  >
                    {newsletter.title}
                  </Link>
                </td>
                <td className={cellClass}>
                  <NewsletterStatusBadge status={newsletter.status} />
                </td>
                <td className={`${cellClass} text-zinc-600 dark:text-zinc-400`}>
                  {newsletter.category?.name ?? "—"}
                </td>
                <td className={`${cellClass} text-zinc-600 dark:text-zinc-400`}>
                  {newsletter.author?.name ?? "—"}
                </td>
                <td className={`${cellClass} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                  {formatDate(newsletter.createdAt)}
                </td>
                <td className={`${cellClass} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                  {formatDate(newsletter.publishedAt)}
                </td>
                <td className={`${cellClass} text-right`}>
                  {role ? (
                    <NewsletterActions
                      newsletter={newsletter}
                      role={role}
                      onChanged={handleChanged}
                      onError={setActionError}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
