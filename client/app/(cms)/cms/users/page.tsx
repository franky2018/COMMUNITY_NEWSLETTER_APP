"use client";

import { Suspense } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/auth/auth-context";
import { UserList } from "@/components/cms/users/user-list";
import { UserNoAccess } from "@/components/cms/users/user-access";

export default function UsersPage() {
  const { role } = useAuth();
  const canManage = role === "ADMIN";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the team accounts that can sign in to the CMS.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/cms/users/new"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            New User
          </Link>
        ) : null}
      </header>

      {role && !canManage ? (
        <UserNoAccess />
      ) : (
        <Suspense fallback={<p className="mt-8 text-sm text-zinc-500">Loading…</p>}>
          <UserList />
        </Suspense>
      )}
    </div>
  );
}
