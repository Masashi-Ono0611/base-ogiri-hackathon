"use client";

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Address, Avatar, EthBalance, Identity, Name } from "@coinbase/onchainkit/identity";
import styles from "../styles/bottom.module.css";

type Props = {
  contractAddress: string;
};

export function AppHeader({ contractAddress }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <div className={styles.brandTitle}>Token Inheritance</div>
        <div className={styles.brandSubtitle}>
          Base Sepolia / USDC / HTLC
          <span className={styles.mono}> {contractAddress}</span>
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
  );
}
