"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  CategoryForm,
  type CategoryFormValues,
} from "@/components/cms/categories/category-form";
import { AccessDenied } from "@/components/cms/access-denied";
import type { Category } from "@/types/api";

type LoadState = "loading" | "loaded" | "not-found" | "forbidden" | "error";

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  const { role } = useAuth();

  const id = params.id;

  const [category, setCategory] = useState<Category | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const canManage = role === "ADMIN" || role === "EDITOR";

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();

    async function load() {
      setState("loading");

      try {
        const data = await apiClient.get<Category>(`/categories/${id}`, {
          requiresAuth: true,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setCategory(data);
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
  }, [id]);

  const handleSave = useCallback(
    async (values: CategoryFormValues) => {
      const updated = await apiClient.patch<Category>(
        `/categories/${id}`,
        {
          name: values.name,
          description: values.description,
        },
        { requiresAuth: true },
      );

      setCategory(updated);
      setSaveMessage("Changes saved.");
    },
    [id],
  );

  const breadcrumb = (
    <div className="text-sm text-muted">
      <Link href="/cms/categories" className="transition-colors hover:text-primary">
        Categories
      </Link>
      <span className="px-1">/</span>
      <span className="text-heading">Edit</span>
    </div>
  );

  if (role && !canManage) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        {breadcrumb}
        <AccessDenied
          title="You don’t have permission to edit categories."
          description="Categories are managed by editors and admins."
          backHref="/cms/categories"
          backLabel="Back to categories"
        />
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        {breadcrumb}
        <p className="mt-8 text-sm text-muted">Loading category…</p>
      </div>
    );
  }

  if (state === "not-found") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        {breadcrumb}
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="font-serif text-lg font-semibold text-heading">Category not found</p>
          <p className="mt-1 text-sm text-muted">It may have been removed or the link is incorrect.</p>
          <Link
            href="/cms/categories"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Back to categories
          </Link>
        </div>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="mx-auto w-full max-w-5xl">
        {breadcrumb}
        <AccessDenied
          title="You don’t have access to this category."
          description="You may not have permission to manage it."
          backHref="/cms/categories"
          backLabel="Back to categories"
        />
      </div>
    );
  }

  if (state === "error" || !category) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        {breadcrumb}
        <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="font-serif text-lg font-semibold text-heading">Unable to load this category.</p>
          <p className="mt-1 text-sm text-muted">Something went wrong. Please try again.</p>
          <Link
            href="/cms/categories"
            className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
          >
            ← Back to categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      {breadcrumb}

      <div className="mt-2 min-w-0">
        <h1 className="truncate font-serif text-2xl font-semibold text-heading">{category.name}</h1>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          <div>
            <dt className="inline">Slug: </dt>
            <dd className="inline font-mono">{category.slug}</dd>
          </div>
          <div>
            <dt className="inline">Created: </dt>
            <dd className="inline">{formatDate(category.createdAt)}</dd>
          </div>
          <div>
            <dt className="inline">Updated: </dt>
            <dd className="inline">{formatDate(category.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      <CategoryForm
        initialValues={{
          name: category.name,
          description: category.description ?? "",
        }}
        submitLabel="Save Changes"
        submittingLabel="Saving…"
        successMessage={saveMessage ?? undefined}
        onDirty={() => setSaveMessage(null)}
        onSave={handleSave}
      />
    </div>
  );
}
