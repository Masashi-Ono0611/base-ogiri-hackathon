"use client";

import styles from "../../styles/bottom.module.css";
import { useClaimModel } from "./useClaimModel";
import { USDC_BASE_SEPOLIA } from "../../constants/onchain";
import { useHtlcContractAddress } from "../../hooks/useHtlcContractAddress";

export default function ClaimClient() {
  const m = useClaimModel();
  const { contractAddress: htlcContractAddress } = useHtlcContractAddress();

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Claim</h1>
      <p className={styles.subtitle}>
        Enter lockId and secret.
        <br />
        After the timelock expires, you will first submit a commit transaction, then reveal & claim.
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

      <details className={styles.subtitle}>
        <summary>Details</summary>
        <div>
          Chain: <span className={styles.mono}>Base Sepolia</span>
        </div>
        <div>
          Token: <span className={styles.mono}>{USDC_BASE_SEPOLIA}</span>
        </div>
        <div>
          Contract: <span className={styles.mono}>{htlcContractAddress || "(loading...)"}</span>
        </div>
        {m.commitBlockNumber && (
          <div>
            Commit block: <span className={styles.mono}>{m.commitBlockNumber.toString()}</span>
          </div>
        )}
        {m.saltHex && m.saltHex !== ("0x" as `0x${string}`) && (
          <div>
            Salt: <span className={styles.mono}>{m.saltHex}</span>
          </div>
        )}
      </details>

      <button
        type="button"
        className={styles.button}
        onClick={m.handlePrimaryAction}
        disabled={m.isPrimaryActionDisabled}
      >
        {m.primaryButtonLabel}
      </button>

      {m.statusDisplay && (
        <p className={m.statusTone === "error" ? styles.error : styles.status}>
          <strong>Status:</strong> {m.statusDisplay}
        </p>
      )}

      {m.revealTxHash && (
        <p className={styles.status}>
          <strong>Reveal &amp; Claim Tx:</strong> {m.revealTxStage}: {" "}
          <a href={m.revealExplorerUrl} target="_blank" rel="noreferrer">
            View on explorer
          </a>
        </p>
      )}

      {m.commitTxHash && (
        <p className={styles.status}>
          <strong>Commit Tx:</strong> {m.commitTxStage}: {" "}
          <a href={m.commitExplorerUrl} target="_blank" rel="noreferrer">
            View on explorer
          </a>
        </p>
      )}
    </div>
  );
}
