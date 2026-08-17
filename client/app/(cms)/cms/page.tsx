"use client";

import { SummaryCard } from "@/components/cms/summary-card";
import { useAuth } from "@/lib/auth/auth-context";

const ROLE_LABELS = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
} as const;

export default function CmsDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <h1 className="text-2xl font-semibold">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {user ? `Signed in as ${ROLE_LABELS[user.role]}.` : "Loading your account…"}
        </p>
      </header>

      <section aria-label="Overview" className="mt-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard title="Newsletters" href="/cms/newsletters" />
          <SummaryCard title="Categories" href="/cms/categories" />
          <SummaryCard title="Subscribers" href="/cms/subscribers" />
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Summary figures are placeholders and will be connected to live data later.
        </p>
      </section>
    </div>
  );
}
