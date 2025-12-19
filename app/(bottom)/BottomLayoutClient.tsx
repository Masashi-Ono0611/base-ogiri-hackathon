"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import styles from "../styles/bottom.module.css";
import { BASE_CHAIN_ID } from "../constants/onchain";
import { useMiniAppCapabilities } from "../hooks/useMiniAppCapabilities";
import { useAutoSwitchChain } from "../hooks/useAutoSwitchChain";
import { MiniAppDebug } from "../components/MiniAppDebug";
import { AppHeader } from "../components/AppHeader";
import { BottomNav } from "../components/BottomNav";
import { NetworkMismatchBanner } from "../components/NetworkMismatchBanner";

export function BottomLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isFrameReady, setFrameReady } = useMiniKit();

  const targetChainId = BASE_CHAIN_ID;
  const { isWrongNetwork, switchError, isSwitching, switchToTargetChain } = useAutoSwitchChain({
    targetChainId,
  });

  const { miniAppSdkReady, miniAppIsInMiniApp, miniAppChains, miniAppSdkError } = useMiniAppCapabilities();

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

  const isDeposit = pathname === "/deposit";
  const isClaim = pathname === "/claim";

  const showMiniAppDebug = false; // Todo: remove MiniAppDebug for production

  return (
    <div className={styles.container}>
      <AppHeader />

      <NetworkMismatchBanner
        show={isWrongNetwork}
        targetChainId={targetChainId}
        switchError={switchError}
        isSwitching={isSwitching}
        onSwitch={switchToTargetChain}
      />

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
