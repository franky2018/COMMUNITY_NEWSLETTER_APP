"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { ImageUploadField } from "@/components/cms/image-upload-field";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import { listMedia, type MediaAsset } from "@/lib/api/stubs";
import { formatDate } from "@/lib/format";

type LoadState = "loading" | "loaded" | "error";

export default function MediaPage() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  function handleUploaded(url: string | null) {
    if (!url) {
      return;
    }

    setAssets((prev) => [
      {
        id: url,
        url,
        type: "newsletter",
        createdAt: new Date().toISOString(),
        filename: url.split("/").pop() ?? "image",
      },
      ...prev,
    ]);
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      window.setTimeout(() => {
        setCopied((current) => (current === url ? null : current));
      }, 2000);
    } catch {
      // Clipboard access can be denied; failing silently keeps the grid usable.
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header>
        <h1 className="font-serif text-2xl font-semibold text-heading">Media</h1>
        <p className="mt-1 text-sm text-muted">
          Upload and manage images used across newsletters.
        </p>
      </header>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Upload media</CardTitle>
        </CardHeader>
        <CardBody>
          <ImageUploadField
            uploadType="newsletter"
            value={null}
            onChange={handleUploaded}
            helpText="JPG, PNG, or WEBP up to 10 MB. Uploaded images appear in the library below."
            shape="rect"
          />
        </CardBody>
      </Card>

      <section className="mt-10" aria-label="Media library">
        <h2 className="font-serif text-lg font-semibold text-heading">Library</h2>

        <div className="mt-4">
          {state === "loading" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="aspect-video w-full rounded-xl" />
              ))}
            </div>
          ) : state === "error" ? (
            <Alert variant="error">Unable to load the media library.</Alert>
          ) : assets.length === 0 ? (
            <EmptyState
              title="No media yet"
              description="Upload an image above to add it here. A persistent media library is coming soon."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                >
                  <div className="relative aspect-video w-full bg-canvas">
                    <Image
                      src={asset.url}
                      alt={asset.filename ?? "Media asset"}
                      fill
                      sizes="(max-width: 640px) 50vw, 240px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3">
                    <span className="min-w-0 flex-1 truncate text-xs text-muted" title={asset.filename}>
                      {formatDate(asset.createdAt)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(asset.url)}>
                      {copied === asset.url ? "Copied" : "Copy URL"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
