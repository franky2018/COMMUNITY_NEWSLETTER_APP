"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { Subscriber, UserRole } from "@/types/api";
import { getSubscriberErrorMessage } from "./subscriber-errors";

type SubscriberActionsProps = {
  subscriber: Subscriber;
  role: UserRole;
  onChanged: (updated: Subscriber) => void;
  onError?: (message: string) => void;
};

const buttonBase =
  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const neutralButton = `${buttonBase} border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10`;
const dangerButton = `${buttonBase} border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400`;

export function SubscriberActions({ subscriber, role, onChanged, onError }: SubscriberActionsProps) {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const canManage = role === "ADMIN" || role === "EDITOR";

  if (!canManage || subscriber.status !== "ACTIVE") {
    return null;
  }

  async function unsubscribe() {
    setPending(true);
    onError?.("");

    try {
      const updated = await apiClient.post<Subscriber>(
        `/subscribers/${subscriber.id}/unsubscribe`,
        undefined,
        { requiresAuth: true },
      );
      onChanged(updated);
    } catch (error) {
      onError?.(getSubscriberErrorMessage(error, "Unable to unsubscribe this subscriber."));
    } finally {
      setPending(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" className={dangerButton} onClick={() => setConfirming(true)}>
        Unsubscribe
      </button>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-zinc-500">Mark this subscriber as unsubscribed?</span>
      <button type="button" className={dangerButton} disabled={pending} onClick={unsubscribe}>
        {pending ? "Unsubscribing…" : "Confirm"}
      </button>
      <button
        type="button"
        className={neutralButton}
        disabled={pending}
        onClick={() => setConfirming(false)}
      >
        Cancel
      </button>
    </span>
  );
}
