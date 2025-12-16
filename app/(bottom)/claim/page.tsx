"use client";

import { useState } from "react";
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
      if (!claimSecretPlain.trim()) {
        setClaimStatus("Secret is required.");
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
      const secretHex = secretStringToHex(claimSecretPlain);
      const txHash = await writeContractAsync({
        address: HTLC_CONTRACT_ADDRESS,
        abi: htlcAbi,
        functionName: "claim",
        args: [id, secretHex],
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
        <div>The plain text secret used on the Deposit page.</div>
      </div>
      <input
        className={styles.input}
        value={claimSecretPlain}
        onChange={(e) => setClaimSecretPlain(e.target.value)}
        placeholder="Secret (plain text)"
      />

      <button type="button" className={styles.button} onClick={handleClaim}>
        Claim
      </button>

      {claimStatus && <p className={styles.error}>{claimStatus}</p>}
    </div>
  );
}
