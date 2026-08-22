"use client";

import { useState } from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import type { Category, UserRole } from "@/types/api";
import { Button, ConfirmDialog, buttonClasses, useToast } from "@/components/ui";
import { getCategoryErrorMessage } from "./category-errors";

type CategoryActionsProps = {
  category: Category;
  role: UserRole;
  onDeleted: (id: string) => void;
  onError?: (message: string) => void;
};

export function CategoryActions({ category, role, onDeleted, onError }: CategoryActionsProps) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const canManage = role === "ADMIN" || role === "EDITOR";

  if (!canManage) {
    return <span className="text-xs text-muted">—</span>;
  }

  async function handleDelete() {
    setDeleting(true);
    onError?.("");

    try {
      await apiClient.delete(`/categories/${category.id}`, { requiresAuth: true });
      onDeleted(category.id);
      toast({ title: "Category deleted", description: category.name, variant: "success" });
    } catch (error) {
      onError?.(getCategoryErrorMessage(error, "Unable to delete this category."));
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={`/cms/categories/${category.id}`}
          className={buttonClasses({ variant: "secondary", size: "sm" })}
        >
          Edit
        </Link>
        <Button
          variant="danger"
          size="sm"
          disabled={deleting}
          onClick={() => setConfirming(true)}
        >
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Delete this category?"
        description={`“${category.name}” will be removed. Newsletters in it are kept.`}
        confirmLabel="Delete"
        loadingLabel="Deleting…"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
