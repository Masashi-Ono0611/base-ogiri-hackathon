"use client";

import { useEffect, useMemo, useState } from "react";
import { HTLC_CONTRACT_ADDRESS, USDC_BASE_SEPOLIA } from "../_shared";

type StatusTone = "error" | "status";

export type PdfDraft = {
  contractAddress: string;
  lockId: string;
  chainName: string;
  tokenAddress: string;
  amount: string;
  unlockAtLocal: string;
  hashlock: string;
};

const STORAGE_KEY = "pdfDraft";

const DOCUMENT_TITLE = "相続に関する書面（参考）";

function safeParseDraft(raw: string | null): PdfDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PdfDraft>;
    if (!parsed.lockId) return null;
    return {
      contractAddress: String(parsed.contractAddress || ""),
      lockId: String(parsed.lockId || ""),
      chainName: String(parsed.chainName || "Base Sepolia"),
      tokenAddress: String(parsed.tokenAddress || USDC_BASE_SEPOLIA),
      amount: String(parsed.amount || ""),
      unlockAtLocal: String(parsed.unlockAtLocal || ""),
      hashlock: String(parsed.hashlock || ""),
    };
  } catch {
    return null;
  }
}

export type UsePdfModelOptions = {
  draft?: Partial<PdfDraft> | null;
  readFromStorage?: boolean;
};

export function usePdfModel(options: UsePdfModelOptions = {}) {
  const { draft, readFromStorage = true } = options;

  const [contractAddress, setContractAddress] = useState<string>(HTLC_CONTRACT_ADDRESS);
  const [lockId, setLockId] = useState<string>("");
  const [chainName, setChainName] = useState<string>("Base Sepolia");
  const [tokenAddress, setTokenAddress] = useState<string>(USDC_BASE_SEPOLIA);
  const [amount, setAmount] = useState<string>("");
  const [unlockAtLocal, setUnlockAtLocal] = useState<string>("");
  const [hashlock, setHashlock] = useState<string>("");

  const [status, setStatus] = useState<string>("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [hasAttemptedPrint, setHasAttemptedPrint] = useState(false);

  useEffect(() => {
    if (draft) {
      setContractAddress(String(draft.contractAddress || HTLC_CONTRACT_ADDRESS));
      setLockId(String(draft.lockId || ""));
      setChainName(String(draft.chainName || "Base Sepolia"));
      setTokenAddress(String(draft.tokenAddress || USDC_BASE_SEPOLIA));
      setAmount(String(draft.amount || ""));
      setUnlockAtLocal(String(draft.unlockAtLocal || ""));
      setHashlock(String(draft.hashlock || ""));
      return;
    }

    if (!readFromStorage) return;

    const stored = safeParseDraft(localStorage.getItem(STORAGE_KEY));
    if (!stored) return;

    setContractAddress(stored.contractAddress || HTLC_CONTRACT_ADDRESS);
    setLockId(stored.lockId);
    setChainName(stored.chainName || "Base Sepolia");
    setTokenAddress(stored.tokenAddress || USDC_BASE_SEPOLIA);
    setAmount(stored.amount);
    setUnlockAtLocal(stored.unlockAtLocal);
    setHashlock(stored.hashlock);
  }, [draft, readFromStorage]);

  const unlockDateText = useMemo(() => {
    if (!unlockAtLocal) return "";
    const ms = new Date(unlockAtLocal).getTime();
    if (!Number.isFinite(ms)) return unlockAtLocal;
    return new Date(ms).toLocaleString();
  }, [unlockAtLocal]);

  const preflightError = useMemo(() => {
    if (!lockId.trim()) return "LockId is required. Create a lock on the Deposit page first.";
    if (!contractAddress.trim()) return "Contract address is required.";
    if (!hashlock.trim()) return "Hashlock is required.";
    if (!amount.trim()) return "Amount is required.";
    if (!unlockAtLocal.trim()) return "Unlock datetime is required.";
    return "";
  }, [lockId, contractAddress, hashlock, amount, unlockAtLocal]);

  const statusDisplay = useMemo(() => {
    if (status) return status;
    if (!hasAttemptedPrint) return "";
    return preflightError;
  }, [status, preflightError, hasAttemptedPrint]);

  const statusTone: StatusTone = useMemo(() => {
    if (status) return statusIsError ? "error" : "status";
    if (preflightError) return "error";
    return "status";
  }, [status, statusIsError, preflightError]);

  function handlePrint() {
    setHasAttemptedPrint(true);
    setStatus("");
    setStatusIsError(false);

    if (preflightError) {
      setStatus(preflightError);
      setStatusIsError(true);
      return;
    }

    try {
      window.print();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(msg);
      setStatusIsError(true);
    }
  }

  return {
    documentTitle: DOCUMENT_TITLE,

    isReadyToPrint: !preflightError,

    contractAddress,
    lockId,
    chainName,
    tokenAddress,
    amount,
    unlockAtLocal,
    hashlock,
    unlockDateText,

    statusDisplay,
    statusTone,
    handlePrint,
  };
}
