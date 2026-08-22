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
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-heading">
        Stay up to date
      </h1>
      <p className="mt-3 text-base text-body">
        Subscribe to receive new community newsletters and updates.
      </p>

      <SubscribeForm />

      <div className="mt-10">
        <Link
          href="/newsletters"
          className="text-sm font-medium text-muted transition-colors hover:text-primary"
        >
          ← Back to newsletters
        </Link>
      </div>
    </section>
  );
}
