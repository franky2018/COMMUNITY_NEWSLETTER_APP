"use client";

import { useState, type FormEvent } from "react";

import { getApiErrorMessage } from "./newsletter-errors";

export type NewsletterFormValues = {
  title: string;
  excerpt: string | null;
  content: string;
  categoryId: string | null;
};

export type NewsletterCategoryOption = {
  id: string;
  name: string;
};

type NewsletterFormProps = {
  categories: readonly NewsletterCategoryOption[];
  categoriesUnavailable?: boolean;
  initialValues?: {
    title: string;
    excerpt: string;
    content: string;
    categoryId: string;
  };
  submitLabel: string;
  submittingLabel: string;
  successMessage?: string;
  onDirty?: () => void;
  onSave: (values: NewsletterFormValues) => Promise<void>;
};

const TITLE_MIN = 3;
const CONTENT_MIN = 10;
const EXCERPT_MAX = 500;

const inputClass =
  "w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

type FieldErrors = { title?: string; content?: string; excerpt?: string };

export function NewsletterForm({
  categories,
  categoriesUnavailable = false,
  initialValues,
  submitLabel,
  submittingLabel,
  successMessage,
  onDirty,
  onSave,
}: NewsletterFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialValues?.excerpt ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function markDirty() {
    setSubmitError(null);
    onDirty?.();
  }

  function validate(): boolean {
    const errors: FieldErrors = {};
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      errors.title = "Title is required.";
    } else if (trimmedTitle.length < TITLE_MIN) {
      errors.title = `Title must be at least ${TITLE_MIN} characters.`;
    }

    if (!trimmedContent) {
      errors.content = "Content is required.";
    } else if (trimmedContent.length < CONTENT_MIN) {
      errors.content = `Content must be at least ${CONTENT_MIN} characters.`;
    }

    if (excerpt.trim().length > EXCERPT_MAX) {
      errors.excerpt = `Excerpt must be ${EXCERPT_MAX} characters or fewer.`;
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

    const trimmedExcerpt = excerpt.trim();

    setSubmitting(true);

    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        excerpt: trimmedExcerpt === "" ? null : trimmedExcerpt,
        categoryId: categoryId === "" ? null : categoryId,
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to save the newsletter. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const submitDisabled = submitting || !title.trim() || !content.trim();

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
        <label htmlFor="title" className="block text-sm font-medium">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={255}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setFieldErrors((prev) => ({ ...prev, title: undefined }));
            markDirty();
          }}
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? "title-error" : undefined}
          className={inputClass}
        />
        {fieldErrors.title ? (
          <p id="title-error" className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.title}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="excerpt" className="block text-sm font-medium">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          maxLength={EXCERPT_MAX}
          value={excerpt}
          onChange={(event) => {
            setExcerpt(event.target.value);
            setFieldErrors((prev) => ({ ...prev, excerpt: undefined }));
            markDirty();
          }}
          aria-invalid={Boolean(fieldErrors.excerpt)}
          aria-describedby={fieldErrors.excerpt ? "excerpt-error" : undefined}
          className={inputClass}
        />
        {fieldErrors.excerpt ? (
          <p id="excerpt-error" className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.excerpt}
          </p>
        ) : (
          <p className="text-xs text-zinc-500">Optional short summary shown in listings.</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="content" className="block text-sm font-medium">
          Content <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          rows={12}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setFieldErrors((prev) => ({ ...prev, content: undefined }));
            markDirty();
          }}
          aria-invalid={Boolean(fieldErrors.content)}
          aria-describedby={fieldErrors.content ? "content-error" : undefined}
          className={`${inputClass} resize-y font-mono`}
        />
        {fieldErrors.content ? (
          <p id="content-error" className="text-xs text-red-600 dark:text-red-400">
            {fieldErrors.content}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="category" className="block text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={categoryId}
          disabled={categoriesUnavailable}
          onChange={(event) => {
            setCategoryId(event.target.value);
            markDirty();
          }}
          className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {categoriesUnavailable ? (
          <p className="text-xs text-zinc-500">Categories could not be loaded. You can still save without one.</p>
        ) : categories.length === 0 ? (
          <p className="text-xs text-zinc-500">No categories available yet.</p>
        ) : null}
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
