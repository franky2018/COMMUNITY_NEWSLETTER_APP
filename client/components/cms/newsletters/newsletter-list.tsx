"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { Newsletter } from "@/types/api";
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
import { NewsletterActions } from "./newsletter-actions";
import { NewsletterStatusBadge } from "./newsletter-status-badge";

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

export function NewsletterList() {
  const { role } = useAuth();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setState("loading");

    try {
      const data = await apiClient.get<Newsletter[]>("/newsletters", {
        requiresAuth: true,
        signal,
      });

      if (signal?.aborted) {
        return;
      }

      setNewsletters(data);
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

  const handleChanged = useCallback((updated: Newsletter) => {
    setActionError("");
    setNewsletters((current) =>
      current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
    );
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
          Unable to load newsletters. Something went wrong while fetching the list.
        </Alert>
        <Button variant="secondary" className="mt-4" onClick={() => void load()}>
          Try again
        </Button>
      </div>
    );
  }

  if (newsletters.length === 0) {
    return (
      <EmptyState
        className="mt-8"
        title="No newsletters yet"
        description="Create your first newsletter to get started."
        action={
          <Link href="/cms/newsletters/new" className={buttonClasses()}>
            New Newsletter
          </Link>
        }
      />
    );
  }

  return (
    <div className="mt-8">
      {actionError ? (
        <Alert variant="error" className="mb-4">
          {actionError}
        </Alert>
      ) : null}

      <TableWrap>
        <Table>
          <THead>
            <Tr>
              <Th>Title</Th>
              <Th>Status</Th>
              <Th>Category</Th>
              <Th>Author</Th>
              <Th>Created</Th>
              <Th>Published</Th>
              <Th align="right">Actions</Th>
            </Tr>
          </THead>
          <TBody>
            {newsletters.map((newsletter) => (
              <Tr key={newsletter.id}>
                <Td className="font-medium text-heading">
                  <div className="flex items-center gap-3">
                    {newsletter.featuredImageUrl ? (
                      <Image
                        src={newsletter.featuredImageUrl}
                        alt=""
                        width={48}
                        height={32}
                        className="h-8 w-12 shrink-0 rounded object-cover"
                      />
                    ) : null}
                    <Link
                      href={`/cms/newsletters/${newsletter.id}`}
                      className="text-heading transition-colors hover:text-primary hover:underline"
                    >
                      {newsletter.title}
                    </Link>
                  </div>
                </Td>
                <Td>
                  <NewsletterStatusBadge status={newsletter.status} />
                </Td>
                <Td>{newsletter.category?.name ?? "—"}</Td>
                <Td>{newsletter.author?.name ?? "—"}</Td>
                <Td className="whitespace-nowrap">{formatDate(newsletter.createdAt)}</Td>
                <Td className="whitespace-nowrap">{formatDate(newsletter.publishedAt)}</Td>
                <Td align="right">
                  {role ? (
                    <NewsletterActions
                      newsletter={newsletter}
                      role={role}
                      onChanged={handleChanged}
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
