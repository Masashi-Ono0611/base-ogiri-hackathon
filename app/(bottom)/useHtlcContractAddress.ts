"use client";

import { useEffect, useMemo, useState } from "react";

type Result = {
  contractAddress: `0x${string}` | "";
  isLoading: boolean;
  error: string;
};

export function useHtlcContractAddress(): Result {
  const [contractAddress, setContractAddress] = useState<`0x${string}` | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetch("/api/config", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load config: ${res.status}`);
        const json = (await res.json()) as { htlcContractAddress?: string };
        const value = (json.htlcContractAddress ?? "").trim();
        const normalized = value.startsWith("0x") ? (value as `0x${string}`) : ("" as const);
        if (!cancelled) setContractAddress(normalized);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(
    () => ({
      contractAddress,
      isLoading,
      error,
    }),
    [contractAddress, isLoading, error]
  );
}
