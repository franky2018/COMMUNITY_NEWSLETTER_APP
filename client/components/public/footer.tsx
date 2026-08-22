import Link from "next/link";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {year} Community Newsletter</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-4">
          <Link href="/" className="transition-colors hover:text-heading">
            Home
          </Link>
          <Link href="/newsletters" className="transition-colors hover:text-heading">
            Newsletters
          </Link>
          <Link href="/subscribe" className="transition-colors hover:text-heading">
            Subscribe
          </Link>
        </nav>
      </div>
    </footer>
  );
}
