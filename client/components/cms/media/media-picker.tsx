"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { ImageUploadField } from "@/components/cms/image-upload-field";
import { Alert, EmptyState, Modal, Skeleton } from "@/components/ui";
import { listMedia, type MediaAsset } from "@/lib/api/stubs";

type LoadState = "loading" | "loaded" | "error";

type MediaPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setState("loading");

    listMedia()
      .then((items) => {
        if (active) {
          setAssets(items);
          setState("loaded");
        }
      })
      .catch(() => {
        if (active) {
          setState("error");
        }
      });

    return () => {
      active = false;
    };
  }, [open]);

  function handleUploaded(url: string | null) {
    if (url) {
      onSelect(url);
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Media library" className="max-w-2xl">
      <div className="mt-4 space-y-6">
        <ImageUploadField
          uploadType="newsletter"
          value={null}
          onChange={handleUploaded}
          label="Upload new"
          helpText="JPG, PNG, or WEBP up to 10 MB. The uploaded image is selected immediately."
          shape="rect"
        />

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Library</p>
          <div className="mt-3">
            {state === "loading" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="aspect-video w-full" />
                ))}
              </div>
            ) : state === "error" ? (
              <Alert variant="error">Unable to load the media library.</Alert>
            ) : assets.length === 0 ? (
              <EmptyState
                title="No media yet"
                description="Upload an image above to use it. A persistent library is coming soon."
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {assets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      onSelect(asset.url);
                      onClose();
                    }}
                    className="relative aspect-video overflow-hidden rounded-lg border border-border bg-canvas outline-none transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Image
                      src={asset.url}
                      alt={asset.filename ?? "Media asset"}
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
