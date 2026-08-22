import { apiClient } from "@/lib/api/client";
import type { UploadSignature, UploadType } from "@/types/api";

export class MediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaUploadError";
  }
}

export function requestUploadSignature(uploadType: UploadType): Promise<UploadSignature> {
  return apiClient.post<UploadSignature>(
    "/media/signature",
    { uploadType },
    { requiresAuth: true },
  );
}

function formatMegabytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
}

export function validateFile(
  file: File,
  policy: Pick<UploadSignature, "allowedMimeTypes" | "maxBytes">,
): string | null {
  if (policy.allowedMimeTypes.length > 0 && !policy.allowedMimeTypes.includes(file.type)) {
    return "Unsupported file type. Please choose a JPG, PNG, or WEBP image.";
  }

  if (file.size > policy.maxBytes) {
    return `Image is too large. The maximum size is ${formatMegabytes(policy.maxBytes)}.`;
  }

  return null;
}

export async function uploadToCloudinary(
  file: File,
  signature: UploadSignature,
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);

  for (const [key, value] of Object.entries(signature.params)) {
    formData.append(key, value);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`;

  let response: Response;
  try {
    response = await fetch(endpoint, { method: "POST", body: formData });
  } catch {
    throw new MediaUploadError("Upload failed. Please check your connection and try again.");
  }

  if (!response.ok) {
    throw new MediaUploadError("Upload failed. Please try again.");
  }

  const payload = (await response.json()) as { secure_url?: string };

  if (!payload.secure_url) {
    throw new MediaUploadError("Upload failed. Please try again.");
  }

  return payload.secure_url;
}

export async function uploadImage(file: File, uploadType: UploadType): Promise<string> {
  const signature = await requestUploadSignature(uploadType);

  const validationError = validateFile(file, signature);
  if (validationError) {
    throw new MediaUploadError(validationError);
  }

  return uploadToCloudinary(file, signature);
}
