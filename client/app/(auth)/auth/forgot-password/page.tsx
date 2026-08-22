"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

import { ApiError, apiClient } from "@/lib/api/client";
import { AuthCard } from "@/components/auth/auth-card";
import { Alert, Button, Input, Label } from "@/components/ui";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const trimmed = email.trim();

    if (!trimmed) {
      setFieldError("Email is required.");
      return;
    }

    if (!EMAIL_PATTERN.test(trimmed)) {
      setFieldError("Enter a valid email address.");
      return;
    }

    setFieldError(null);
    setSubmitting(true);

    try {
      await apiClient.post("/auth/forgot-password", { email: trimmed });
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        setFormError("Too many requests. Please wait a moment and try again.");
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="If an account exists for that address, a password reset link is on its way."
        footer={
          <Link
            href="/auth/login"
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Back to sign in
          </Link>
        }
      >
        <Alert variant="success">
          We&rsquo;ve sent a reset link to <span className="font-medium">{email.trim()}</span>. It
          expires soon, so check your inbox shortly.
        </Alert>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Use a different email
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <>
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary transition-colors hover:text-primary-hover"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setFieldError(null);
            }}
            error={Boolean(fieldError)}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? "email-error" : undefined}
          />
          {fieldError ? (
            <p id="email-error" className="text-xs text-danger" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={submitting || !email.trim()}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthCard>
  );
}
