"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Address, Avatar, EthBalance, Identity, Name } from "@coinbase/onchainkit/identity";
import styles from "../styles/bottom.module.css";

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <Link href="/" aria-label="Go to top page" style={{ display: "block", width: "100%" }}>
          <div style={{ position: "relative", width: "100%", height: 44 }}>
            <Image
              src="/MagoHODL-logo-wide-dark.png"
              alt="MagoHODL"
              fill
              sizes="(max-width: 560px) 70vw, 360px"
              style={{ objectFit: "contain", objectPosition: "left center" }}
            />
          </div>
        </Link>
      </div>

      <Wallet>
        <ConnectWallet disconnectedLabel="Connect" className={styles.headerWalletButton}>
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
  );
}
