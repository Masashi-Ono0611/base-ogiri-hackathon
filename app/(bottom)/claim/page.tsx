"use client";

import { useState } from "react";
import { type Hex } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import styles from "../styles.module.css";
import { HTLC_CONTRACT_ADDRESS, htlcAbi } from "../_shared";

export default function ClaimPage() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [claimLockId, setClaimLockId] = useState<string>("");
  const [claimSecret, setClaimSecret] = useState<Hex>(() => "0x" as Hex);
  const [claimStatus, setClaimStatus] = useState<string>("");

  async function handleClaim() {
    try {
      setClaimStatus("");

      if (!isConnected) {
        setClaimStatus("Connect your wallet first.");
        return;
      }
      if (!publicClient) {
        setClaimStatus("Public client not available.");
        return;
      }
      if (!claimSecret.startsWith("0x") || claimSecret.length !== 66) {
        setClaimStatus("Secret must be a 32-byte hex string (0x + 64 hex chars).");
        return;
      }
      if (!claimLockId.trim()) {
        setClaimStatus("LockId is required.");
        return;
      }

      let id: bigint;
      try {
        id = BigInt(claimLockId);
      } catch {
        setClaimStatus("LockId must be an integer.");
        return;
      }

      setClaimStatus("Submitting claim...");
      const txHash = await writeContractAsync({
        address: HTLC_CONTRACT_ADDRESS,
        abi: htlcAbi,
        functionName: "claim",
        args: [id, claimSecret],
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setClaimStatus("Claimed.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setClaimStatus(msg);
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
        <div>32-byte hex string (0x + 64 hex chars).</div>
      </div>
      <input
        className={styles.input}
        value={claimSecret}
        onChange={(e) => setClaimSecret(e.target.value as Hex)}
        placeholder="Secret (0x...)"
      />

      <button type="button" className={styles.button} onClick={handleClaim}>
        Claim
      </button>

      {claimStatus && <p className={styles.error}>{claimStatus}</p>}
    </div>
  );
}
