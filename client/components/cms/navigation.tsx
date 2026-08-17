"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

import type { UserRole } from "@/types/api";

type NavItem = {
  label: string;
  href: Route;
  roles: readonly UserRole[];
};

// Role visibility here is presentational only. Hiding a link does not authorize
// anything — the NestJS backend remains the final authority for every request.
const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/cms", roles: ["ADMIN", "EDITOR", "AUTHOR"] },
  { label: "Newsletters", href: "/cms/newsletters", roles: ["ADMIN", "EDITOR", "AUTHOR"] },
  { label: "Categories", href: "/cms/categories", roles: ["ADMIN", "EDITOR"] },
  { label: "Subscribers", href: "/cms/subscribers", roles: ["ADMIN", "EDITOR"] },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/cms") {
    return pathname === "/cms";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type CmsNavigationProps = {
  role: UserRole;
  onNavigate?: () => void;
};

export function CmsNavigation({ role, onNavigate }: CmsNavigationProps) {
  const pathname = usePathname();
  const items = navItemsForRole(role);

  return (
    <nav aria-label="CMS sections" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={[
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-black/[.06] text-foreground dark:bg-white/10"
                : "text-zinc-600 hover:bg-black/5 hover:text-foreground dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-foreground",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
