"use client";

import { USDC_BASE_SEPOLIA } from "../../constants/onchain";
import { type PrintDocumentData } from "./PrintDocument";

export type PdfDraft = {
  contractAddress: string;
  lockId: string;
  chainName: string;
  tokenAddress: string;
  amount: string;
  unlockAtLocal: string;
  hashlock: string;
};

export const DOCUMENT_TITLE = "贈与契約書（デジタル資産ロック）";

export function toPrintDocumentData(draft: PdfDraft): PrintDocumentData {
  const ms = new Date(draft.unlockAtLocal).getTime();
  const unlockDate = Number.isFinite(ms) ? new Date(ms) : null;
  const tzOffsetMin = unlockDate ? -unlockDate.getTimezoneOffset() : null;
  const tz = (() => {
    if (tzOffsetMin === null) return "";
    const sign = tzOffsetMin >= 0 ? "+" : "-";
    const abs = Math.abs(tzOffsetMin);
    const hh = String(Math.floor(abs / 60)).padStart(2, "0");
    const mm = String(abs % 60).padStart(2, "0");
    return `UTC${sign}${hh}:${mm}`;
  })();
  const unlockDateTextBase = unlockDate ? unlockDate.toLocaleString() : draft.unlockAtLocal;
  const unlockDateText = tz ? `${unlockDateTextBase} (${tz})` : unlockDateTextBase;

  return {
    documentTitle: DOCUMENT_TITLE,
    chainName: draft.chainName || "Base Sepolia",
    tokenAddress: draft.tokenAddress || USDC_BASE_SEPOLIA,
    amount: draft.amount,
    contractAddress: draft.contractAddress,
    lockId: draft.lockId,
    hashlock: draft.hashlock,
    unlockDateText,
  };
}
