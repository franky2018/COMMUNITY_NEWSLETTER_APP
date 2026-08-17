"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { DashboardStats } from "@/components/cms/dashboard/dashboard-stats";
import { RecentNewsletters } from "@/components/cms/dashboard/recent-newsletters";
import { RecentSubscribers } from "@/components/cms/dashboard/recent-subscribers";
import { useDashboardResource } from "@/components/cms/dashboard/use-dashboard-resource";
import type { Category, Newsletter, Subscriber } from "@/types/api";

const ROLE_LABELS = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
} as const;

export default function CmsDashboardPage() {
  const { user, role } = useAuth();
  const canViewSubscribers = role === "ADMIN" || role === "EDITOR";

  const newsletters = useDashboardResource<Newsletter[]>("/newsletters");
  const categories = useDashboardResource<Category[]>("/categories");
  const subscribers = useDashboardResource<Subscriber[]>("/subscribers", canViewSubscribers);

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

      <DashboardStats
        newsletters={newsletters}
        categories={categories}
        subscribers={subscribers}
        canViewSubscribers={canViewSubscribers}
      />

      <RecentNewsletters
        state={newsletters.state}
        newsletters={newsletters.data ?? []}
        onRetry={newsletters.reload}
      />

      {canViewSubscribers ? (
        <RecentSubscribers
          state={subscribers.state}
          subscribers={subscribers.data ?? []}
          onRetry={subscribers.reload}
        />
      ) : null}
    </div>
  );
}
