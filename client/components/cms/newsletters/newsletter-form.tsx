"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";

import { ImageUploadField } from "@/components/cms/image-upload-field";
import { MediaPicker } from "@/components/cms/media/media-picker";
import {
  Alert,
  Badge,
  Button,
  FieldHint,
  Input,
  Label,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { getApiErrorMessage } from "./newsletter-errors";

export type NewsletterFormValues = {
  title: string;
  excerpt: string | null;
  content: string;
  featuredImageUrl: string | null;
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
    featuredImageUrl: string | null;
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

type FieldErrors = { title?: string; content?: string; excerpt?: string };

// Content is edited as plain text, so mirror the public article: split on blank
// lines into paragraphs and preserve single line breaks within each.
function toParagraphs(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

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
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(
    initialValues?.featuredImageUrl ?? null,
  );
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

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
        featuredImageUrl,
        categoryId: categoryId === "" ? null : categoryId,
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to save the newsletter. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  const submitDisabled = submitting || !title.trim() || !content.trim();

  const selectedCategory = categories.find((category) => category.id === categoryId) ?? null;
  const previewParagraphs = toParagraphs(content);
  const hasPreviewContent = Boolean(title.trim() || content.trim());

  return (
    <>
      <form className="mt-8 max-w-2xl space-y-5" onSubmit={handleSubmit} noValidate>
      {submitError ? <Alert variant="error">{submitError}</Alert> : null}

      {!submitError && successMessage ? (
        <Alert variant="success">{successMessage}</Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="title" required>
          Title
        </Label>
        <Input
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
          error={Boolean(fieldErrors.title)}
          aria-invalid={Boolean(fieldErrors.title)}
          aria-describedby={fieldErrors.title ? "title-error" : undefined}
        />
        {fieldErrors.title ? (
          <p id="title-error" className="text-xs text-danger" role="alert">
            {fieldErrors.title}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
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
          error={Boolean(fieldErrors.excerpt)}
          aria-invalid={Boolean(fieldErrors.excerpt)}
          aria-describedby={fieldErrors.excerpt ? "excerpt-error" : undefined}
        />
        {fieldErrors.excerpt ? (
          <p id="excerpt-error" className="text-xs text-danger" role="alert">
            {fieldErrors.excerpt}
          </p>
        ) : (
          <FieldHint>Optional short summary shown in listings.</FieldHint>
        )}
      </div>

      <div className="space-y-2">
        <ImageUploadField
          uploadType="newsletter"
          value={featuredImageUrl}
          onChange={(url) => {
            setFeaturedImageUrl(url);
            markDirty();
          }}
          label="Featured image"
          helpText="Optional. JPG, PNG, or WEBP up to 10 MB. Shown on cards and the article header."
          shape="rect"
          alt="Newsletter featured image"
        />
        <Button type="button" variant="ghost" size="sm" onClick={() => setShowMediaPicker(true)}>
          Browse library
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content" required>
          Content
        </Label>
        <Textarea
          id="content"
          name="content"
          rows={12}
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setFieldErrors((prev) => ({ ...prev, content: undefined }));
            markDirty();
          }}
          error={Boolean(fieldErrors.content)}
          className="font-mono"
          aria-invalid={Boolean(fieldErrors.content)}
          aria-describedby={fieldErrors.content ? "content-error" : undefined}
        />
        {fieldErrors.content ? (
          <p id="content-error" className="text-xs text-danger" role="alert">
            {fieldErrors.content}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Select
          id="category"
          name="category"
          value={categoryId}
          disabled={categoriesUnavailable}
          onChange={(event) => {
            setCategoryId(event.target.value);
            markDirty();
          }}
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        {categoriesUnavailable ? (
          <FieldHint>Categories could not be loaded. You can still save without one.</FieldHint>
        ) : categories.length === 0 ? (
          <FieldHint>No categories available yet.</FieldHint>
        ) : null}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={submitDisabled}>
          {submitting ? submittingLabel : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setShowPreview(true)}>
          Preview
        </Button>
      </div>
      </form>

      <MediaPicker
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => {
          setFeaturedImageUrl(url);
          markDirty();
        }}
      />

      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="Preview"
        className="max-w-3xl"
      >
        <div className="mt-4 max-h-[70vh] overflow-y-auto">
          {hasPreviewContent ? (
            <article>
              {featuredImageUrl ? (
                <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-xl bg-canvas">
                  <Image
                    src={featuredImageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 40rem"
                    className="object-cover"
                  />
                </div>
              ) : null}

              {selectedCategory ? (
                <Badge tone="neutral" className="w-fit">
                  {selectedCategory.name}
                </Badge>
              ) : null}

              <h1 className="mt-3 break-words font-serif text-3xl font-semibold tracking-tight text-heading">
                {title.trim() || "Untitled newsletter"}
              </h1>

              {excerpt.trim() ? (
                <p className="mt-4 text-base text-body">{excerpt.trim()}</p>
              ) : null}

              <div className="mt-6 space-y-5 border-t border-border pt-6 text-base leading-7 text-body">
                {previewParagraphs.length > 0 ? (
                  previewParagraphs.map((paragraph, index) => (
                    <p key={index} className="whitespace-pre-line break-words">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-sm text-muted">No content yet.</p>
                )}
              </div>
            </article>
          ) : (
            <p className="text-sm text-muted">
              Add a title or content to see a preview of your newsletter.
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
