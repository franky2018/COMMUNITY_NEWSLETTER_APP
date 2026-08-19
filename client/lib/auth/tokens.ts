import type { AuthTokens } from "@/types/api";

export const ACCESS_TOKEN_COOKIE = "cn_access_token";
export const REFRESH_TOKEN_COOKIE = "cn_refresh_token";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const SECURE_ATTRIBUTE = process.env.NODE_ENV === "production" ? "; Secure" : "";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.split("=").slice(1).join("="));
}

function writeCookie(name: string, value: string, maxAgeSeconds = COOKIE_MAX_AGE_SECONDS): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${SECURE_ATTRIBUTE}`;
}

function removeCookie(name: string): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${SECURE_ATTRIBUTE}`;
}

export function getAccessToken(): string | null {
  return readCookie(ACCESS_TOKEN_COOKIE);
}

export function getRefreshToken(): string | null {
  return readCookie(REFRESH_TOKEN_COOKIE);
}

export function setAuthTokens(tokens: AuthTokens): void {
  writeCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken);
  writeCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken);
}

export function clearAuthTokens(): void {
  removeCookie(ACCESS_TOKEN_COOKIE);
  removeCookie(REFRESH_TOKEN_COOKIE);
}
