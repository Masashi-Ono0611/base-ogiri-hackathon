"use client";

import styles from "../styles.module.css";
import { useEffect, useMemo, useState } from "react";
import { type PdfDraft, usePdfModel } from "./usePdfModel";

type Props = {
  variant?: "page" | "step" | "document";
  draft?: Partial<PdfDraft> | null;
  readFromStorage?: boolean;
};

export default function PdfClient({ variant = "page", draft = null, readFromStorage = true }: Props) {
  const [mounted, setMounted] = useState(false);
  const m = usePdfModel({ draft, readFromStorage });

  useEffect(() => {
    setMounted(true);
  }, []);

  const canPrint = useMemo(() => {
    if (!mounted) return false;
    return m.isReadyToPrint;
  }, [mounted, m.isReadyToPrint]);

  if (!mounted) return null;

  const showPageChrome = variant === "page";
  const showStepChrome = variant === "step";
  const showDocumentOnly = variant === "document";

  if (showDocumentOnly) {
    return (
      <div className={styles.printOnly}>
        <div className={styles.printDocument}>
          <h1 className={styles.printTitle}>{m.documentTitle}</h1>
          <p className={styles.printParagraph}>宛先（受取人）: ________________________________ 様</p>
          <p className={styles.printParagraph}>差出人（預入人）: ________________________________</p>

          <p className={styles.printParagraph}>
            私は、将来の相続に備え、下記の資産をロックし、所定の条件を満たした場合に受取人が請求できるようにしました。
          </p>
          <p className={styles.printParagraph}>
            受取人は、解除日時以降に、秘密の言葉（別紙/口頭/手書きで渡すもの）を用いて請求してください。
          </p>
          <p className={styles.printParagraph}>本書面は、私の意思を示すための参考文書です。</p>

          <h2 className={styles.printSectionTitle}>資産情報</h2>
          <p className={styles.printParagraph}>チェーン: {m.chainName}</p>
          <p className={styles.printParagraph}>トークン: {m.tokenAddress}</p>
          <p className={styles.printParagraph}>金額: {m.amount} USDC</p>

          <h2 className={styles.printSectionTitle}>ロック情報</h2>
          <p className={styles.printParagraph}>コントラクト: {m.contractAddress}</p>
          <p className={styles.printParagraph}>LockId: {m.lockId}</p>
          <p className={styles.printParagraph}>Hashlock: {m.hashlock}</p>
          <p className={styles.printParagraph}>解除日時: {m.unlockDateText}</p>

          <h2 className={styles.printSectionTitle}>秘密の言葉</h2>
          <p className={styles.printParagraph}>Secret (to be handwritten): ________________________________</p>

          <h2 className={styles.printSectionTitle}>署名</h2>
          <p className={styles.printParagraph}>署名: ________________________________</p>
          <p className={styles.printParagraph}>日付: ________________________________</p>
        </div>
      </div>
    );
  }

  const content = (
    <>
      {showPageChrome && <h1 className={styles.title}>PDF</h1>}
      {showPageChrome && (
        <p className={styles.subtitle}>
          No additional input is required.
          <br />
          Names, signature, date, and the secret are intended to be handwritten after printing.
        </p>
      )}

      {showStepChrome && (
        <>
          <button type="button" className={styles.button} onClick={m.handlePrint} disabled={!canPrint}>
            Print document (PDF)
          </button>

          {m.statusDisplay && (
            <p className={m.statusTone === "error" ? styles.error : styles.status}>
              {m.statusDisplay}
            </p>
          )}
        </>
      )}

      {showPageChrome && (
        <>
          <details className={styles.subtitle}>
            <summary>Lock details (auto-filled)</summary>
            <div>
              Contract: <span className={styles.mono}>{m.contractAddress || "(empty)"}</span>
            </div>
            <div>
              LockId: <span className={styles.mono}>{m.lockId || "(empty)"}</span>
            </div>
            <div>
              Token: <span className={styles.mono}>{m.tokenAddress || "(empty)"}</span>
            </div>
            <div>
              Amount: <span className={styles.mono}>{m.amount || "(empty)"}</span>
            </div>
            <div>
              Unlock (local): <span className={styles.mono}>{m.unlockDateText || "(empty)"}</span>
            </div>
            <div>
              Hashlock: <span className={styles.mono}>{m.hashlock || "(empty)"}</span>
            </div>
          </details>

          <button type="button" className={styles.button} onClick={m.handlePrint} disabled={!canPrint}>
            Print document (PDF)
          </button>

          {m.statusDisplay && (
            <p className={m.statusTone === "error" ? styles.error : styles.status}>
              {m.statusDisplay}
            </p>
          )}
        </>
      )}

      <div className={styles.printOnly}>
        <div className={styles.printDocument}>
          <h1 className={styles.printTitle}>{m.documentTitle}</h1>
          <p className={styles.printParagraph}>宛先（受取人）: ________________________________ 様</p>
          <p className={styles.printParagraph}>差出人（預入人）: ________________________________</p>

          <p className={styles.printParagraph}>
            私は、将来の相続に備え、下記の資産をロックし、所定の条件を満たした場合に受取人が請求できるようにしました。
          </p>
          <p className={styles.printParagraph}>
            受取人は、解除日時以降に、秘密の言葉（別紙/口頭/手書きで渡すもの）を用いて請求してください。
          </p>
          <p className={styles.printParagraph}>本書面は、私の意思を示すための参考文書です。</p>

          <h2 className={styles.printSectionTitle}>資産情報</h2>
          <p className={styles.printParagraph}>チェーン: {m.chainName}</p>
          <p className={styles.printParagraph}>トークン: {m.tokenAddress}</p>
          <p className={styles.printParagraph}>金額: {m.amount} USDC</p>

          <h2 className={styles.printSectionTitle}>ロック情報</h2>
          <p className={styles.printParagraph}>コントラクト: {m.contractAddress}</p>
          <p className={styles.printParagraph}>LockId: {m.lockId}</p>
          <p className={styles.printParagraph}>Hashlock: {m.hashlock}</p>
          <p className={styles.printParagraph}>解除日時: {m.unlockDateText}</p>

          <h2 className={styles.printSectionTitle}>秘密の言葉</h2>
          <p className={styles.printParagraph}>Secret (to be handwritten): ________________________________</p>

          <h2 className={styles.printSectionTitle}>署名</h2>
          <p className={styles.printParagraph}>署名: ________________________________</p>
          <p className={styles.printParagraph}>日付: ________________________________</p>
        </div>
      </div>
    </>
  );

  if (!showPageChrome) return content;

  return <div className={styles.card}>{content}</div>;
}
