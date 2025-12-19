"use client";

import { useMemo, useState } from "react";
import { encodePacked, keccak256, type Hex } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { BASE_EXPLORER_BASE_URL } from "../../constants/onchain";
import { htlcAbi } from "../../abi/htlcAbi";
import { randomHex, secretStringToHex } from "../../lib/crypto";
import { useHtlcContractAddress } from "../../hooks/useHtlcContractAddress";

type StatusTone = "error" | "status";

type TxStage = "broadcast complete" | "included in a block";

export function useClaimModel() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const { contractAddress: htlcContractAddress } = useHtlcContractAddress();

  const [claimLockId, setClaimLockId] = useState<string>("");
  const [claimSecretPlain, setClaimSecretPlain] = useState<string>("");

  const [saltHex, setSaltHex] = useState<Hex>("0x" as Hex);
  const [commitBlockNumber, setCommitBlockNumber] = useState<bigint | null>(null);

  const [status, setStatus] = useState<string>("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  const [commitTxHash, setCommitTxHash] = useState<`0x${string}` | "">("");
  const [commitTxStage, setCommitTxStage] = useState<TxStage>("broadcast complete");

  const [revealTxHash, setRevealTxHash] = useState<`0x${string}` | "">("");
  const [revealTxStage, setRevealTxStage] = useState<TxStage>("broadcast complete");

  const commitExplorerUrl = commitTxHash ? `${BASE_EXPLORER_BASE_URL}/tx/${commitTxHash}` : "";
  const revealExplorerUrl = revealTxHash ? `${BASE_EXPLORER_BASE_URL}/tx/${revealTxHash}` : "";

  const preflightError = useMemo(() => {
    if (isClaiming) return "";
    if (!isConnected) return "Connect your wallet first.";
    if (!publicClient) return "Public client not available.";
    if (!htlcContractAddress) return "Contract address not available.";
    if (!claimLockId.trim()) return "LockId is required.";
    try {
      BigInt(claimLockId);
    } catch {
      return "LockId must be an integer.";
    }
    if (!claimSecretPlain.trim()) return "Secret is required.";
    return "";
  }, [isClaiming, isConnected, publicClient, htlcContractAddress, claimLockId, claimSecretPlain]);

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
    if (!htlcContractAddress) return false;
    if (!claimLockId.trim()) return false;
    if (!claimSecretPlain.trim()) return false;
    try {
      BigInt(claimLockId);
    } catch {
      return false;
    }
    return true;
  }, [isConnected, publicClient, htlcContractAddress, claimLockId, claimSecretPlain]);

  const lockIdBigInt = useMemo(() => {
    try {
      return BigInt(claimLockId);
    } catch {
      return null;
    }
  }, [claimLockId]);

  const canReveal = useMemo(() => {
    if (!commitBlockNumber) return false;
    if (!saltHex || saltHex === ("0x" as Hex)) return false;
    if (!isReadyToClaim) return false;
    return true;
  }, [commitBlockNumber, saltHex, isReadyToClaim]);

  const primaryButtonLabel = useMemo(() => {
    if (isClaiming) return "Processing...";
    if (!commitBlockNumber) return "Unlock Commit";
    return "Reveal & Withdraw";
  }, [isClaiming, commitBlockNumber]);

  const isPrimaryActionDisabled = useMemo(() => {
    if (isClaiming) return true;
    if (!commitBlockNumber) return !isReadyToClaim;
    return !canReveal;
  }, [isClaiming, commitBlockNumber, isReadyToClaim, canReveal]);

  async function loadTimelockInfo(id: bigint) {
    if (!publicClient || !htlcContractAddress) throw new Error("Client not available.");
    const lock = (await publicClient.readContract({
      address: htlcContractAddress,
      abi: htlcAbi,
      functionName: "getLock",
      args: [id],
    })) as any;
    const unlockTime = BigInt(lock.unlockTime);
    const latest = await publicClient.getBlock();
    const now = BigInt(latest.timestamp);
    return { unlockTime, now, claimed: Boolean(lock.claimed) };
  }

  async function handleCommit() {
    if (isClaiming) return;
    if (!isReadyToClaim) return;
    if (!lockIdBigInt) return;
    if (!htlcContractAddress) return;
    if (!address) return;

    setStatus("");
    setStatusIsError(false);
    setCommitTxHash("");
    setCommitTxStage("broadcast complete");

    setIsClaiming(true);
    try {
      const info = await loadTimelockInfo(lockIdBigInt);
      if (info.claimed) {
        setStatus("This lock is already claimed.");
        setStatusIsError(true);
        return;
      }
      if (info.now < info.unlockTime) {
        const unlockLocal = new Date(Number(info.unlockTime) * 1000).toLocaleString();
        setStatus(`Timelock not expired yet. UnlockTime: ${info.unlockTime.toString()} Local time: ${unlockLocal}`);
        setStatusIsError(true);
        return;
      }

      const generatedSalt = randomHex(32);
      setSaltHex(generatedSalt);

      const secretHex = secretStringToHex(claimSecretPlain);
      const commitment = keccak256(
        encodePacked(["uint256", "address", "bytes", "bytes"], [lockIdBigInt, address, secretHex, generatedSalt])
      );

      setStatus("Submitting commit...");
      setStatusIsError(false);

      const hash = await writeContractAsync({
        address: htlcContractAddress,
        abi: htlcAbi,
        functionName: "commit",
        args: [lockIdBigInt, commitment],
      });
      setCommitTxHash(hash);
      setCommitTxStage("broadcast complete");
      setStatus("Commit broadcast complete.");
      setStatusIsError(false);

      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      setCommitBlockNumber(receipt.blockNumber);
      setCommitTxStage("included in a block");
      setStatus("Commit included in a block.");
      setStatusIsError(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(msg);
      setStatusIsError(true);
    } finally {
      setIsClaiming(false);
    }
  }

  async function handlePrimaryAction() {
    if (commitBlockNumber) {
      await handleRevealAndClaim();
      return;
    }
    await handleCommit();
  }

  async function handleRevealAndClaim() {
    if (isClaiming) return;
    if (!canReveal) return;
    if (!lockIdBigInt) return;
    if (!htlcContractAddress) return;

    setStatus("");
    setStatusIsError(false);
    setRevealTxHash("");
    setRevealTxStage("broadcast complete");

    setIsClaiming(true);
    try {
      const info = await loadTimelockInfo(lockIdBigInt);
      if (info.claimed) {
        setStatus("This lock is already claimed.");
        setStatusIsError(true);
        return;
      }
      if (info.now < info.unlockTime) {
        const unlockLocal = new Date(Number(info.unlockTime) * 1000).toLocaleString();
        setStatus(`Timelock not expired yet. UnlockTime: ${info.unlockTime.toString()} Unlock (local): ${unlockLocal}`);
        setStatusIsError(true);
        return;
      }

      const minDelay = (await publicClient!.readContract({
        address: htlcContractAddress,
        abi: htlcAbi,
        functionName: "MIN_COMMIT_DELAY_BLOCKS",
      })) as bigint;

      const target = commitBlockNumber! + minDelay;
      while (true) {
        const current = await publicClient!.getBlockNumber();
        if (current >= target) break;
        setStatus(`Waiting for commit delay... currentBlock=${current.toString()} targetBlock=${target.toString()}`);
        setStatusIsError(false);
        await new Promise((r) => setTimeout(r, 3_000));
      }

      setStatus("Submitting reveal...");
      setStatusIsError(false);

      const secretHex = secretStringToHex(claimSecretPlain);
      const hash = await writeContractAsync({
        address: htlcContractAddress,
        abi: htlcAbi,
        functionName: "revealAndClaim",
        args: [lockIdBigInt, secretHex, saltHex],
      });
      setRevealTxHash(hash);
      setRevealTxStage("broadcast complete");
      setStatus("Reveal broadcast complete.");
      setStatusIsError(false);

      await publicClient!.waitForTransactionReceipt({ hash });
      setRevealTxStage("included in a block");
      setStatus("Claim included in a block.");
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
    saltHex,
    commitBlockNumber,
    statusDisplay,
    statusTone,
    isReadyToClaim,
    isClaiming,
    handleCommit,
    handleRevealAndClaim,
    handlePrimaryAction,
    primaryButtonLabel,
    isPrimaryActionDisabled,
    canReveal,
    revealTxHash,
    revealTxStage,
    revealExplorerUrl,
    commitTxHash,
    commitTxStage,
    commitExplorerUrl,
  };
}
