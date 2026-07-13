"use client";
import { useEffect, useState } from "react";
import { useAppState } from "@/context/AppState";

export function useApiData<T>(path: string | null, deps: unknown[] = []): { data: T | null; loading: boolean } {
  const { api, reloadKey } = useAppState();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const d = await api.get<T>(path as string);
        if (!cancelled) setData(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, api, reloadKey, ...deps]);

  return { data, loading };
}
