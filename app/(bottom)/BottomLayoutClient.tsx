"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Address, Avatar, EthBalance, Identity, Name } from "@coinbase/onchainkit/identity";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import styles from "./styles.module.css";
import { HTLC_CONTRACT_ADDRESS } from "./_shared";

export function BottomLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isFrameReady, setFrameReady } = useMiniKit();

  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const [switchError, setSwitchError] = useState<string>("");
  const [hasAttemptedAutoSwitch, setHasAttemptedAutoSwitch] = useState(false);

  const targetChainId = baseSepolia.id;
  const isWrongNetwork = useMemo(() => {
    if (!isConnected) return false;
    return chainId !== targetChainId;
  }, [isConnected, chainId, targetChainId]);

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandTitle}>Token Inheritance</div>
          <div className={styles.brandSubtitle}>
            Base Sepolia / USDC / HTLC
            <span className={styles.mono}> {HTLC_CONTRACT_ADDRESS}</span>
          </div>
        </div>

        <Wallet>
          <ConnectWallet disconnectedLabel="Connect" className={styles.button}>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </header>

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

      <nav className={styles.bottomNav}>
        <Link
          href="/deposit"
          className={`${styles.navLink} ${isDeposit ? styles.navLinkActive : ""}`}
        >
          Deposit
        </Link>
        <Link
          href="/claim"
          className={`${styles.navLink} ${isClaim ? styles.navLinkActive : ""}`}
        >
          Claim
        </Link>
      </nav>
    </div>
  );
}
