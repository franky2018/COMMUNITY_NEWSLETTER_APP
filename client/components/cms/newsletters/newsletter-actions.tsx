"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { Newsletter, UserRole } from "@/types/api";
import { Button, ConfirmDialog, useToast } from "@/components/ui";
import { getApiErrorMessage } from "./newsletter-errors";

type NewsletterActionsProps = {
  newsletter: Newsletter;
  role: UserRole;
  onChanged: (updated: Newsletter) => void;
  onError?: (message: string) => void;
};

type ActionKind = "publish" | "archive";

export function NewsletterActions({ newsletter, role, onChanged, onError }: NewsletterActionsProps) {
  const { toast } = useToast();
  const [pending, setPending] = useState<ActionKind | null>(null);
  const [confirming, setConfirming] = useState<ActionKind | null>(null);

  const canManageState = role === "ADMIN" || role === "EDITOR";
  const canPublish = canManageState && newsletter.status === "DRAFT";
  const canArchive = canManageState && newsletter.status !== "ARCHIVED";

  if (!canPublish && !canArchive) {
    return <span className="text-xs text-muted">—</span>;
  }

  async function runAction(action: ActionKind) {
    setPending(action);
    onError?.("");

    try {
      const updated = await apiClient.post<Newsletter>(
        `/newsletters/${newsletter.id}/${action}`,
        undefined,
        { requiresAuth: true },
      );
      onChanged(updated);
      toast({
        title: action === "publish" ? "Newsletter published" : "Newsletter archived",
        description: newsletter.title,
        variant: "success",
      });
    } catch (error) {
      onError?.(getApiErrorMessage(error, `Unable to ${action} this newsletter.`));
    } finally {
      setPending(null);
      setConfirming(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canPublish ? (
          <Button
            variant="publish"
            size="sm"
            disabled={pending !== null}
            onClick={() => setConfirming("publish")}
          >
            Publish
          </Button>
        ) : null}

        {canArchive ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={pending !== null}
            onClick={() => setConfirming("archive")}
          >
            Archive
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirming === "publish"}
        title="Publish this newsletter?"
        description={`“${newsletter.title}” will become visible to the public immediately.`}
        confirmLabel="Publish"
        loadingLabel="Publishing…"
        confirmVariant="publish"
        loading={pending === "publish"}
        onConfirm={() => runAction("publish")}
        onCancel={() => setConfirming(null)}
      />

      <ConfirmDialog
        open={confirming === "archive"}
        title="Archive this newsletter?"
        description={`“${newsletter.title}” will be removed from public listings. You can restore it later.`}
        confirmLabel="Archive"
        loadingLabel="Archiving…"
        confirmVariant="danger"
        loading={pending === "archive"}
        onConfirm={() => runAction("archive")}
        onCancel={() => setConfirming(null)}
      />
    </>
  );
}
