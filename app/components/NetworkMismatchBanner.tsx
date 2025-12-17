"use client";

import styles from "../styles/bottom.module.css";

export function NetworkMismatchBanner({
  show,
  targetChainId,
  switchError,
  isSwitching,
  onSwitch,
}: {
  show: boolean;
  targetChainId: number;
  switchError: string;
  isSwitching: boolean;
  onSwitch: () => Promise<void>;
}) {
  if (!show) return null;

  return (
    <div className={styles.alert}>
      <div className={styles.alertTitle}>Network mismatch</div>
      <div className={styles.alertText}>
        Please switch your wallet network to <strong>Base Sepolia</strong> (chainId {targetChainId}).
      </div>
      {switchError && <div className={styles.alertText}>Wallet error: {switchError}</div>}
      <button type="button" className={styles.alertButton} onClick={onSwitch} disabled={isSwitching}>
        {isSwitching ? "Switching..." : "Switch to Base Sepolia"}
      </button>
    </div>
  );
}
