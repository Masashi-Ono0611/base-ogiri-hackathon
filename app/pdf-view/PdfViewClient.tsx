"use client";

import { useEffect, useMemo, useState } from "react";
import { PrintDocument } from "../(bottom)/pdf/PrintDocument";
import styles from "../styles/bottom.module.css";
import { toPrintDocumentData, type PdfDraft } from "../(bottom)/pdf/usePdfModel";

function decodeDataFromHash(): PdfDraft | null {
  const raw = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(raw);
  const data = params.get("data");
  if (!data) return null;

  try {
    const json = decodeURIComponent(data);
    const parsed = JSON.parse(json) as Partial<PdfDraft>;

    if (
      !parsed.contractAddress ||
      !parsed.lockId ||
      !parsed.amount ||
      !parsed.unlockAtLocal ||
      !parsed.hashlock
    ) {
      return null;
    }

    return {
      contractAddress: String(parsed.contractAddress),
      lockId: String(parsed.lockId),
      chainName: String(parsed.chainName ?? ""),
      tokenAddress: String(parsed.tokenAddress ?? ""),
      amount: String(parsed.amount),
      unlockAtLocal: String(parsed.unlockAtLocal),
      hashlock: String(parsed.hashlock),
    };
  } catch {
    return null;
  }
}

export default function PdfViewClient() {
  const [draft, setDraft] = useState<PdfDraft | null>(null);

  useEffect(() => {
    setDraft(decodeDataFromHash());
  }, []);

  const printData = useMemo(() => {
    if (!draft) return null;
    return toPrintDocumentData(draft);
  }, [draft]);

  return (
    <div className={styles.content}>
      <div className={styles.card}>
        {!printData ? (
          <>
            <p className={styles.error}>Missing required parameters.</p>
            <p className={styles.status}>
              <strong>Hint:</strong> This page expects <span className={styles.mono}>#data=</span> in the URL hash.
            </p>
          </>
        ) : (
          <PrintDocument {...printData} />
        )}
      </div>
    </div>
  );
}
