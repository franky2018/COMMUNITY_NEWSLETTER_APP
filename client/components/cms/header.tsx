"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { User, UserRole } from "@/types/api";
import { Avatar } from "./avatar";
import { Badge, type BadgeTone, SearchInput } from "@/components/ui";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  AUTHOR: "Author",
};

const ROLE_TONES: Record<UserRole, BadgeTone> = {
  ADMIN: "primary",
  EDITOR: "warning",
  AUTHOR: "neutral",
};

type CmsHeaderProps = {
  user: User;
  onOpenNav: () => void;
  onLogout: () => void;
};

type OpenMenu = "none" | "bell" | "user";

export function CmsHeader({ user, onOpenNav, onLogout }: CmsHeaderProps) {
  const [open, setOpen] = useState<OpenMenu>("none");
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open === "none") {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setOpen("none");
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen("none");
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:px-8">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="rounded-md p-2 text-body transition-colors hover:bg-black/[.04] dark:hover:bg-white/10 md:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="hidden min-w-0 flex-1 md:block">
        <div className="max-w-md">
          <SearchInput placeholder="Search…" aria-label="Search" />
        </div>
      </div>

      <div ref={actionsRef} className="relative ml-auto flex items-center gap-2 md:gap-3">
        <Badge tone={ROLE_TONES[user.role]} className="hidden uppercase sm:inline-flex">
          {ROLE_LABELS[user.role]}
        </Badge>

        <button
          type="button"
          aria-label="Notifications"
          aria-haspopup="true"
          aria-expanded={open === "bell"}
          onClick={() => setOpen((current) => (current === "bell" ? "none" : "bell"))}
          className="relative rounded-md p-2 text-body transition-colors hover:bg-black/[.04] dark:hover:bg-white/10"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-card" />
        </button>

        {open === "bell" ? (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-card p-4 shadow-xl"
          >
            <p className="font-serif text-sm font-semibold text-heading">Notifications</p>
            <p className="mt-2 text-sm text-muted">You&rsquo;re all caught up.</p>
          </div>
        ) : null}

        <button
          type="button"
          aria-haspopup="true"
          aria-expanded={open === "user"}
          onClick={() => setOpen((current) => (current === "user" ? "none" : "user"))}
          className="flex items-center gap-2 rounded-md p-1 pl-2 transition-colors hover:bg-black/[.04] dark:hover:bg-white/10"
        >
          <span className="hidden min-w-0 text-right sm:block">
            <span className="block max-w-[40vw] truncate text-sm font-medium leading-tight text-heading sm:max-w-[12rem]">
              {user.name}
            </span>
            <span className="block text-xs text-muted">{ROLE_LABELS[user.role]}</span>
          </span>
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size={36} />
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="hidden text-muted sm:block"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open === "user" ? (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl"
          >
            <div className="border-b border-border px-4 py-3 sm:hidden">
              <p className="truncate text-sm font-medium text-heading">{user.name}</p>
              <p className="text-xs text-muted">{ROLE_LABELS[user.role]}</p>
            </div>
            <Link
              href="/cms/profile"
              role="menuitem"
              onClick={() => setOpen("none")}
              className="block px-4 py-2 text-sm text-body transition-colors hover:bg-black/[.04] dark:hover:bg-white/10"
            >
              Your profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen("none");
                onLogout();
              }}
              className="block w-full px-4 py-2 text-left text-sm text-danger transition-colors hover:bg-danger-soft"
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
