"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "./cn";

export type ToastVariant = "success" | "error" | "warning" | "info";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = Required<Omit<ToastInput, "duration">> & { id: number };

type ToastContextValue = { toast: (input: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

const accentClasses: Record<ToastVariant, string> = {
  success: "border-l-success",
  error: "border-l-danger",
  warning: "border-l-warning",
  info: "border-l-primary",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(0);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = (idRef.current += 1);
      setToasts((current) => [
        ...current,
        {
          id,
          title: input.title,
          description: input.description ?? "",
          variant: input.variant ?? "info",
        },
      ]);
      const duration = input.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted
        ? createPortal(
            <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
              {toasts.map((item) => (
                <div
                  key={item.id}
                  role={item.variant === "error" ? "alert" : "status"}
                  className={cn(
                    "pointer-events-auto flex items-start gap-3 rounded-md border border-l-4 border-border bg-card px-4 py-3 shadow-lg",
                    accentClasses[item.variant],
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-heading">{item.title}</p>
                    {item.description ? (
                      <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismiss(item.id)}
                    aria-label="Dismiss notification"
                    className="-mr-1 rounded p-1 text-muted transition-colors hover:text-heading"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}
