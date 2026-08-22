"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import type { ReactNode } from "react";

import type { UserRole } from "@/types/api";

type NavGroup = "main" | "admin";

type NavItem = {
  label: string;
  href: Route;
  roles: readonly UserRole[];
  group: NavGroup;
  icon: ReactNode;
};

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const DashboardIcon = (
  <svg {...iconProps}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const NewslettersIcon = (
  <svg {...iconProps}>
    <path d="M4 4h13a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V4Z" />
    <path d="M8 8h7M8 12h7M8 16h4" />
  </svg>
);

const CategoriesIcon = (
  <svg {...iconProps}>
    <path d="M20.6 13.4 12 4.8V4H4v8h.8l8.6 8.6a2 2 0 0 0 2.8 0l4.4-4.4a2 2 0 0 0 0-2.8Z" />
    <circle cx="7.5" cy="7.5" r="1" />
  </svg>
);

const MediaIcon = (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="m21 16-5-5L5 20" />
  </svg>
);

const SubscribersIcon = (
  <svg {...iconProps}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UsersIcon = (
  <svg {...iconProps}>
    <path d="M20 21a8 8 0 0 0-16 0" />
    <circle cx="12" cy="8" r="5" />
  </svg>
);

// Role visibility here is presentational only. Hiding a link does not authorize
// anything — the NestJS backend remains the final authority for every request.
const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/cms", roles: ["ADMIN", "EDITOR", "AUTHOR"], group: "main", icon: DashboardIcon },
  { label: "Newsletters", href: "/cms/newsletters", roles: ["ADMIN", "EDITOR", "AUTHOR"], group: "main", icon: NewslettersIcon },
  { label: "Categories", href: "/cms/categories", roles: ["ADMIN", "EDITOR", "AUTHOR"], group: "main", icon: CategoriesIcon },
  { label: "Media", href: "/cms/media", roles: ["ADMIN", "EDITOR", "AUTHOR"], group: "main", icon: MediaIcon },
  { label: "Subscribers", href: "/cms/subscribers", roles: ["ADMIN", "EDITOR"], group: "admin", icon: SubscribersIcon },
  { label: "Users", href: "/cms/users", roles: ["ADMIN"], group: "admin", icon: UsersIcon },
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

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={[
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-active text-on-sidebar"
          : "text-sidebar-muted hover:bg-sidebar-active/60 hover:text-on-sidebar",
      ].join(" ")}
    >
      <span className="shrink-0">{item.icon}</span>
      {item.label}
    </Link>
  );
}

export function CmsNavigation({ role, onNavigate }: CmsNavigationProps) {
  const pathname = usePathname();
  const items = navItemsForRole(role);
  const mainItems = items.filter((item) => item.group === "main");
  const adminItems = items.filter((item) => item.group === "admin");

  return (
    <nav aria-label="CMS sections" className="flex flex-col gap-1">
      {mainItems.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} onNavigate={onNavigate} />
      ))}

      {adminItems.length > 0 ? (
        <>
          <p className="px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
            Administration
          </p>
          {adminItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} onNavigate={onNavigate} />
          ))}
        </>
      ) : null}
    </nav>
  );
}
