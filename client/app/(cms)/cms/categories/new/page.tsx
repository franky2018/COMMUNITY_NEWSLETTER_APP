"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  CategoryForm,
  type CategoryFormValues,
} from "@/components/cms/categories/category-form";
import { AccessDenied } from "@/components/cms/access-denied";
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
      <div className="text-sm text-muted">
        <Link href="/cms/categories" className="transition-colors hover:text-primary">
          Categories
        </Link>
        <span className="px-1">/</span>
        <span className="text-heading">New</span>
      </div>

      <h1 className="mt-2 font-serif text-2xl font-semibold text-heading">New Category</h1>
      <p className="mt-1 text-sm text-muted">
        Add a category to group related newsletters. The slug is generated automatically.
      </p>

      {role && !canManage ? (
        <AccessDenied
          title="You don’t have permission to create categories."
          description="Ask an editor or admin if you need a new category."
          backHref="/cms/categories"
          backLabel="Back to categories"
        />
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
