"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button, buttonClasses } from "@/components/ui";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="text-sm font-medium text-muted">500</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm text-body">
        An unexpected error occurred. You can try again, or head back to the home page.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className={buttonClasses({ variant: "secondary" })}>
          Back to home
        </Link>
      </div>
    </section>
  );
}
