"use client";

import { useState, type FormEvent } from "react";

import type { UserRole } from "@/types/api";
import { Alert, Button, Input, Label, Select } from "@/components/ui";
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
      {submitError ? <Alert variant="error">{submitError}</Alert> : null}

      <div className="space-y-1.5">
        <Label htmlFor="name" required>
          Name
        </Label>
        <Input
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
          error={Boolean(fieldErrors.name)}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
        {fieldErrors.name ? (
          <p id="name-error" role="alert" className="text-xs text-danger">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

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
          <p className="text-xs text-muted">Used to sign in. Must be unique.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" required>
          Password
        </Label>
        <Input
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
          error={Boolean(fieldErrors.password)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
        />
        {fieldErrors.password ? (
          <p id="password-error" role="alert" className="text-xs text-danger">
            {fieldErrors.password}
          </p>
        ) : (
          <p className="text-xs text-muted">
            At least {PASSWORD_MIN} characters. Share it with the user securely.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <Select
          id="role"
          name="role"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as AssignableRole);
            setSubmitError(null);
          }}
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {roleHint ? <p className="text-xs text-muted">{roleHint}</p> : null}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={submitDisabled}>
          {submitting ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
