"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { buttonClasses } from "@/components/ui";

type NavLink = {
  label: string;
  href: Route;
};

const NAV_LINKS: readonly NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Newsletters", href: "/newsletters" },
];

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-body transition-colors hover:bg-black/[.04] hover:text-heading dark:hover:bg-white/10";

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          onClick={close}
          className="flex items-center"
          aria-label="Community Newsletter home"
        >
          <Image
            src="/logo.png"
            alt="Community Newsletter"
            width={519}
            height={141}
            priority
            className="h-8 w-auto"
          />
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
          <Link href="/subscribe" className={buttonClasses({ className: "ml-2" })}>
            Subscribe
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          className="ml-auto rounded-md p-2 text-body transition-colors hover:bg-black/[.04] dark:hover:bg-white/10 sm:hidden"
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
          className="border-t border-border px-4 py-3 sm:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={close} className={navLinkClass}>
                {link.label}
              </Link>
            ))}
            <Link href="/subscribe" onClick={close} className={buttonClasses({ className: "mt-2 w-full" })}>
              Subscribe
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
