"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { Newsletter, UserRole } from "@/types/api";
import { getApiErrorMessage } from "./newsletter-errors";

type NewsletterActionsProps = {
  newsletter: Newsletter;
  role: UserRole;
  onChanged: (updated: Newsletter) => void;
  onError?: (message: string) => void;
};

const buttonBase =
  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const neutralButton = `${buttonBase} border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10`;
const dangerButton = `${buttonBase} border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400`;

export function NewsletterActions({ newsletter, role, onChanged, onError }: NewsletterActionsProps) {
  const [pending, setPending] = useState<"publish" | "archive" | null>(null);
  const [confirmingArchive, setConfirmingArchive] = useState(false);

  const canManageState = role === "ADMIN" || role === "EDITOR";
  const canPublish = canManageState && newsletter.status === "DRAFT";
  const canArchive = canManageState && newsletter.status !== "ARCHIVED";

  if (!canPublish && !canArchive) {
    return <span className="text-xs text-zinc-400">—</span>;
  }

  async function runAction(action: "publish" | "archive") {
    setPending(action);
    onError?.("");

    try {
      const updated = await apiClient.post<Newsletter>(
        `/newsletters/${newsletter.id}/${action}`,
        undefined,
        { requiresAuth: true },
      );
      onChanged(updated);
    } catch (error) {
      onError?.(getApiErrorMessage(error, `Unable to ${action} this newsletter.`));
    } finally {
      setPending(null);
      setConfirmingArchive(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {canPublish ? (
        <button
          type="button"
          className={neutralButton}
          disabled={pending !== null}
          onClick={() => runAction("publish")}
        >
          {pending === "publish" ? "Publishing…" : "Publish"}
        </button>
      ) : null}

      {canArchive ? (
        confirmingArchive ? (
          <span className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Archive?</span>
            <button
              type="button"
              className={dangerButton}
              disabled={pending !== null}
              onClick={() => runAction("archive")}
            >
              {pending === "archive" ? "Archiving…" : "Confirm"}
            </button>
            <button
              type="button"
              className={neutralButton}
              disabled={pending !== null}
              onClick={() => setConfirmingArchive(false)}
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={neutralButton}
            disabled={pending !== null}
            onClick={() => setConfirmingArchive(true)}
          >
            Archive
          </button>
        )
      ) : null}
    </div>
  );
}
