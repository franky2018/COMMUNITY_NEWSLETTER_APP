"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button, buttonClasses } from "@/components/ui";
import { unsubscribeByToken, type UnsubscribeState } from "@/lib/api/stubs";

type PanelState = "confirm" | "working" | UnsubscribeState;

export function UnsubscribePanel() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<PanelState>(() => (token.trim() ? "confirm" : "invalid"));

  async function handleConfirm() {
    setState("working");
    try {
      const result = await unsubscribeByToken(token);
      setState(result);
    } catch {
      setState("invalid");
    }
  }

  if (state === "confirm" || state === "working") {
    const working = state === "working";
    return (
      <>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          Unsubscribe from updates
        </h1>
        <p className="mt-3 text-sm text-body">
          You’re about to stop receiving our newsletter. You can re-subscribe at any time.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button variant="danger" onClick={handleConfirm} disabled={working}>
            {working ? "Unsubscribing…" : "Unsubscribe"}
          </Button>
          <Link href="/" className={buttonClasses({ variant: "secondary" })}>
            Cancel
          </Link>
        </div>
      </>
    );
  }

  if (state === "success") {
    return (
      <>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
          You’ve been unsubscribed
        </h1>
        <p className="mt-3 text-sm text-body">
          You won’t receive any more newsletters from us. We’re sorry to see you go.
        </p>
        <Link
          href="/newsletters"
          className={buttonClasses({ variant: "secondary", className: "mt-6" })}
        >
          Browse newsletters
        </Link>
      </>
    );
  }

  const expired = state === "expired";
  return (
    <>
      <p className="text-sm font-medium text-muted">{expired ? "Link expired" : "Invalid link"}</p>
      <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-heading sm:text-4xl">
        {expired ? "This link has expired" : "This link is invalid"}
      </h1>
      <p className="mt-3 text-sm text-body">
        {expired
          ? "This unsubscribe link has expired. Please use the link from a more recent email."
          : "This unsubscribe link is invalid or has already been used. Please use the link from your most recent email."}
      </p>
      <Link href="/" className={buttonClasses({ variant: "secondary", className: "mt-6" })}>
        Back to home
      </Link>
    </>
  );
}
