"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CmsHeader } from "@/components/cms/header";
import { CmsSidebar } from "@/components/cms/sidebar";
import { useAuth } from "@/lib/auth/auth-context";

export default function CmsLayout({ children }: LayoutProps<"/(cms)">) {
  const router = useRouter();
  const { user, status, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [status, router]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <CmsSidebar
        role={user.role}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <CmsHeader
          user={user}
          onOpenNav={() => setMobileNavOpen(true)}
          onLogout={logout}
        />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
