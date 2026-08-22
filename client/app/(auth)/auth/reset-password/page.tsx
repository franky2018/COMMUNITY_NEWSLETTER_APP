"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api/client";
import { AuthCard } from "@/components/auth/auth-card";
import { Alert, Button, Input, Label, buttonClasses } from "@/components/ui";

const PASSWORD_MIN = 8;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <AuthCard
        title="Invalid reset link"
        subtitle="This password reset link is missing or malformed."
        footer={
          <Link
            href="/auth/login"
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Back to sign in
          </Link>
        }
      >
        <Alert variant="error">Request a new reset link to continue.</Alert>
        <Link
          href="/auth/forgot-password"
          className={buttonClasses({ className: "mt-4 w-full" })}
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password reset" subtitle="Your password has been updated.">
        <Alert variant="success">You can now sign in with your new password.</Alert>
        <Link href="/auth/login" className={buttonClasses({ className: "mt-4 w-full" })}>
          Sign in
        </Link>
      </AuthCard>
    );
  }

  function validate(): boolean {
    const errors: { password?: string; confirm?: string } = {};

    if (password.length < PASSWORD_MIN) {
      errors.password = `Password must be at least ${PASSWORD_MIN} characters.`;
    }

    if (confirm !== password) {
      errors.confirm = "Passwords do not match.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      await apiClient.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 400 || error.status === 401 || error.status === 404)
      ) {
        setFormError("This reset link is invalid or has expired. Request a new one.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Set a new password" subtitle="Choose a strong password you don't use elsewhere.">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={Boolean(fieldErrors.password)}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
          />
          {fieldErrors.password ? (
            <p id="password-error" className="text-xs text-danger" role="alert">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => {
              setConfirm(event.target.value);
              setFieldErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            error={Boolean(fieldErrors.confirm)}
            aria-invalid={Boolean(fieldErrors.confirm)}
            aria-describedby={fieldErrors.confirm ? "confirm-error" : undefined}
          />
          {fieldErrors.confirm ? (
            <p id="confirm-error" className="text-xs text-danger" role="alert">
              {fieldErrors.confirm}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={submitting || !password || !confirm}
        >
          {submitting ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
