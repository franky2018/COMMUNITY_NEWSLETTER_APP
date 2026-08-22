"use client";

import { DashboardStats } from "@/components/cms/dashboard/dashboard-stats";
import { GrowthChart } from "@/components/cms/dashboard/growth-chart";
import { RecentNewsletters } from "@/components/cms/dashboard/recent-newsletters";
import { RecentSubscribers } from "@/components/cms/dashboard/recent-subscribers";
import { useDashboardResource } from "@/components/cms/dashboard/use-dashboard-resource";
import { useAuth } from "@/lib/auth/auth-context";
import type { Category, Newsletter, Subscriber } from "@/types/api";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

export default function CmsDashboardPage() {
  const { user, role } = useAuth();
  const canViewSubscribers = role === "ADMIN" || role === "EDITOR";

  const newsletters = useDashboardResource<Newsletter[]>("/newsletters");
  const categories = useDashboardResource<Category[]>("/categories");
  const subscribers = useDashboardResource<Subscriber[]>("/subscribers", canViewSubscribers);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <h1 className="font-serif text-3xl font-semibold text-heading">
          {user ? `${greeting()}, ${user.name}` : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {user
            ? "Here's what's happening across the community today."
            : "Loading your account…"}
        </p>
      </header>

      <DashboardStats
        newsletters={newsletters}
        categories={categories}
        subscribers={subscribers}
        canViewSubscribers={canViewSubscribers}
      />

      {canViewSubscribers ? (
        <div className="mt-10">
          <GrowthChart subscribers={subscribers.data ?? []} state={subscribers.state} />
        </div>
      ) : null}

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
