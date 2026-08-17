"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  CategoryForm,
  type CategoryFormValues,
} from "@/components/cms/categories/category-form";
import type { Category } from "@/types/api";

export default function NewCategoryPage() {
  const router = useRouter();
  const { role } = useAuth();

  const canManage = role === "ADMIN" || role === "EDITOR";

  async function handleSave(values: CategoryFormValues) {
    await apiClient.post<Category>(
      "/categories",
      {
        name: values.name,
        description: values.description,
      },
      { requiresAuth: true },
    );

    router.replace("/cms/categories?created=1");
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="text-sm text-zinc-500">
        <Link href="/cms/categories" className="hover:underline">
          Categories
        </Link>
        <span className="px-1">/</span>
        <span>New</span>
      </div>

      <h1 className="mt-2 text-2xl font-semibold">New Category</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Add a category to group related newsletters. The slug is generated automatically.
      </p>

      {role && !canManage ? (
        <div className="mt-8 rounded-lg border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-600 dark:text-red-400">
          <p className="font-medium">You don’t have permission to create categories.</p>
          <p className="mt-1">Ask an editor or admin if you need a new category.</p>
          <Link href="/cms/categories" className="mt-4 inline-block hover:underline">
            ← Back to categories
          </Link>
        </div>
      ) : (
        <CategoryForm
          submitLabel="Create Category"
          submittingLabel="Creating…"
          onSave={handleSave}
        />
      )}
    </div>
  );
}
