"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { Alert, Button, buttonClasses } from "@/components/ui";
import { resendVerification, verifyEmail, type VerifyEmailState } from "@/lib/api/stubs";

type Status = "verifying" | VerifyEmailState;

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<Status>("verifying");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    let active = true;
    setStatus("verifying");

    verifyEmail(token).then((result) => {
      if (active) {
        setStatus(result);
      }
    });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleResend() {
    setResendState("sending");
    await resendVerification();
    setResendState("sent");
  }

  if (status === "verifying") {
    return (
      <AuthCard title="Verifying your email" subtitle="Hold on while we confirm your link.">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
            aria-hidden="true"
          />
          Verifying…
        </div>
      </AuthCard>
    );
  }

  if (status === "success") {
    return (
      <AuthCard title="Email verified" subtitle="Your email address has been confirmed.">
        <Alert variant="success">You&rsquo;re all set. You can now sign in to your account.</Alert>
        <Link href="/auth/login" className={buttonClasses({ className: "mt-4 w-full" })}>
          Sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verification failed"
      subtitle="This verification link is invalid or has expired."
      footer={
        <Link
          href="/auth/login"
          className="font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Back to sign in
        </Link>
      }
    >
      {resendState === "sent" ? (
        <Alert variant="success">A new verification email has been sent.</Alert>
      ) : (
        <>
          <Alert variant="error">Request a new verification link to continue.</Alert>
          <Button
            type="button"
            className="mt-4 w-full"
            onClick={handleResend}
            disabled={resendState === "sending"}
          >
            {resendState === "sending" ? "Sending…" : "Resend verification email"}
          </Button>
        </>
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
      <VerifyEmailInner />
    </Suspense>
  );
}
