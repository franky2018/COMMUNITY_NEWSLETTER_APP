"use client";

import { useEffect } from "react";

import type { UserRole } from "@/types/api";
import { CmsNavigation } from "@/components/cms/navigation";

function SidebarBrand() {
  return (
    <div className="flex h-14 items-center px-5 text-sm font-semibold">
      Newsletter CMS
    </div>
  );
}

type CmsSidebarProps = {
  role: UserRole;
  mobileOpen: boolean;
  onClose: () => void;
};

export function CmsSidebar({ role, mobileOpen, onClose }: CmsSidebarProps) {
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
      {/* Desktop: persistent rail beside the content */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-black/10 dark:border-white/15 md:flex">
        <SidebarBrand />
        <div className="px-3 py-2">
          <CmsNavigation role={role} />
        </div>
      </aside>

      {/* Mobile: overlay drawer toggled from the header */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-black/40"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="CMS navigation"
            className="absolute inset-y-0 left-0 flex w-64 max-w-[80%] flex-col border-r border-black/10 bg-background shadow-xl dark:border-white/15"
          >
            <div className="flex h-14 items-center justify-between pl-5 pr-3">
              <span className="text-sm font-semibold">Newsletter CMS</span>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={onClose}
                className="rounded-md p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="px-3 py-2">
              <CmsNavigation role={role} onNavigate={onClose} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
