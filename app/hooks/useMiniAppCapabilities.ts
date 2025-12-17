"use client";

import { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

type MiniAppSdkReady = "unknown" | "ready" | "error";

type Result = {
  miniAppSdkReady: MiniAppSdkReady;
  miniAppIsInMiniApp: boolean | null;
  miniAppChains: string[];
  miniAppSdkError: string;
};

export function useMiniAppCapabilities(): Result {
  const [miniAppSdkReady, setMiniAppSdkReady] = useState<MiniAppSdkReady>("unknown");
  const [miniAppIsInMiniApp, setMiniAppIsInMiniApp] = useState<boolean | null>(null);
  const [miniAppChains, setMiniAppChains] = useState<string[]>([]);
  const [miniAppSdkError, setMiniAppSdkError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await sdk.actions.ready();
        const isInMiniApp = await sdk.isInMiniApp();
        const chains = await sdk.getChains();
        const normalizedChains = Array.isArray(chains) ? chains : [];

        if (cancelled) return;
        setMiniAppSdkReady("ready");
        setMiniAppIsInMiniApp(isInMiniApp);
        setMiniAppChains(normalizedChains);
        setMiniAppSdkError("");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setMiniAppSdkReady("error");
        setMiniAppIsInMiniApp(null);
        setMiniAppChains([]);
        setMiniAppSdkError(msg);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { miniAppSdkReady, miniAppIsInMiniApp, miniAppChains, miniAppSdkError };
}
