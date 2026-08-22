import Link from "next/link";

import { buttonClasses } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-medium text-muted">404</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-3 text-sm text-body">
        The page you’re looking for doesn’t exist or may have been moved.
      </p>
      <Link href="/" className={buttonClasses({ variant: "secondary", className: "mt-6" })}>
        Back to home
      </Link>
    </section>
  );
}
