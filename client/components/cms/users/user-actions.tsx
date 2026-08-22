"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { User } from "@/types/api";
import { Button, Card, CardBody, CardHeader, CardTitle, ConfirmDialog, useToast } from "@/components/ui";
import { getUserErrorMessage } from "./user-errors";
import type { AssignableRole } from "./user-form";

type UserActionsProps = {
  user: User;
  currentUserId: string | null;
  onChanged: (updated: User) => void;
  onError: (message: string) => void;
};

type Pending = "none" | "role" | "status";

const rowLabel = "text-xs font-medium uppercase tracking-wide text-muted";

export function UserActions({ user, currentUserId, onChanged, onError }: UserActionsProps) {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState<Pending>("none");
  const [pending, setPending] = useState<Pending>("none");

  const isSelf = currentUserId !== null && currentUserId === user.id;
  const isAdminTarget = user.role === "ADMIN";
  const busy = pending !== "none";

  // Mirrors the backend: admins can't be edited here and you can't modify yourself.
  if (isAdminTarget || isSelf) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Manage user</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-muted">
            {isSelf
              ? "You can't change your own role or status."
              : "Admin accounts can't be modified here."}
          </p>
        </CardBody>
      </Card>
    );
  }

  const otherRole: AssignableRole = user.role === "EDITOR" ? "AUTHOR" : "EDITOR";

  async function changeRole() {
    setPending("role");
    onError("");

    try {
      const updated = await apiClient.patch<User>(
        `/users/${user.id}/role`,
        { role: otherRole },
        { requiresAuth: true },
      );
      onChanged(updated);
      toast({ title: `Role changed to ${updated.role}.`, variant: "success" });
    } catch (error) {
      onError(getUserErrorMessage(error, "Unable to change this user's role."));
    } finally {
      setPending("none");
      setConfirming("none");
    }
  }

  async function setActive(nextActive: boolean) {
    setPending("status");
    onError("");

    try {
      const updated = await apiClient.patch<User>(
        `/users/${user.id}/status`,
        { isActive: nextActive },
        { requiresAuth: true },
      );
      onChanged(updated);
      toast({ title: nextActive ? "User activated." : "User deactivated.", variant: "success" });
    } catch (error) {
      onError(
        getUserErrorMessage(
          error,
          nextActive ? "Unable to activate this user." : "Unable to deactivate this user.",
        ),
      );
    } finally {
      setPending("none");
      setConfirming("none");
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Manage user</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={rowLabel}>Role</p>
            <p className="mt-1 text-sm text-body">Currently {user.role}</p>
          </div>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => setConfirming("role")}>
            Change to {otherRole}
          </Button>
        </div>

        <div className="my-4 border-t border-border" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={rowLabel}>Status</p>
            <p className="mt-1 text-sm text-body">{user.isActive ? "Active" : "Inactive"}</p>
          </div>
          <Button
            variant={user.isActive ? "danger" : "primary"}
            size="sm"
            disabled={busy}
            onClick={() => setConfirming("status")}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </CardBody>

      <ConfirmDialog
        open={confirming === "role"}
        title="Change this user’s role?"
        description={`This user’s role will change from ${user.role} to ${otherRole}.`}
        confirmLabel="Change role"
        loadingLabel="Saving…"
        loading={pending === "role"}
        onConfirm={changeRole}
        onCancel={() => setConfirming("none")}
      />

      <ConfirmDialog
        open={confirming === "status"}
        title={user.isActive ? "Deactivate this user?" : "Activate this user?"}
        description={
          user.isActive
            ? "They’ll no longer be able to sign in."
            : "They’ll be able to sign in again."
        }
        confirmLabel={user.isActive ? "Deactivate" : "Activate"}
        loadingLabel={user.isActive ? "Deactivating…" : "Activating…"}
        confirmVariant={user.isActive ? "danger" : "primary"}
        loading={pending === "status"}
        onConfirm={() => setActive(!user.isActive)}
        onCancel={() => setConfirming("none")}
      />
    </Card>
  );
}
