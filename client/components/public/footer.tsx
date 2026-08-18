import Link from "next/link";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/10 dark:border-white/15">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {year} Community Newsletter</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-4">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <Link href="/newsletters" className="transition-colors hover:text-foreground">
            Newsletters
          </Link>
          <Link href="/subscribe" className="transition-colors hover:text-foreground">
            Subscribe
          </Link>
        </nav>
      </div>
    </footer>
  );
}
