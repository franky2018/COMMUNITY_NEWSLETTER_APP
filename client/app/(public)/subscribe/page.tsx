import type { Metadata } from "next";
import Link from "next/link";

import { SubscribeForm } from "@/components/public/subscribe-form";

export const metadata: Metadata = {
  title: "Subscribe — Community Newsletter",
  description: "Subscribe to receive new community newsletters and updates.",
};

export default function SubscribePage() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Stay up to date</h1>
      <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
        Subscribe to receive new community newsletters and updates.
      </p>

      <SubscribeForm />

      <div className="mt-10">
        <Link
          href="/newsletters"
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-foreground dark:text-zinc-400"
        >
          ← Back to newsletters
        </Link>
      </div>
    </section>
  );
}
