"use client";

import { useCallback, useEffect, useState } from "react";

import { apiClient } from "@/lib/api/client";

export type ResourceState = "loading" | "loaded" | "error";

export type DashboardResource<T> = {
  data: T | null;
  state: ResourceState;
  reload: () => void;
};

function isAbortError(error: unknown, signal?: AbortSignal): boolean {
  return Boolean(signal?.aborted) || (error instanceof DOMException && error.name === "AbortError");
}

export function useDashboardResource<T>(path: string, enabled = true): DashboardResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [state, setState] = useState<ResourceState>("loading");

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setState("loading");

      try {
        const result = await apiClient.get<T>(path, { requiresAuth: true, signal });

        if (signal?.aborted) {
          return;
        }

        setData(result);
        setState("loaded");
      } catch (error) {
        if (isAbortError(error, signal)) {
          return;
        }

        setState("error");
      }
    },
    [path],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();
    void load(controller.signal);

    return () => controller.abort();
  }, [enabled, load]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

  return { data, state, reload };
}
