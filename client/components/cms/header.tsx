"use client";

import type { User, UserRole } from "@/types/api";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
};

type CmsHeaderProps = {
  user: User;
  onOpenNav: () => void;
  onLogout: () => void;
};

export function CmsHeader({ user, onOpenNav, onLogout }: CmsHeaderProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-black/10 px-4 dark:border-white/15 md:px-8">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="rounded-md p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="ml-auto flex items-center gap-3">
        <div className="min-w-0 text-right">
          <div className="max-w-[45vw] truncate text-sm font-medium leading-tight sm:max-w-none">
            {user.name}
          </div>
          <div className="text-xs text-zinc-500">{ROLE_LABELS[user.role]}</div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
