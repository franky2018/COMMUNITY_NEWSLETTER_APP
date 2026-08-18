"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";

type NavLink = {
  label: string;
  href: Route;
};

const NAV_LINKS: readonly NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Newsletters", href: "/newsletters" },
];

const primaryCtaClass =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90";

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-black/5 hover:text-foreground dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-foreground";

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="border-b border-black/10 dark:border-white/15">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" onClick={close} className="font-semibold tracking-tight">
          Community Newsletter
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
          <Link href="/subscribe" className={`ml-2 ${primaryCtaClass}`}>
            Subscribe
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          className="ml-auto rounded-md p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10 sm:hidden"
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
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {open ? (
        <nav
          aria-label="Primary mobile"
          className="border-t border-black/10 px-4 py-3 dark:border-white/15 sm:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={close} className={navLinkClass}>
                {link.label}
              </Link>
            ))}
            <Link href="/subscribe" onClick={close} className={`mt-2 text-center ${primaryCtaClass}`}>
              Subscribe
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
