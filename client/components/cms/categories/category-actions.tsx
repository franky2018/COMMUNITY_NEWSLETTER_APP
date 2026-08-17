"use client";

import { useState } from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import type { Category, UserRole } from "@/types/api";
import { getCategoryErrorMessage } from "./category-errors";

type CategoryActionsProps = {
  category: Category;
  role: UserRole;
  onDeleted: (id: string) => void;
  onError?: (message: string) => void;
};

const buttonBase =
  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const neutralButton = `${buttonBase} border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10`;
const dangerButton = `${buttonBase} border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400`;

export function CategoryActions({ category, role, onDeleted, onError }: CategoryActionsProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const canManage = role === "ADMIN" || role === "EDITOR";

  if (!canManage) {
    return <span className="text-xs text-zinc-400">—</span>;
  }

  async function handleDelete() {
    setDeleting(true);
    onError?.("");

    try {
      await apiClient.delete(`/categories/${category.id}`, { requiresAuth: true });
      onDeleted(category.id);
    } catch (error) {
      onError?.(getCategoryErrorMessage(error, "Unable to delete this category."));
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {confirming ? (
        <span className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs text-zinc-500">Delete this category? Newsletters are kept.</span>
          <button type="button" className={dangerButton} disabled={deleting} onClick={handleDelete}>
            {deleting ? "Deleting…" : "Confirm"}
          </button>
          <button
            type="button"
            className={neutralButton}
            disabled={deleting}
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </span>
      ) : (
        <>
          <Link href={`/cms/categories/${category.id}`} className={`${neutralButton} inline-block`}>
            Edit
          </Link>
          <button type="button" className={dangerButton} onClick={() => setConfirming(true)}>
            Delete
          </button>
        </>
      )}
    </div>
  );
}
