"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";

export default function CmsLayout({ children }: LayoutProps<"/(cms)">) {
  const router = useRouter();
  const { user, status, logout } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-black/10 px-6 py-3 dark:border-white/15">
        <span className="text-sm font-semibold">Newsletter CMS</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">{user?.name ?? user?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}

