"use client";

import { useMemo, useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { HTLC_CONTRACT_ADDRESS, htlcAbi, secretStringToHex } from "../_shared";

type StatusTone = "error" | "status";

type TxStage = "broadcast complete" | "included in a block";

export function useClaimModel() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [claimLockId, setClaimLockId] = useState<string>("");
  const [claimSecretPlain, setClaimSecretPlain] = useState<string>("");

  const [status, setStatus] = useState<string>("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const [txHash, setTxHash] = useState<`0x${string}` | "">("");
  const [txStage, setTxStage] = useState<TxStage>("broadcast complete");

  const explorerUrl = txHash ? `https://sepolia.basescan.org/tx/${txHash}` : "";

  const preflightError = useMemo(() => {
    if (isClaiming) return "";
    if (!isConnected) return "Connect your wallet first.";
    if (!publicClient) return "Public client not available.";
    if (!claimLockId.trim()) return "LockId is required.";
    try {
      BigInt(claimLockId);
    } catch {
      return "LockId must be an integer.";
    }
    if (!claimSecretPlain.trim()) return "Secret is required.";
    return "";
  }, [isClaiming, isConnected, publicClient, claimLockId, claimSecretPlain]);

  const statusDisplay = useMemo(() => {
    if (status) return status;
    return preflightError;
  }, [status, preflightError]);

  const statusTone: StatusTone = useMemo(() => {
    if (status) return statusIsError ? "error" : "status";
    if (preflightError) return "error";
    return "status";
  }, [status, statusIsError, preflightError]);

  const isReadyToClaim = useMemo(() => {
    if (!isConnected) return false;
    if (!publicClient) return false;
    if (!claimLockId.trim()) return false;
    if (!claimSecretPlain.trim()) return false;
    try {
      BigInt(claimLockId);
    } catch {
      return false;
    }
    return true;
  }, [isConnected, publicClient, claimLockId, claimSecretPlain]);

  async function handleClaim() {
    if (isClaiming) return;

    setStatus("");
    setStatusIsError(false);
    setTxHash("");

    if (!isConnected) {
      setStatus("Connect your wallet first.");
      setStatusIsError(true);
      return;
    }
    if (!publicClient) {
      setStatus("Public client not available.");
      setStatusIsError(true);
      return;
    }
    if (!claimSecretPlain.trim()) {
      setStatus("Secret is required.");
      setStatusIsError(true);
      return;
    }
    if (!claimLockId.trim()) {
      setStatus("LockId is required.");
      setStatusIsError(true);
      return;
    }

    let id: bigint;
    try {
      id = BigInt(claimLockId);
    } catch {
      setStatus("LockId must be an integer.");
      setStatusIsError(true);
      return;
    }

    setIsClaiming(true);
    try {
      setStatus("Submitting transaction...");
      setStatusIsError(false);

      const secretHex = secretStringToHex(claimSecretPlain);
      const hash = await writeContractAsync({
        address: HTLC_CONTRACT_ADDRESS,
        abi: htlcAbi,
        functionName: "claim",
        args: [id, secretHex],
      });
      setTxHash(hash);
      setTxStage("broadcast complete");
      setStatus("Tx broadcast complete.");
      setStatusIsError(false);

      await publicClient.waitForTransactionReceipt({ hash });
      setTxStage("included in a block");
      setStatus("Tx included in a block.");
      setStatusIsError(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(msg);
      setStatusIsError(true);
    } finally {
      setIsClaiming(false);
    }
  }

  return {
    claimLockId,
    setClaimLockId,
    claimSecretPlain,
    setClaimSecretPlain,
    statusDisplay,
    statusTone,
    isReadyToClaim,
    isClaiming,
    handleClaim,
    txHash,
    txStage,
    explorerUrl,
  };
}
