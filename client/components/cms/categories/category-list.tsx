"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { Category } from "@/types/api";
import { CategoryActions } from "./category-actions";

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

export function CategoryList() {
  const { role } = useAuth();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [actionError, setActionError] = useState("");
  const [feedback, setFeedback] = useState(
    searchParams.get("created") === "1" ? "Category created." : "",
  );

  const canManage = role === "ADMIN" || role === "EDITOR";

  const load = useCallback(async (signal?: AbortSignal) => {
    setState("loading");

    try {
      const data = await apiClient.get<Category[]>("/categories", {
        requiresAuth: true,
        signal,
      });

      if (signal?.aborted) {
        return;
      }

      setCategories(data);
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

  const handleDeleted = useCallback((id: string) => {
    setActionError("");
    setCategories((current) => current.filter((item) => item.id !== id));
    setFeedback("Category deleted.");
  }, []);

  if (state === "loading") {
    return <p className="mt-8 text-sm text-zinc-500">Loading categories…</p>;
  }

  if (state === "error") {
    return (
      <div className="mt-8 rounded-lg border border-black/10 p-6 text-sm dark:border-white/15">
        <p className="font-medium">Unable to load categories.</p>
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

  if (categories.length === 0) {
    return (
      <div className="mt-8">
        {feedback ? (
          <div
            role="status"
            className="mb-4 rounded-md border border-green-600/40 bg-green-600/10 px-3 py-2 text-sm text-green-700 dark:border-green-500/40 dark:text-green-400"
          >
            {feedback}
          </div>
        ) : null}

        <div className="rounded-lg border border-dashed border-black/15 p-10 text-center dark:border-white/20">
          <p className="text-sm font-medium">No categories yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            {canManage
              ? "Create your first category to organize newsletters."
              : "Categories will appear here once they’re created."}
          </p>
          {canManage ? (
            <Link
              href="/cms/categories/new"
              className="mt-4 inline-block rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              New Category
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {feedback ? (
        <div
          role="status"
          className="mb-4 rounded-md border border-green-600/40 bg-green-600/10 px-3 py-2 text-sm text-green-700 dark:border-green-500/40 dark:text-green-400"
        >
          {feedback}
        </div>
      ) : null}

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
              <th className={headerClass}>Name</th>
              <th className={headerClass}>Slug</th>
              <th className={headerClass}>Description</th>
              <th className={headerClass}>Created</th>
              <th className={headerClass}>Updated</th>
              <th className={`${headerClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr
                key={category.id}
                className="border-b border-black/5 last:border-b-0 dark:border-white/10"
              >
                <td className={`${cellClass} font-medium`}>
                  {canManage ? (
                    <Link href={`/cms/categories/${category.id}`} className="hover:underline">
                      {category.name}
                    </Link>
                  ) : (
                    category.name
                  )}
                </td>
                <td className={`${cellClass} font-mono text-xs text-zinc-600 dark:text-zinc-400`}>
                  {category.slug}
                </td>
                <td className={`${cellClass} text-zinc-600 dark:text-zinc-400`}>
                  {category.description ? (
                    <div className="line-clamp-2 max-w-sm" title={category.description}>
                      {category.description}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`${cellClass} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                  {formatDate(category.createdAt)}
                </td>
                <td className={`${cellClass} whitespace-nowrap text-zinc-600 dark:text-zinc-400`}>
                  {formatDate(category.updatedAt)}
                </td>
                <td className={`${cellClass} text-right`}>
                  {role ? (
                    <CategoryActions
                      category={category}
                      role={role}
                      onDeleted={handleDeleted}
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
