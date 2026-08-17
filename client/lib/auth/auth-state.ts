"use client";

import { useSyncExternalStore } from "react";

import { clearAuthTokens, getAccessToken, getRefreshToken, setAuthTokens } from "@/lib/auth/tokens";
import type { AuthTokens } from "@/types/api";

type AuthSnapshot = {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthListener = () => void;

const listeners = new Set<AuthListener>();

function emitAuthChange(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: AuthListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AuthSnapshot {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  return {
    isAuthenticated: Boolean(accessToken),
    accessToken,
    refreshToken,
  };
}

function getServerSnapshot(): AuthSnapshot {
  return {
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
  };
}

export function useAuthState(): AuthSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function saveAuthTokens(tokens: AuthTokens): void {
  setAuthTokens(tokens);
  emitAuthChange();
}

export function clearAuthState(): void {
  clearAuthTokens();
  emitAuthChange();
}
