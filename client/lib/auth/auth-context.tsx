"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { apiClient, registerAuthFailureHandler } from "@/lib/api/client";
import { clearAuthTokens, getAccessToken, setAuthTokens } from "@/lib/auth/tokens";
import type { LoginResponse, User, UserRole } from "@/types/api";

const LOGIN_PATH = "/auth/login";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  user: User | null;
  role: UserRole | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    registerAuthFailureHandler(() => {
      setUser(null);
      setStatus("unauthenticated");
      router.replace(LOGIN_PATH);
    });

    return () => registerAuthFailureHandler(null);
  }, [router]);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!getAccessToken()) {
        setStatus("unauthenticated");
        return;
      }

      try {
        const currentUser = await apiClient.get<User>("/auth/me", { requiresAuth: true });

        if (!active) {
          return;
        }

        setUser(currentUser);
        setStatus("authenticated");
      } catch {
        if (active) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    void hydrate();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post<LoginResponse>("/auth/login", { email, password });

    setAuthTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });
    setUser(response.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(() => {
    clearAuthTokens();
    setUser(null);
    setStatus("unauthenticated");
    router.replace(LOGIN_PATH);
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      status,
      isAuthenticated: status === "authenticated",
      login,
      logout,
    }),
    [user, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
