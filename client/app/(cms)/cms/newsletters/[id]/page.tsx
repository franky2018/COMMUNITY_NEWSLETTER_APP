"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  NewsletterForm,
  type NewsletterCategoryOption,
  type NewsletterFormValues,
} from "@/components/cms/newsletters/newsletter-form";
import { NewsletterActions } from "@/components/cms/newsletters/newsletter-actions";
import { NewsletterStatusBadge } from "@/components/cms/newsletters/newsletter-status-badge";
import { AccessDenied } from "@/components/cms/access-denied";
import { Alert } from "@/components/ui";
import type { Category, Newsletter } from "@/types/api";

type LoadState = "loading" | "loaded" | "not-found" | "forbidden" | "error";

function formatDate(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function EditNewsletterView() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { role } = useAuth();

  const id = params.id;

  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesFailed, setCategoriesFailed] = useState(false);
  const [state, setState] = useState<LoadState>("loading");
  const [actionError, setActionError] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(
    searchParams.get("created") === "1" ? "Newsletter created." : null,
  );

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();

    async function load() {
      setState("loading");

      try {
        const data = await apiClient.get<Newsletter>(`/newsletters/${id}`, {
          requiresAuth: true,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setNewsletter(data);
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

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const data = await apiClient.get<Category[]>("/categories", {
          requiresAuth: true,
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setCategories(data);
        }
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }

        setCategoriesFailed(true);
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, []);

  const handleSave = useCallback(
    async (values: NewsletterFormValues) => {
      const updated = await apiClient.patch<Newsletter>(
        `/newsletters/${id}`,
        {
          title: values.title,
          content: values.content,
          excerpt: values.excerpt,
          featuredImageUrl: values.featuredImageUrl,
          categoryId: values.categoryId,
        },
        { requiresAuth: true },
      );

      setNewsletter(updated);
      setActionError("");
      setSaveMessage("Changes saved.");
    },
    [id],
  );

  const handleActionChanged = useCallback((updated: Newsletter) => {
    setNewsletter(updated);
    setActionError("");
    setSaveMessage(null);
  }, []);

  if (state === "loading") {
    return <p className="mt-8 text-sm text-muted">Loading newsletter…</p>;
  }

  if (state === "not-found") {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm shadow-sm">
        <p className="font-serif text-base font-semibold text-heading">Newsletter not found</p>
        <p className="mt-1 text-muted">It may have been removed or the link is incorrect.</p>
        <Link
          href="/cms/newsletters"
          className="mt-4 inline-block text-sm text-primary transition-colors hover:underline"
        >
          ← Back to newsletters
        </Link>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <AccessDenied
        title="You don’t have access to this newsletter."
        description="You can only manage newsletters you’re permitted to edit."
        backHref="/cms/newsletters"
        backLabel="Back to newsletters"
      />
    );
  }

  if (state === "error" || !newsletter) {
    return (
      <div className="mt-8 rounded-xl border border-border bg-card p-6 text-sm shadow-sm">
        <p className="font-serif text-base font-semibold text-heading">Unable to load this newsletter.</p>
        <p className="mt-1 text-muted">Something went wrong. Please try again.</p>
        <Link
          href="/cms/newsletters"
          className="mt-4 inline-block text-sm text-primary transition-colors hover:underline"
        >
          ← Back to newsletters
        </Link>
      </div>
    );
  }

  const currentCategory = newsletter.category;
  const categoryOptions: NewsletterCategoryOption[] =
    currentCategory && !categories.some((category) => category.id === currentCategory.id)
      ? [...categories, { id: currentCategory.id, name: currentCategory.name }]
      : categories;

  return (
    <>
      <div className="text-sm text-muted">
        <Link href="/cms/newsletters" className="transition-colors hover:text-primary hover:underline">
          Newsletters
        </Link>
        <span className="px-1">/</span>
        <span className="text-heading">Edit</span>
      </div>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="truncate font-serif text-2xl font-semibold text-heading">{newsletter.title}</h1>
            <NewsletterStatusBadge status={newsletter.status} />
          </div>
          <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
            <div>
              <dt className="inline">Author: </dt>
              <dd className="inline">{newsletter.author?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="inline">Slug: </dt>
              <dd className="inline font-mono">{newsletter.slug}</dd>
            </div>
            <div>
              <dt className="inline">Published: </dt>
              <dd className="inline">{formatDate(newsletter.publishedAt)}</dd>
            </div>
          </dl>
        </div>

        {role ? (
          <NewsletterActions
            newsletter={newsletter}
            role={role}
            onChanged={handleActionChanged}
            onError={setActionError}
          />
        ) : null}
      </div>

      {actionError ? (
        <Alert variant="error" className="mt-4">
          {actionError}
        </Alert>
      ) : null}

      <NewsletterForm
        categories={categoryOptions}
        categoriesUnavailable={categoriesFailed}
        initialValues={{
          title: newsletter.title,
          excerpt: newsletter.excerpt ?? "",
          content: newsletter.content,
          featuredImageUrl: newsletter.featuredImageUrl ?? null,
          categoryId: newsletter.categoryId ?? "",
        }}
        submitLabel="Save Changes"
        submittingLabel="Saving…"
        successMessage={saveMessage ?? undefined}
        onDirty={() => setSaveMessage(null)}
        onSave={handleSave}
      />
    </>
  );
}

export default function EditNewsletterPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <EditNewsletterView />
      </Suspense>
    </div>
  );
}
