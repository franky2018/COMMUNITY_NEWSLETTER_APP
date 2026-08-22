"use client";

import { useState, type FormEvent } from "react";

import { Alert, Button, Input, Label } from "@/components/ui";
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
      {submitError ? <Alert variant="error">{submitError}</Alert> : null}

      <div className="space-y-1.5">
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input
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
          error={Boolean(fieldErrors.email)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email ? (
          <p id="email-error" role="alert" className="text-xs text-danger">
            {fieldErrors.email}
          </p>
        ) : (
          <p className="text-xs text-muted">
            New addresses are added as active. A previously unsubscribed address will be reactivated.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
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
          error={Boolean(fieldErrors.name)}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
        {fieldErrors.name ? (
          <p id="name-error" role="alert" className="text-xs text-danger">
            {fieldErrors.name}
          </p>
        ) : (
          <p className="text-xs text-muted">Optional. Shown alongside the email address.</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={submitDisabled}>
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
