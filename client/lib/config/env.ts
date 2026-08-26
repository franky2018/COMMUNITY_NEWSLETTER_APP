const DEFAULT_API_BASE_URL = "http://localhost:3000";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

const isProduction = process.env.NODE_ENV === "production";

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (isProduction && !configuredApiBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL must be set to the production API origin (no localhost fallback in production).",
  );
}

const rawApiBaseUrl = configuredApiBaseUrl ?? DEFAULT_API_BASE_URL;

const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

export const env = {
  apiBaseUrl: normalizeBaseUrl(rawApiBaseUrl),
  cloudinaryCloudName,
};
