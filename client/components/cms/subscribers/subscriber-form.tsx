"use client";

import { useState, type FormEvent } from "react";

import { getSubscriberErrorMessage } from "./subscriber-errors";

export type SubscriberFormValues = {
  email: string;
  name: string | null;
};

type SubscriberFormProps = {
  submitLabel: string;
  submittingLabel: string;
  onSave: (values: SubscriberFormValues) => Promise<void>;
};

const EMAIL_MAX = 254;
const NAME_MAX = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

type FieldErrors = { email?: string; name?: string };

export function SubscriberForm({ submitLabel, submittingLabel, onSave }: SubscriberFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      await onSave({
        email: email.trim(),
        name: trimmedName === "" ? null : trimmedName,
      });
    } catch (error) {
      setSubmitError(
        getSubscriberErrorMessage(error, "Unable to add the subscriber. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const submitDisabled = submitting || !email.trim();

  return (
    <form className="mt-8 max-w-2xl space-y-5" onSubmit={handleSubmit} noValidate>
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
          autoComplete="off"
          maxLength={EMAIL_MAX}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
            setSubmitError(null);
          }}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          className={inputClass}
        />
        {fieldErrors.email ? (
          <p id="email-error" className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.email}
          </p>
        ) : (
          <p className="text-xs text-zinc-500">
            New addresses are added as active. A previously unsubscribed address will be reactivated.
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
          maxLength={NAME_MAX}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setFieldErrors((prev) => ({ ...prev, name: undefined }));
            setSubmitError(null);
          }}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          className={inputClass}
        />
        {fieldErrors.name ? (
          <p id="name-error" className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.name}
          </p>
        ) : (
          <p className="text-xs text-zinc-500">Optional. Shown alongside the email address.</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitDisabled}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
