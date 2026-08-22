"use client";

import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";

import { MediaUploadError, uploadImage } from "@/lib/media/upload";
import type { UploadType } from "@/types/api";
import { Button } from "@/components/ui";

const ACCEPT = "image/jpeg,image/png,image/webp";

type ImageUploadFieldProps = {
  uploadType: UploadType;
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  helpText?: string;
  shape?: "circle" | "rect";
  circleSize?: number;
  alt?: string;
  disabled?: boolean;
};

export function ImageUploadField({
  uploadType,
  value,
  onChange,
  label,
  helpText,
  shape = "rect",
  circleSize = 96,
  alt = "Selected image",
  disabled = false,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = uploading || disabled;

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const url = await uploadImage(file, uploadType);
      onChange(url);
    } catch (err) {
      setError(
        err instanceof MediaUploadError
          ? err.message
          : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  }

  function openPicker() {
    if (!busy) {
      inputRef.current?.click();
    }
  }

  function handleRemove() {
    setError(null);
    onChange(null);
  }

  const preview =
    shape === "circle" ? (
      <span
        className="inline-flex items-center justify-center overflow-hidden rounded-full border border-border bg-canvas"
        style={{ width: circleSize, height: circleSize }}
      >
        {value ? (
          <Image
            src={value}
            alt={alt}
            width={circleSize}
            height={circleSize}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs text-muted">No image</span>
        )}
      </span>
    ) : (
      <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border border-border bg-canvas">
        {value ? (
          <Image src={value} alt={alt} fill sizes="(max-width: 768px) 100vw, 28rem" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted">
            No image selected
          </div>
        )}
      </div>
    );

  return (
    <div className="space-y-2">
      {label ? <span className="block text-sm font-medium text-heading">{label}</span> : null}

      <div className={shape === "circle" ? "flex items-center gap-4" : "space-y-3"}>
        {preview}

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleFileChange}
            disabled={busy}
          />
          <Button type="button" variant="secondary" size="sm" onClick={openPicker} disabled={busy}>
            {uploading ? "Uploading…" : value ? "Replace" : "Upload image"}
          </Button>
          {value && !uploading ? (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={disabled}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : helpText ? (
        <p className="text-xs text-muted">{helpText}</p>
      ) : null}
    </div>
  );
}
