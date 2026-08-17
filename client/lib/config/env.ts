const DEFAULT_API_BASE_URL = "http://localhost:3000";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

const rawApiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;

export const env = {
  apiBaseUrl: normalizeBaseUrl(rawApiBaseUrl),
};
