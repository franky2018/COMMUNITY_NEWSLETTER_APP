"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import {
  SubscriberForm,
  type SubscriberFormValues,
} from "@/components/cms/subscribers/subscriber-form";
import { SubscriberNoAccess } from "@/components/cms/subscribers/subscriber-access";
import type { ManagedSubscriberResult } from "@/types/api";

export default function NewSubscriberPage() {
  const router = useRouter();
  const { role } = useAuth();

  const canManage = role === "ADMIN" || role === "EDITOR";

  async function handleSave(values: SubscriberFormValues) {
    const { result } = await apiClient.post<ManagedSubscriberResult>(
      "/subscribers/manage",
      {
        email: values.email,
        name: values.name,
      },
      { requiresAuth: true },
    );

    router.replace(`/cms/subscribers?result=${result}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="text-sm text-muted">
        <Link href="/cms/subscribers" className="transition-colors hover:text-primary">
          Subscribers
        </Link>
        <span className="px-1">/</span>
        <span className="text-heading">New</span>
      </div>

      <h1 className="mt-2 font-serif text-2xl font-semibold text-heading">Add Subscriber</h1>
      <p className="mt-1 text-sm text-muted">
        Add someone to the newsletter manually. New addresses are added as active.
      </p>

      {role && !canManage ? (
        <SubscriberNoAccess
          title="You don’t have permission to add subscribers."
          description="Ask an editor or admin to add a subscriber."
        />
      ) : (
        <SubscriberForm
          submitLabel="Add Subscriber"
          submittingLabel="Adding…"
          onSave={handleSave}
        />
      )}
    </div>
  );
}
