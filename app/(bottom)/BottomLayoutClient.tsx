"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Address, Avatar, EthBalance, Identity, Name } from "@coinbase/onchainkit/identity";
import styles from "./styles.module.css";
import { HTLC_CONTRACT_ADDRESS } from "./_shared";

export function BottomLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isFrameReady, setFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

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
