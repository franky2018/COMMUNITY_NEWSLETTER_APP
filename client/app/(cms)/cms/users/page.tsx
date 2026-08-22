"use client";

import { Suspense } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/auth/auth-context";
import { UserList } from "@/components/cms/users/user-list";
import { UserNoAccess } from "@/components/cms/users/user-access";
import { buttonClasses } from "@/components/ui";

export default function UsersPage() {
  const { role } = useAuth();
  const canManage = role === "ADMIN";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-heading">Users</h1>
          <p className="mt-1 text-sm text-muted">
            Manage the team accounts that can sign in to the CMS.
          </p>
        </div>
        {canManage ? (
          <Link href="/cms/users/new" className={buttonClasses()}>
            New User
          </Link>
        ) : null}
      </header>

      {role && !canManage ? (
        <UserNoAccess />
      ) : (
        <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading…</p>}>
          <UserList />
        </Suspense>
      )}
    </div>
  );
}
