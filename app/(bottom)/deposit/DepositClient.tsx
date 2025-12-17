"use client";

import styles from "../styles.module.css";
import { useMemo, useState } from "react";
import { useDepositModel } from "./useDepositModel";
import { USDC_BASE_SEPOLIA } from "../_shared";
import { useHtlcContractAddress } from "../useHtlcContractAddress";
import PdfClient from "../pdf/PdfClient";
import { toPrintDocumentData } from "../pdf/usePdfModel";

export default function DepositClient() {
  const { contractAddress: htlcContractAddress } = useHtlcContractAddress();
  const m = useDepositModel({ htlcContractAddress });
  const [printError, setPrintError] = useState<string>("");

  const hasPrintableLock = useMemo(() => {
    if (!m.createdLock) return false;
    return /^\d+$/.test(m.createdLock.lockId);
  }, [m.createdLock]);

  const pdfDraft = useMemo(() => {
    if (!hasPrintableLock || !m.createdLock) return null;
    return {
      contractAddress: htlcContractAddress,
      lockId: m.createdLock.lockId,
      chainName: "Base Sepolia",
      tokenAddress: USDC_BASE_SEPOLIA,
      amount: m.createdLock.amountInput,
      unlockAtLocal: m.createdLock.unlockAtLocal,
      hashlock: m.createdLock.hashlock,
    };
  }, [hasPrintableLock, m.createdLock, htlcContractAddress]);

  const printData = useMemo(() => {
    if (!pdfDraft) return null;
    return toPrintDocumentData(pdfDraft);
  }, [pdfDraft]);

  const ctaDisabled = hasPrintableLock ? false : !m.isReadyToDeposit || m.isDepositing;
  const ctaLabel = hasPrintableLock
    ? "Print document (PDF)"
    : m.isDepositing
      ? "Processing..."
      : "Approve + Create Lock";

  const handlePrimaryCta = async () => {
    setPrintError("");
    if (!hasPrintableLock) {
      await m.handleDeposit();
      return;
    }

    try {
      window.print();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPrintError(msg);
    }
  };

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
        onClick={handlePrimaryCta}
        disabled={ctaDisabled}
      >
        {ctaLabel}
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

      {printError && <p className={styles.error}>{printError}</p>}

      <PdfClient data={printData} />
    </div>
  );
}
