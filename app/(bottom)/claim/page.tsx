"use client";

import { useMemo, useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import styles from "../styles.module.css";
import { HTLC_CONTRACT_ADDRESS, htlcAbi, secretStringToHex } from "../_shared";

export default function ClaimPage() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [claimLockId, setClaimLockId] = useState<string>("");
  const [claimSecretPlain, setClaimSecretPlain] = useState<string>("");
  const [claimStatus, setClaimStatus] = useState<string>("");
  const [claimStatusIsError, setClaimStatusIsError] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<`0x${string}` | "">("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  const explorerUrl = claimTxHash ? `https://sepolia.basescan.org/tx/${claimTxHash}` : "";

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
    if (claimStatus) return claimStatus;
    return preflightError;
  }, [claimStatus, preflightError]);

  const statusLineClassName = useMemo(() => {
    if (claimStatus) return claimStatusIsError ? styles.error : styles.status;
    if (preflightError) return styles.error;
    return styles.status;
  }, [claimStatus, claimStatusIsError, preflightError]);

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

    try {
      setClaimStatus("");
      setClaimStatusIsError(false);
      setClaimTxHash("");
      setIsConfirmed(false);

      if (!isConnected) {
        setClaimStatus("Connect your wallet first.");
        setClaimStatusIsError(true);
        return;
      }
      if (!publicClient) {
        setClaimStatus("Public client not available.");
        setClaimStatusIsError(true);
        return;
      }
      if (!claimSecretPlain.trim()) {
        setClaimStatus("Secret is required.");
        setClaimStatusIsError(true);
        return;
      }
      if (!claimLockId.trim()) {
        setClaimStatus("LockId is required.");
        setClaimStatusIsError(true);
        return;
      }

      let id: bigint;
      try {
        id = BigInt(claimLockId);
      } catch {
        setClaimStatus("LockId must be an integer.");
        setClaimStatusIsError(true);
        return;
      }

      setClaimStatus("Submitting transaction...");
      setClaimStatusIsError(false);

      setIsClaiming(true);
      const secretHex = secretStringToHex(claimSecretPlain);
      const txHash = await writeContractAsync({
        address: HTLC_CONTRACT_ADDRESS,
        abi: htlcAbi,
        functionName: "claim",
        args: [id, secretHex],
      });
      setClaimTxHash(txHash);
      setClaimStatus("Tx broadcast complete.");
      setClaimStatusIsError(false);
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setIsConfirmed(true);
      setClaimStatus("Tx included in a block.");
      setClaimStatusIsError(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setClaimStatus(msg);
      setClaimStatusIsError(true);
    } finally {
      setIsClaiming(false);
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Claim</h1>
      <p className={styles.subtitle}>
        Enter lockId and secret.
        <br />
        Anyone can claim after unlock.
      </p>

      <div className={styles.subtitle}>
        <strong>LockId</strong>
        <div>The ID created on the Deposit page.</div>
      </div>
      <input
        className={styles.input}
        value={claimLockId}
        onChange={(e) => setClaimLockId(e.target.value)}
        placeholder="LockId (e.g. 1)"
      />

      <div className={styles.subtitle}>
        <strong>Secret</strong>
        <div>The plain text secret used on the Deposit page.</div>
      </div>
      <input
        className={styles.input}
        value={claimSecretPlain}
        onChange={(e) => setClaimSecretPlain(e.target.value)}
        placeholder="Secret (plain text)"
      />

      <button
        type="button"
        className={styles.button}
        onClick={handleClaim}
        disabled={!isReadyToClaim || isClaiming}
      >
        {isClaiming ? "Processing..." : "Claim"}
      </button>

      {statusDisplay && (
        <p className={statusLineClassName}>
          <strong>Status:</strong> {statusDisplay}
        </p>
      )}

      {claimTxHash && (
        <p className={styles.status}>
          <strong>Claim Tx:</strong> {" "}
          {isConfirmed ? "included in a block" : "broadcast complete"}: {" "}
          <a href={explorerUrl} target="_blank" rel="noreferrer">
            View on explorer
          </a>
        </p>
      )}
    </div>
  );
}
