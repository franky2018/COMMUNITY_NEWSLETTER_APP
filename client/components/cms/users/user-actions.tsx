"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api/client";
import type { User } from "@/types/api";
import { getUserErrorMessage } from "./user-errors";
import type { AssignableRole } from "./user-form";

type UserActionsProps = {
  user: User;
  currentUserId: string | null;
  onChanged: (updated: User, message: string) => void;
  onError: (message: string) => void;
};

type Pending = "none" | "role" | "status";

const ROLE_LABELS: Record<User["role"], string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
};

const buttonBase =
  "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const neutralButton = `${buttonBase} border-black/15 hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10`;
const dangerButton = `${buttonBase} border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400`;
const primaryButton = `${buttonBase} border-transparent bg-foreground text-background hover:opacity-90`;

const rowLabel = "text-xs font-medium uppercase tracking-wide text-zinc-500";

export function UserActions({ user, currentUserId, onChanged, onError }: UserActionsProps) {
  const [confirming, setConfirming] = useState<Pending>("none");
  const [pending, setPending] = useState<Pending>("none");

  const isSelf = currentUserId !== null && currentUserId === user.id;
  const isAdminTarget = user.role === "ADMIN";
  const busy = pending !== "none";

  // Mirrors the backend: admins can't be edited here and you can't modify yourself.
  if (isAdminTarget || isSelf) {
    return (
      <div className="mt-8 rounded-lg border border-black/10 p-5 text-sm dark:border-white/15">
        <h2 className="text-sm font-semibold">Manage user</h2>
        <p className="mt-2 text-zinc-500">
          {isSelf
            ? "You can't change your own role or status."
            : "Admin accounts can't be modified here."}
        </p>
      </div>
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
      onChanged(updated, `Role changed to ${ROLE_LABELS[updated.role]}.`);
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
      onChanged(updated, nextActive ? "User activated." : "User deactivated.");
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
    <div className="mt-8 rounded-lg border border-black/10 p-5 dark:border-white/15">
      <h2 className="text-sm font-semibold">Manage user</h2>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={rowLabel}>Role</p>
          <p className="mt-1 text-sm">Currently {ROLE_LABELS[user.role]}</p>
        </div>

        {confirming === "role" ? (
          <span className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs text-zinc-500">
              Change this user&rsquo;s role from {ROLE_LABELS[user.role]} to{" "}
              {ROLE_LABELS[otherRole]}?
            </span>
            <button type="button" className={primaryButton} disabled={busy} onClick={changeRole}>
              {pending === "role" ? "Saving…" : "Confirm"}
            </button>
            <button
              type="button"
              className={neutralButton}
              disabled={busy}
              onClick={() => setConfirming("none")}
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={neutralButton}
            disabled={busy}
            onClick={() => setConfirming("role")}
          >
            Change to {ROLE_LABELS[otherRole]}
          </button>
        )}
      </div>

      <div className="my-4 border-t border-black/10 dark:border-white/10" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={rowLabel}>Status</p>
          <p className="mt-1 text-sm">{user.isActive ? "Active" : "Inactive"}</p>
        </div>

        {confirming === "status" ? (
          <span className="flex flex-wrap items-center justify-end gap-2">
            <span className="text-xs text-zinc-500">
              {user.isActive
                ? "Deactivate this user? They'll no longer be able to sign in."
                : "Activate this user?"}
            </span>
            <button
              type="button"
              className={user.isActive ? dangerButton : primaryButton}
              disabled={busy}
              onClick={() => setActive(!user.isActive)}
            >
              {pending === "status"
                ? user.isActive
                  ? "Deactivating…"
                  : "Activating…"
                : "Confirm"}
            </button>
            <button
              type="button"
              className={neutralButton}
              disabled={busy}
              onClick={() => setConfirming("none")}
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={user.isActive ? dangerButton : primaryButton}
            disabled={busy}
            onClick={() => setConfirming("status")}
          >
            {user.isActive ? "Deactivate" : "Activate"}
          </button>
        )}
      </div>
    </div>
  );
}
