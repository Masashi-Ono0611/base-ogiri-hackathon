"use client";

import styles from "../styles.module.css";
import { useClaimModel } from "./useClaimModel";

export default function ClaimClient() {
  const m = useClaimModel();

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Claim</h1>
      <p className={styles.subtitle}>
        Enter lockId and secret.
        <br />
        Anyone can claim after unlock.
      </p>

      <div className={styles.subtitle}>
        <strong>LockId</strong>
        <div>The ID created on the Deposit page.</div>
      </div>
      <input
        className={styles.input}
        value={m.claimLockId}
        onChange={(e) => m.setClaimLockId(e.target.value)}
        placeholder="LockId (e.g. 1)"
      />

      <div className={styles.subtitle}>
        <strong>Secret</strong>
        <div>The plain text secret used on the Deposit page.</div>
      </div>
      <input
        className={styles.input}
        value={m.claimSecretPlain}
        onChange={(e) => m.setClaimSecretPlain(e.target.value)}
        placeholder="Secret (plain text)"
      />

      <button
        type="button"
        className={styles.button}
        onClick={m.handleClaim}
        disabled={!m.isReadyToClaim || m.isClaiming}
      >
        {m.isClaiming ? "Processing..." : "Claim"}
      </button>

      {m.statusDisplay && (
        <p className={m.statusTone === "error" ? styles.error : styles.status}>
          <strong>Status:</strong> {m.statusDisplay}
        </p>
      )}

      {m.txHash && (
        <p className={styles.status}>
          <strong>Claim Tx:</strong> {m.txStage}: {" "}
          <a href={m.explorerUrl} target="_blank" rel="noreferrer">
            View on explorer
          </a>
        </p>
      )}
    </div>
  );
}
