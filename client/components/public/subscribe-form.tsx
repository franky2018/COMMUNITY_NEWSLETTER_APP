"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import { getSubscribeErrorMessage } from "./subscribe-errors";

const EMAIL_MAX = 254;
const NAME_MAX = 255;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

const primaryButtonClass =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "rounded-md border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10";

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
        className="mt-8 max-w-2xl rounded-xl border border-green-600/40 bg-green-600/10 p-6 outline-none dark:border-green-500/40"
      >
        <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">
          You&rsquo;re subscribed!
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Thanks for subscribing. You&rsquo;ll receive future community newsletters at this
          address.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/newsletters" className={primaryButtonClass}>
            Browse newsletters
          </Link>
          <button type="button" onClick={subscribeAnother} className={secondaryButtonClass}>
            Subscribe another email
          </button>
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
      {submitError ? (
        <div
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
        >
          {submitError}
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          Email <span className="text-red-500">*</span>
        </label>
        <input
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
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : "email-hint"}
          className={inputClass}
        />
        {fieldErrors.email ? (
          <p id="email-error" className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.email}
          </p>
        ) : (
          <p id="email-hint" className="text-xs text-zinc-500">
            We&rsquo;ll send new community newsletters to this address.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
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
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : "name-hint"}
          className={inputClass}
        />
        {fieldErrors.name ? (
          <p id="name-error" className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.name}
          </p>
        ) : (
          <p id="name-hint" className="text-xs text-zinc-500">
            Optional.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={submitDisabled} className={primaryButtonClass}>
          {submitting ? "Subscribing…" : "Subscribe"}
        </button>
      </div>
    </form>
  );
}
