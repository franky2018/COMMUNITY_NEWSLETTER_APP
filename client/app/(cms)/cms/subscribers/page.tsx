"use client";

import { Suspense } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/auth/auth-context";
import { SubscriberList } from "@/components/cms/subscribers/subscriber-list";
import { SubscriberNoAccess } from "@/components/cms/subscribers/subscriber-access";
import { buttonClasses } from "@/components/ui";

export default function SubscribersPage() {
  const { role } = useAuth();
  const canManage = role === "ADMIN" || role === "EDITOR";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-heading">Subscribers</h1>
          <p className="mt-1 text-sm text-muted">
            View who has subscribed to the community newsletter and manage their status.
          </p>
        </div>
        {canManage ? (
          <Link href="/cms/subscribers/new" className={buttonClasses()}>
            Add Subscriber
          </Link>
        ) : null}
      </header>

      {role && !canManage ? (
        <SubscriberNoAccess />
      ) : (
        <Suspense fallback={<p className="mt-8 text-sm text-muted">Loading…</p>}>
          <SubscriberList canManage={canManage} />
        </Suspense>
      )}
    </div>
  );
}
