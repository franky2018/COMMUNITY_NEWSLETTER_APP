"use client";

import { useState, type FormEvent } from "react";

import { getCategoryErrorMessage } from "./category-errors";

export type CategoryFormValues = {
  name: string;
  description: string | null;
};

type CategoryFormProps = {
  initialValues?: {
    name: string;
    description: string;
  };
  submitLabel: string;
  submittingLabel: string;
  successMessage?: string;
  onDirty?: () => void;
  onSave: (values: CategoryFormValues) => Promise<void>;
};

const NAME_MIN = 2;
const NAME_MAX = 100;
const DESCRIPTION_MAX = 1000;

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

type FieldErrors = { name?: string; description?: string };

export function CategoryForm({
  initialValues,
  submitLabel,
  submittingLabel,
  successMessage,
  onDirty,
  onSave,
}: CategoryFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function markDirty() {
    setSubmitError(null);
    onDirty?.();
  }

  function validate(): boolean {
    const errors: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      errors.name = "Name is required.";
    } else if (trimmedName.length < NAME_MIN) {
      errors.name = `Name must be at least ${NAME_MIN} characters.`;
    } else if (trimmedName.length > NAME_MAX) {
      errors.name = `Name must be ${NAME_MAX} characters or fewer.`;
    }

    if (trimmedDescription.length > DESCRIPTION_MAX) {
      errors.description = `Description must be ${DESCRIPTION_MAX} characters or fewer.`;
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

    const trimmedDescription = description.trim();

    setSubmitting(true);

    try {
      await onSave({
        name: name.trim(),
        description: trimmedDescription === "" ? null : trimmedDescription,
      });
    } catch (error) {
      setSubmitError(getCategoryErrorMessage(error, "Unable to save the category. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const submitDisabled = submitting || !name.trim();

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

      {!submitError && successMessage ? (
        <div
          role="status"
          className="rounded-md border border-green-600/40 bg-green-600/10 px-3 py-2 text-sm text-green-700 dark:border-green-500/40 dark:text-green-400"
        >
          {successMessage}
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
          maxLength={NAME_MAX}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setFieldErrors((prev) => ({ ...prev, name: undefined }));
            markDirty();
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
          <p className="text-xs text-zinc-500">The slug is generated automatically from the name.</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={DESCRIPTION_MAX}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
            setFieldErrors((prev) => ({ ...prev, description: undefined }));
            markDirty();
          }}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={fieldErrors.description ? "description-error" : undefined}
          className={`${inputClass} resize-y`}
        />
        {fieldErrors.description ? (
          <p id="description-error" className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.description}
          </p>
        ) : (
          <p className="text-xs text-zinc-500">Optional short summary of what belongs in this category.</p>
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
