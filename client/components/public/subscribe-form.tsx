"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import { Alert, Button, Input, Label, buttonClasses } from "@/components/ui";
import { getSubscribeErrorMessage } from "./subscribe-errors";

const EMAIL_MAX = 254;
const NAME_MAX = 255;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { email?: string; name?: string };

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const confirmationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitted) {
      confirmationRef.current?.focus();
    }
  }, [submitted]);

  function validate(): boolean {
    const errors: FieldErrors = {};
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (trimmedEmail.length > EMAIL_MAX) {
      errors.email = `Email must be ${EMAIL_MAX} characters or fewer.`;
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (trimmedName.length > NAME_MAX) {
      errors.name = `Name must be ${NAME_MAX} characters or fewer.`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitError(null);

    if (!validate()) {
      return;
    }

    const trimmedName = name.trim();

    setSubmitting(true);

    try {
      await apiClient.post<{ message?: string }>("/subscribers", {
        email: email.trim(),
        name: trimmedName === "" ? null : trimmedName,
      });

      setEmail("");
      setName("");
      setFieldErrors({});
      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        getSubscribeErrorMessage(error, "Unable to subscribe right now. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function subscribeAnother() {
    setSubmitted(false);
    setSubmitError(null);
  }

  if (submitted) {
    return (
      <div
        ref={confirmationRef}
        tabIndex={-1}
        role="status"
        className="mt-8 max-w-2xl rounded-xl border border-success/40 bg-success-soft p-6 outline-none"
      >
        <h2 className="font-serif text-xl font-semibold text-heading">You&rsquo;re subscribed!</h2>
        <p className="mt-2 text-sm text-body">
          Thanks for subscribing. You&rsquo;ll receive future community newsletters at this address.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/newsletters" className={buttonClasses()}>
            Browse newsletters
          </Link>
          <Button type="button" variant="secondary" onClick={subscribeAnother}>
            Subscribe another email
          </Button>
        </div>
      </div>
    );
  }

  const submitDisabled = submitting || !email.trim();

  return (
    <form
      className="mt-8 max-w-2xl space-y-5"
      onSubmit={handleSubmit}
      aria-busy={submitting}
      noValidate
    >
      {submitError ? <Alert variant="error">{submitError}</Alert> : null}

      <div className="space-y-1">
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={EMAIL_MAX}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
            setSubmitError(null);
          }}
          error={Boolean(fieldErrors.email)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : "email-hint"}
        />
        {fieldErrors.email ? (
          <p id="email-error" role="alert" className="text-xs text-danger">
            {fieldErrors.email}
          </p>
        ) : (
          <p id="email-hint" className="text-xs text-muted">
            We&rsquo;ll send new community newsletters to this address.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={NAME_MAX}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setFieldErrors((prev) => ({ ...prev, name: undefined }));
            setSubmitError(null);
          }}
          error={Boolean(fieldErrors.name)}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : "name-hint"}
        />
        {fieldErrors.name ? (
          <p id="name-error" role="alert" className="text-xs text-danger">
            {fieldErrors.name}
          </p>
        ) : (
          <p id="name-hint" className="text-xs text-muted">
            Optional.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={submitDisabled}>
          {submitting ? "Subscribing…" : "Subscribe"}
        </Button>
      </div>
    </form>
  );
}
