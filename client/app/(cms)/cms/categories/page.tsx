"use client";

import { Suspense } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/auth/auth-context";
import { CategoryList } from "@/components/cms/categories/category-list";
import { buttonClasses } from "@/components/ui";

export default function CategoriesPage() {
  const { role } = useAuth();
  const canManage = role === "ADMIN" || role === "EDITOR";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-heading">Categories</h1>
          <p className="mt-1 text-sm text-muted">
            Organize newsletters into categories. Slugs are generated automatically.
          </p>
        </div>
        {canManage ? (
          <Link href="/cms/categories/new" className={buttonClasses()}>
            New Category
          </Link>
        ) : null}
      </header>

      <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading…</p>}>
        <CategoryList />
      </Suspense>
    </div>
  );
}
