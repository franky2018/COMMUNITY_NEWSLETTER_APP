"use client";

import { Suspense } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/auth/auth-context";
import { SubscriberList } from "@/components/cms/subscribers/subscriber-list";
import { SubscriberNoAccess } from "@/components/cms/subscribers/subscriber-access";

export default function SubscribersPage() {
  const { role } = useAuth();
  const canManage = role === "ADMIN" || role === "EDITOR";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Subscribers</h1>
          <p className="mt-1 text-sm text-zinc-500">
            View who has subscribed to the community newsletter and manage their status.
          </p>
        </div>
        {canManage ? (
          <Link
            href="/cms/subscribers/new"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Add Subscriber
          </Link>
        ) : null}
      </header>

      {role && !canManage ? (
        <SubscriberNoAccess />
      ) : (
        <Suspense fallback={<p className="mt-8 text-sm text-zinc-500">Loading…</p>}>
          <SubscriberList canManage={canManage} />
        </Suspense>
      )}
    </div>
  );
}
