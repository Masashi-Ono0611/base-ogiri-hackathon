"use client";

import styles from "../../styles/bottom.module.css";
import { useMemo, useState } from "react";
import { useDepositModel } from "./useDepositModel";
import { BASE_CHAIN_NAME, CBBTC_BASE_MAINNET } from "../../constants/onchain";
import { useHtlcContractAddress } from "../../hooks/useHtlcContractAddress";
import PdfClient from "../pdf/PdfClient";
import { toPrintDocumentData } from "../pdf/usePdfModel";

export default function DepositClient() {
  const { contractAddress: htlcContractAddress } = useHtlcContractAddress();
  const m = useDepositModel({ htlcContractAddress });
  const [printError, setPrintError] = useState<string>("");
  const [debugPrintData, setDebugPrintData] = useState<ReturnType<typeof toPrintDocumentData> | null>(null);

  const hasPrintableLock = useMemo(() => {
    if (!m.createdLock) return false;
    return /^\d+$/.test(m.createdLock.lockId);
  }, [m.createdLock]);

  const pdfDraft = useMemo(() => {
    if (!hasPrintableLock || !m.createdLock) return null;
    return {
      contractAddress: htlcContractAddress,
      lockId: m.createdLock.lockId,
      chainName: BASE_CHAIN_NAME,
      tokenAddress: CBBTC_BASE_MAINNET,
      amount: m.createdLock.amountInput,
      unlockAtLocal: m.createdLock.unlockAtLocal,
      hashlock: m.createdLock.hashlock,
    };
  }, [hasPrintableLock, m.createdLock, htlcContractAddress]);

  const printData = useMemo(() => {
    if (!pdfDraft) return null;
    return toPrintDocumentData(pdfDraft);
  }, [pdfDraft]);

  const activePrintData = debugPrintData ?? printData;

  const ctaDisabled = hasPrintableLock ? false : !m.isReadyToDeposit || m.isDepositing;
  const ctaLabel = hasPrintableLock
    ? "Print document (PDF)"
    : m.isDepositing
      ? "Processing..."
      : "Approve & Lock";

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

  const handleDebugPrint = () => {
    setPrintError("");

    const unlockAt = (() => {
      const d = new Date(Date.now() + 60 * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    })();
    const placeholderDraft = {
      contractAddress: htlcContractAddress || "0x0000000000000000000000000000000000000000",
      lockId: "0",
      chainName: BASE_CHAIN_NAME,
      tokenAddress: CBBTC_BASE_MAINNET,
      amount: "0.00001",
      unlockAtLocal: unlockAt,
      hashlock: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };

    const data = toPrintDocumentData(placeholderDraft);
    setDebugPrintData(data);

    try {
      console.log("[debug] PDF print button clicked", { placeholderDraft });
      window.print();
      console.log("[debug] window.print() finished");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPrintError(msg);
    }
  };

  return (
    <div className={styles.card}>
        <h1 className={styles.title}>Lock</h1>

        <div className={`${styles.subtitle} ${styles.fieldLabel}`}>
          <strong>💰 Lock amount (cbBTC)</strong>
        </div>
        <input
          className={styles.input}
          value={m.amountInput}
          onChange={(e) => m.setAmountInput(e.target.value)}
          placeholder="cbBTC amount to lock (e.g. 0.00001)"
        />

        <div className={`${styles.subtitle} ${styles.fieldLabel}`}>
          <strong>🕰️ Unlock datetime (local)</strong>
        </div>
        <input
          className={styles.input}
          type="datetime-local"
          value={m.unlockAtLocal}
          onChange={(e) => m.setUnlockAtLocal(e.target.value)}
        />

        <div className={`${styles.subtitle} ${styles.fieldLabel}`}>
          <strong>🔑 Secret</strong>
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

        <details className={`${styles.subtitle} ${styles.detailsRight}`}>
          <summary>Details</summary>
          <div>
            Chain: <span className={styles.mono}>{BASE_CHAIN_NAME}</span>
          </div>
          <div>
            Token: <span className={styles.mono}>{CBBTC_BASE_MAINNET}</span>
          </div>
          <div>
            Contract: <span className={styles.mono}>{htlcContractAddress || "(loading...)"}</span>
          </div>
          <div>
            Secret bytes: <span className={styles.mono}>{m.secretHex}</span>
          </div>
          <div>
            Hashlock: <span className={styles.mono}>{m.hashlock}</span>
          </div>
          <div>
            UnlockTime: <span className={styles.mono}>{m.unlockTime.toString()}</span>
          </div>
          {m.unlockDateText && (
            <div>
              Unlock (local time): <span className={styles.mono}>{m.unlockDateText}</span>
            </div>
          )}
        </details>

        <button
          type="button"
          className={styles.button}
          onClick={handlePrimaryCta}
          disabled={ctaDisabled}
        >
          {ctaLabel}
        </button>

        <button type="button" className={styles.button} onClick={handleDebugPrint}>
          Debug: Print document (PDF)
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

        <PdfClient data={activePrintData} />
      </div>
  );
}
