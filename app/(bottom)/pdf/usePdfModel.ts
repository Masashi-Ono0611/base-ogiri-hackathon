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
  const unlockDateText = Number.isFinite(ms) ? new Date(ms).toLocaleString() : draft.unlockAtLocal;

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
