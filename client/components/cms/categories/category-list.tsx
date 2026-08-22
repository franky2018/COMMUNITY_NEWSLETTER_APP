"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { Category } from "@/types/api";
import {
  Alert,
  Button,
  EmptyState,
  Skeleton,
  Table,
  TableWrap,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  buttonClasses,
} from "@/components/ui";
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
    setFeedback("");
  }, []);

  if (state === "loading") {
    return (
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mt-8">
        <Alert variant="error">
          Unable to load categories. Something went wrong while fetching the list.
        </Alert>
        <Button variant="secondary" className="mt-4" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="mt-8">
        {feedback ? (
          <Alert variant="success" className="mb-4">
            {feedback}
          </Alert>
        ) : null}

        <EmptyState
          title="No categories yet"
          description={
            canManage
              ? "Create your first category to organize newsletters."
              : "Categories will appear here once they’re created."
          }
          action={
            canManage ? (
              <Link href="/cms/categories/new" className={buttonClasses()}>
                New Category
              </Link>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-8">
      {feedback ? (
        <Alert variant="success" className="mb-4">
          {feedback}
        </Alert>
      ) : null}

      {actionError ? (
        <Alert variant="error" className="mb-4">
          {actionError}
        </Alert>
      ) : null}

      <TableWrap>
        <Table>
          <THead>
            <Tr>
              <Th>Name</Th>
              <Th>Slug</Th>
              <Th>Description</Th>
              <Th>Created</Th>
              <Th>Updated</Th>
              <Th align="right">Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {categories.map((category) => (
              <Tr key={category.id}>
                <Td className="font-medium text-heading">
                  {canManage ? (
                    <Link
                      href={`/cms/categories/${category.id}`}
                      className="text-heading transition-colors hover:text-primary hover:underline"
                    >
                      {category.name}
                    </Link>
                  ) : (
                    category.name
                  )}
                </Td>
                <Td className="font-mono text-xs text-muted">{category.slug}</Td>
                <Td>
                  {category.description ? (
                    <div className="line-clamp-2 max-w-sm" title={category.description}>
                      {category.description}
                    </div>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td className="whitespace-nowrap">{formatDate(category.createdAt)}</Td>
                <Td className="whitespace-nowrap">{formatDate(category.updatedAt)}</Td>
                <Td align="right">
                  {role ? (
                    <CategoryActions
                      category={category}
                      role={role}
                      onDeleted={handleDeleted}
                      onError={setActionError}
                    />
                  ) : null}
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </TableWrap>
    </div>
  );
}
