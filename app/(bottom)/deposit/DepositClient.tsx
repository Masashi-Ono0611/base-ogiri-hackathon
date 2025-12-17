"use client";

import styles from "../styles.module.css";
import { useEffect, useState } from "react";
import { useDepositModel } from "./useDepositModel";
import PdfClient from "../pdf/PdfClient";
import { HTLC_CONTRACT_ADDRESS, USDC_BASE_SEPOLIA } from "../_shared";

export default function DepositClient() {
  const [mounted, setMounted] = useState(false);
  const m = useDepositModel();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const hasValidLockId = Boolean(m.lockId && /^\d+$/.test(m.lockId));
  const pdfDraft = hasValidLockId
    ? {
        contractAddress: HTLC_CONTRACT_ADDRESS,
        lockId: m.lockId,
        chainName: "Base Sepolia",
        tokenAddress: USDC_BASE_SEPOLIA,
        amount: m.amountInput,
        unlockAtLocal: m.unlockAtLocal,
        hashlock: m.hashlock,
      }
    : null;

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Deposit</h1>
      <div className={styles.subtitle}>Approve USDC and create a timelocked hashlock.</div>
      <div className={styles.subtitle}>
        <strong>USDC amount</strong>
        <div>How much USDC will be locked in the contract.</div>
      </div>
      <input
        className={styles.input}
        value={m.amountInput}
        onChange={(e) => m.setAmountInput(e.target.value)}
        placeholder="USDC amount to lock (e.g. 0.01)"
      />

      <div className={styles.subtitle}>
        <strong>Unlock datetime (local)</strong>
        <div>Claim becomes available at this time.</div>
      </div>
      <input
        className={styles.input}
        type="datetime-local"
        value={m.unlockAtLocal}
        onChange={(e) => m.setUnlockAtLocal(e.target.value)}
      />

      <div className={styles.subtitle}>
        <strong>Secret</strong>
        <div>
          Enter any phrase.
          <br />
          Required to claim. If leaked, anyone can claim after unlock.
        </div>
      </div>
      <div className={styles.inputRow}>
        <input
          className={`${styles.input} ${styles.inputGrow}`}
          value={m.secretPlain}
          onChange={(e) => m.setSecretPlain(e.target.value)}
          placeholder="Secret (plain text)"
        />
        <button type="button" className={styles.autoButton} onClick={m.autoFillSecret}>
          Auto
        </button>
      </div>

      <details className={styles.subtitle}>
        <summary>Details</summary>
        <div>
          UnlockTime: <span className={styles.mono}>{m.unlockTime.toString()}</span>
        </div>
        {m.unlockDateText && (
          <div>
            Unlock (local): <span className={styles.mono}>{m.unlockDateText}</span>
          </div>
        )}
        <div>
          Secret bytes: <span className={styles.mono}>{m.secretHex}</span>
        </div>
        <div>
          Hashlock: <span className={styles.mono}>{m.hashlock}</span>
        </div>
      </details>

      <button
        type="button"
        className={styles.button}
        onClick={m.handleDeposit}
        disabled={!m.isReadyToDeposit || m.isDepositing}
      >
        {m.isDepositing ? "Processing..." : "Approve + Create Lock"}
      </button>

      {m.statusDisplay && (
        <p className={m.statusTone === "error" ? styles.error : styles.status}>
          <strong>Status:</strong> {m.statusDisplay}
        </p>
      )}

      {m.createTxHash && (
        <p className={styles.status}>
          <strong>CreateLock Tx:</strong> {m.createTxStage}: {" "}
          <a href={m.createExplorerUrl} target="_blank" rel="noreferrer">
            View on explorer
          </a>
        </p>
      )}

      {m.approveTxHash && (
        <p className={styles.status}>
          <strong>Approve Tx:</strong> {m.approveTxStage}: {" "}
          <a href={m.approveExplorerUrl} target="_blank" rel="noreferrer">
            View on explorer
          </a>
        </p>
      )}

      <PdfClient variant="step" draft={pdfDraft} readFromStorage={false} />
    </div>
  );
}
