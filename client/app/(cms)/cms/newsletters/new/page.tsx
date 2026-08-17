"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import {
  NewsletterForm,
  type NewsletterFormValues,
} from "@/components/cms/newsletters/newsletter-form";
import type { Category, Newsletter } from "@/types/api";

export default function NewNewsletterPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesState, setCategoriesState] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const data = await apiClient.get<Category[]>("/categories", {
          requiresAuth: true,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setCategories(data);
        setCategoriesState("loaded");
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }

        setCategoriesState("error");
      }
    }

    void loadCategories();

    return () => controller.abort();
  }, []);

  async function handleSave(values: NewsletterFormValues) {
    const created = await apiClient.post<Newsletter>(
      "/newsletters",
      {
        title: values.title,
        content: values.content,
        excerpt: values.excerpt,
        categoryId: values.categoryId,
      },
      { requiresAuth: true },
    );

    router.replace(`/cms/newsletters/${created.id}?created=1`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="text-sm text-zinc-500">
        <Link href="/cms/newsletters" className="hover:underline">
          Newsletters
        </Link>
        <span className="px-1">/</span>
        <span>New</span>
      </div>

      <h1 className="mt-2 text-2xl font-semibold">New Newsletter</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Create a draft. It stays a draft until an editor or admin publishes it.
      </p>

      {categoriesState === "loading" ? (
        <p className="mt-8 text-sm text-zinc-500">Loading…</p>
      ) : (
        <NewsletterForm
          categories={categories}
          categoriesUnavailable={categoriesState === "error"}
          submitLabel="Create Newsletter"
          submittingLabel="Creating…"
          onSave={handleSave}
        />
      )}
    </div>
  );
}
