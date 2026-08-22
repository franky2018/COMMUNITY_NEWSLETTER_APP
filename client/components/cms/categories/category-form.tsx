"use client";

import { useState, type FormEvent } from "react";

import { Alert, Button, FieldHint, Input, Label, Textarea } from "@/components/ui";
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
      {submitError ? <Alert variant="error">{submitError}</Alert> : null}

      {!submitError && successMessage ? (
        <Alert variant="success">{successMessage}</Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="name" required>
          Name
        </Label>
        <Input
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
          error={Boolean(fieldErrors.name)}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
        {fieldErrors.name ? (
          <p id="name-error" className="text-xs text-danger" role="alert">
            {fieldErrors.name}
          </p>
        ) : (
          <FieldHint>The slug is generated automatically from the name.</FieldHint>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
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
          error={Boolean(fieldErrors.description)}
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={fieldErrors.description ? "description-error" : undefined}
        />
        {fieldErrors.description ? (
          <p id="description-error" className="text-xs text-danger" role="alert">
            {fieldErrors.description}
          </p>
        ) : (
          <FieldHint>Optional short summary of what belongs in this category.</FieldHint>
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
