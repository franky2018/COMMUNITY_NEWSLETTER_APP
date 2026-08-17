"use client";

import { Suspense } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/auth/auth-context";
import { CategoryList } from "@/components/cms/categories/category-list";

export default function CategoriesPage() {
  const { role } = useAuth();
  const canManage = role === "ADMIN" || role === "EDITOR";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Organize newsletters into categories. Slugs are generated automatically.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/cms/categories/new"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            New Category
          </Link>
        ) : null}
      </header>

      <Suspense fallback={<p className="mt-8 text-sm text-zinc-500">Loading…</p>}>
        <CategoryList />
      </Suspense>
    </div>
  );
}
