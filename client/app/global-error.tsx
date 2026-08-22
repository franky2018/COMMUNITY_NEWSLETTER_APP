"use client";

import { useEffect } from "react";

import "./globals.css";
import { buttonClasses } from "@/components/ui";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <section className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
          <p className="text-sm font-medium text-muted">500</p>
          <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm text-body">
            A critical error occurred while loading the application. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className={buttonClasses({ variant: "primary", className: "mt-6" })}
          >
            Try again
          </button>
        </section>
      </body>
    </html>
  );
}
