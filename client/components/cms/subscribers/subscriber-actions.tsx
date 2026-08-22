"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { Subscriber, UserRole } from "@/types/api";
import { Button, ConfirmDialog, useToast } from "@/components/ui";
import { getSubscriberErrorMessage } from "./subscriber-errors";

type SubscriberActionsProps = {
  subscriber: Subscriber;
  role: UserRole;
  onChanged: (updated: Subscriber) => void;
  onError?: (message: string) => void;
};

export function SubscriberActions({ subscriber, role, onChanged, onError }: SubscriberActionsProps) {
  const { toast } = useToast();
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
      toast({ title: "Subscriber unsubscribed.", description: subscriber.email, variant: "success" });
      setConfirming(false);
    } catch (error) {
      onError?.(getSubscriberErrorMessage(error, "Unable to unsubscribe this subscriber."));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button type="button" variant="danger" size="sm" onClick={() => setConfirming(true)}>
        Unsubscribe
      </Button>
      <ConfirmDialog
        open={confirming}
        title="Unsubscribe this subscriber?"
        description={`${subscriber.email} will be marked as unsubscribed and will stop receiving newsletters.`}
        confirmLabel="Unsubscribe"
        loadingLabel="Unsubscribing…"
        confirmVariant="danger"
        loading={pending}
        onConfirm={unsubscribe}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
