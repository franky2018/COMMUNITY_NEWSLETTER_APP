"use client";

import { useState, type FormEvent } from "react";

import type { UserRole } from "@/types/api";
import { getUserErrorMessage } from "./user-errors";

export type AssignableRole = Exclude<UserRole, "ADMIN">;

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  role: AssignableRole;
};

type UserFormProps = {
  submitLabel: string;
  submittingLabel: string;
  onSave: (values: UserFormValues) => Promise<void>;
};

const NAME_MAX = 100;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ADMIN is intentionally absent — the backend rejects it and admins are not created here.
const ROLE_OPTIONS: { value: AssignableRole; label: string; hint: string }[] = [
  { value: "AUTHOR", label: "Author", hint: "Can write and manage their own newsletters." },
  {
    value: "EDITOR",
    label: "Editor",
    hint: "Can manage all newsletters, categories, and subscribers.",
  },
];

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

type FieldErrors = { name?: string; email?: string; password?: string };

export function UserForm({ submitLabel, submittingLabel, onSave }: UserFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AssignableRole>("AUTHOR");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const errors: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      errors.name = "Name is required.";
    } else if (trimmedName.length > NAME_MAX) {
      errors.name = `Name must be ${NAME_MAX} characters or fewer.`;
    }

    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (trimmedEmail.length > EMAIL_MAX) {
      errors.email = `Email must be ${EMAIL_MAX} characters or fewer.`;
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < PASSWORD_MIN) {
      errors.password = `Password must be at least ${PASSWORD_MIN} characters.`;
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

    setSubmitting(true);

    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
    } catch (error) {
      setSubmitError(getUserErrorMessage(error, "Unable to create the user. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const submitDisabled = submitting || !name.trim() || !email.trim() || !password;
  const roleHint = ROLE_OPTIONS.find((option) => option.value === role)?.hint;

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
        <label htmlFor="name" className="block text-sm font-medium">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="off"
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
        ) : null}
      </div>

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
          <p className="text-xs text-zinc-500">Used to sign in. Must be unique.</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
            setSubmitError(null);
          }}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          className={inputClass}
        />
        {fieldErrors.password ? (
          <p id="password-error" className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.password}
          </p>
        ) : (
          <p className="text-xs text-zinc-500">
            At least {PASSWORD_MIN} characters. Share it with the user securely.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="role" className="block text-sm font-medium">
          Role
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as AssignableRole);
            setSubmitError(null);
          }}
          className={inputClass}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {roleHint ? <p className="text-xs text-zinc-500">{roleHint}</p> : null}
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
