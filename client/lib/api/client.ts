import { env } from "@/lib/config/env";
import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "@/lib/auth/tokens";
import type { AuthTokens } from "@/types/api";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  requiresAuth?: boolean;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

let refreshInFlight: Promise<string | null> | null = null;
let authFailureHandler: (() => void) | null = null;

export function registerAuthFailureHandler(handler: (() => void) | null): void {
  authFailureHandler = handler;
}

function handleAuthFailure(): void {
  clearAuthTokens();
  authFailureHandler?.();
}

async function parseResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      handleAuthFailure();
      return null;
    }

    const response = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      handleAuthFailure();
      return null;
    }

    const payload = (await response.json()) as Partial<AuthTokens>;

    if (!payload.accessToken) {
      handleAuthFailure();
      return null;
    }

    setAuthTokens({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken ?? refreshToken,
    });

    return payload.accessToken;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers, requiresAuth = false, signal } = options;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (requiresAuth) {
    const accessToken = getAccessToken();

    if (accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(`${env.apiBaseUrl}${normalizedPath}`, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  if (response.status === 401 && requiresAuth) {
    const newAccessToken = await refreshAccessToken();

    if (newAccessToken) {
      requestHeaders.set("Authorization", `Bearer ${newAccessToken}`);

      const retryResponse = await fetch(`${env.apiBaseUrl}${normalizedPath}`, {
        method,
        headers: requestHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });

      if (!retryResponse.ok) {
        const retryPayload = await parseResponsePayload(retryResponse);
        throw new ApiError("API request failed", retryResponse.status, retryPayload);
      }

      return (await parseResponsePayload(retryResponse)) as T;
    }
  }

  if (!response.ok) {
    const payload = await parseResponsePayload(response);
    throw new ApiError("API request failed", response.status, payload);
  }

  return (await parseResponsePayload(response)) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
