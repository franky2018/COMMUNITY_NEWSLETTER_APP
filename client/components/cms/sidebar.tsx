"use client";

import { useEffect } from "react";
import Link from "next/link";

import type { User, UserRole } from "@/types/api";
import { CmsNavigation } from "@/components/cms/navigation";
import { Avatar } from "@/components/cms/avatar";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
};

function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      href="/cms"
      onClick={onNavigate}
      className="flex items-center gap-2.5 px-5 py-4"
      aria-label="Community Newsletter dashboard"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 4h13a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V4Z" />
          <path d="M8 8h7M8 12h7M8 16h4" />
        </svg>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-serif text-base font-semibold text-on-sidebar">Community</span>
        <span className="text-[11px] uppercase tracking-wider text-sidebar-muted">Newsletter CMS</span>
      </span>
    </Link>
  );
}

function UserChip({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  return (
    <Link
      href="/cms/profile"
      onClick={onNavigate}
      className="flex items-center gap-3 border-t border-white/10 px-4 py-3 transition-colors hover:bg-sidebar-active"
    >
      <Avatar name={user.name} avatarUrl={user.avatarUrl} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-on-sidebar">{user.name}</span>
        <span className="block text-xs text-sidebar-muted">{ROLE_LABELS[user.role]}</span>
      </span>
    </Link>
  );
}

function SidebarContent({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  return (
    <>
      <SidebarBrand onNavigate={onNavigate} />
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <CmsNavigation role={user.role} onNavigate={onNavigate} />
      </div>
      <UserChip user={user} onNavigate={onNavigate} />
    </>
  );
}

type CmsSidebarProps = {
  user: User;
  mobileOpen: boolean;
  onClose: () => void;
};

export function CmsSidebar({ user, mobileOpen, onClose }: CmsSidebarProps) {
  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onClose]);

  return (
    <>
      {/* Desktop: persistent dark rail beside the content */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-sidebar text-on-sidebar md:flex">
        <SidebarContent user={user} />
      </aside>

      {/* Mobile: overlay drawer toggled from the header */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-black/50"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="CMS navigation"
            className="absolute inset-y-0 left-0 flex w-64 max-w-[80%] flex-col bg-sidebar text-on-sidebar shadow-xl"
          >
            <button
              type="button"
              aria-label="Close navigation"
              onClick={onClose}
              className="absolute right-3 top-4 rounded-md p-2 text-sidebar-muted transition-colors hover:bg-sidebar-active hover:text-on-sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <SidebarContent user={user} onNavigate={onClose} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
