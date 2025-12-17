"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import styles from "./styles.module.css";
import { BASE_SEPOLIA_CHAIN_ID } from "../constants/onchain";
import { useHtlcContractAddress } from "../hooks/useHtlcContractAddress";
import { MiniAppDebug } from "./MiniAppDebug";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

export function BottomLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isFrameReady, setFrameReady } = useMiniKit();

  const { contractAddress: htlcContractAddress } = useHtlcContractAddress();

  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const [switchError, setSwitchError] = useState<string>("");
  const [hasAttemptedAutoSwitch, setHasAttemptedAutoSwitch] = useState(false);
  const [miniAppSdkReady, setMiniAppSdkReady] = useState<"unknown" | "ready" | "error">("unknown");
  const [miniAppIsInMiniApp, setMiniAppIsInMiniApp] = useState<boolean | null>(null);
  const [miniAppChains, setMiniAppChains] = useState<string[]>([]);
  const [miniAppSdkError, setMiniAppSdkError] = useState<string>("");

  const targetChainId = BASE_SEPOLIA_CHAIN_ID;
  const isWrongNetwork = useMemo(() => {
    if (!isConnected) return false;
    return chainId !== targetChainId;
  }, [isConnected, chainId, targetChainId]);

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

  useEffect(() => {
    let cancelled = false;

    async function loadMiniAppCapabilities() {
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

    void loadMiniAppCapabilities();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function maybeAutoSwitch() {
      if (!isWrongNetwork) return;
      if (hasAttemptedAutoSwitch) return;

      setHasAttemptedAutoSwitch(true);
      try {
        await switchChainAsync({ chainId: targetChainId });
        if (!cancelled) setSwitchError("");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setSwitchError(msg);
      }
    }

    void maybeAutoSwitch();
    return () => {
      cancelled = true;
    };
  }, [isWrongNetwork, hasAttemptedAutoSwitch, switchChainAsync, targetChainId]);

  const isDeposit = pathname === "/deposit";
  const isClaim = pathname === "/claim";

  const showMiniAppDebug = false; // Todo: remove MiniAppDebug for production

  return (
    <div className={styles.container}>
      <AppHeader contractAddress={htlcContractAddress || "(loading...)"} />

      {isWrongNetwork && (
        <div className={styles.alert}>
          <div className={styles.alertTitle}>Network mismatch</div>
          <div className={styles.alertText}>
            Please switch your wallet network to <strong>Base Sepolia</strong> (chainId {targetChainId}).
          </div>
          {switchError && <div className={styles.alertText}>Wallet error: {switchError}</div>}
          <button
            type="button"
            className={styles.alertButton}
            onClick={async () => {
              try {
                setSwitchError("");
                await switchChainAsync({ chainId: targetChainId });
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                setSwitchError(msg);
              }
            }}
            disabled={isSwitching}
          >
            {isSwitching ? "Switching..." : "Switch to Base Sepolia"}
          </button>
        </div>
      )}

      <main className={styles.content}>{children}</main>

      <MiniAppDebug
        show={showMiniAppDebug}
        miniAppSdkReady={miniAppSdkReady}
        miniAppIsInMiniApp={miniAppIsInMiniApp}
        miniAppChains={miniAppChains}
        miniAppSdkError={miniAppSdkError}
      />

      <BottomNav isDeposit={isDeposit} isClaim={isClaim} />
    </div>
  );
}
