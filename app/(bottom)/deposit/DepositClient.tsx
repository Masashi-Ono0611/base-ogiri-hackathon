"use client";

import styles from "../../styles/bottom.module.css";
import { useMemo, useState } from "react";
import { useDepositModel } from "./useDepositModel";
import { BASE_CHAIN_NAME, CBBTC_BASE_MAINNET } from "../../constants/onchain";
import { useHtlcContractAddress } from "../../hooks/useHtlcContractAddress";
import PdfClient from "../pdf/PdfClient";
import { toPrintDocumentData } from "../pdf/usePdfModel";
import { useOpenUrl } from "@coinbase/onchainkit/minikit";

export default function DepositClient() {
  const openUrl = useOpenUrl();
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
      if (!pdfDraft) {
        setPrintError("Printable lock data is not available.");
        return;
      }

      if (!pdfDraft.contractAddress) {
        setPrintError("Contract address is not available yet.");
        return;
      }

      const missing = [
        !pdfDraft.contractAddress ? "contractAddress" : "",
        !pdfDraft.lockId ? "lockId" : "",
        !pdfDraft.amount ? "amount" : "",
        !pdfDraft.unlockAtLocal ? "unlockAtLocal" : "",
        !pdfDraft.hashlock ? "hashlock" : "",
      ].filter(Boolean);
      if (missing.length) {
        setPrintError(`Printable lock data is incomplete: ${missing.join(", ")}`);
        return;
      }

      const url = new URL("/pdf-view", window.location.origin);
      const payload = encodeURIComponent(JSON.stringify(pdfDraft));
      url.hash = `data=${payload}`;

      console.log("[pdf] openUrl for production PDF", { url: url.toString() });
      openUrl(url.toString());
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
