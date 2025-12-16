"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, keccak256, parseUnits, type Hex } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import styles from "../styles.module.css";
import {
  HTLC_CONTRACT_ADDRESS,
  USDC_BASE_SEPOLIA,
  USDC_DECIMALS,
  erc20Abi,
  htlcAbi,
  generateHumanSecret,
  secretStringToHex,
} from "../_shared";

function formatDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function DepositPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [amountInput, setAmountInput] = useState("0.01");
  const [unlockAtLocal, setUnlockAtLocal] = useState<string>("");
  const [secretPlain, setSecretPlain] = useState<string>("");

  const [lockId, setLockId] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const secretHex = useMemo(() => secretStringToHex(secretPlain), [secretPlain]);
  const hashlock = useMemo(() => {
    if (secretHex === ("0x" as Hex)) return "0x" as Hex;
    return keccak256(secretHex);
  }, [secretHex]);

  useEffect(() => {
    if (!unlockAtLocal) {
      setUnlockAtLocal(formatDatetimeLocal(new Date(Date.now() + 10 * 60 * 1000)));
    }
  }, [unlockAtLocal]);

  const unlockTime = useMemo(() => {
    if (!unlockAtLocal) return BigInt(0);
    const ms = new Date(unlockAtLocal).getTime();
    if (!Number.isFinite(ms)) return BigInt(0);
    return BigInt(Math.floor(ms / 1000));
  }, [unlockAtLocal]);

  const unlockDateText = useMemo(() => {
    if (unlockTime <= BigInt(0)) return "";
    const ms = Number(unlockTime) * 1000;
    if (!Number.isFinite(ms)) return "";
    return new Date(ms).toLocaleString();
  }, [unlockTime]);

  async function handleDeposit() {
    try {
      setStatus("");
      setLockId("");

      if (!isConnected || !address) {
        setStatus("Connect your wallet first.");
        return;
      }
      if (!publicClient) {
        setStatus("Public client not available.");
        return;
      }
      if (!secretPlain.trim()) {
        setStatus("Secret is required. Enter a phrase you will remember.");
        return;
      }

      const amount = parseUnits(amountInput, USDC_DECIMALS);
      if (amount <= BigInt(0)) {
        setStatus("Amount must be > 0");
        return;
      }
      if (unlockTime <= BigInt(Math.floor(Date.now() / 1000))) {
        setStatus("Unlock time must be in the future.");
        return;
      }

      setStatus("Approving USDC...");
      const approveHash = await writeContractAsync({
        address: USDC_BASE_SEPOLIA,
        abi: erc20Abi,
        functionName: "approve",
        args: [HTLC_CONTRACT_ADDRESS, amount],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      setStatus("Creating lock...");
      const createHash = await writeContractAsync({
        address: HTLC_CONTRACT_ADDRESS,
        abi: htlcAbi,
        functionName: "createLock",
        args: [USDC_BASE_SEPOLIA, amount, hashlock as Hex, unlockTime],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash });

      const created = receipt.logs.find((l) => l.address.toLowerCase() === HTLC_CONTRACT_ADDRESS.toLowerCase());
      if (created) {
        try {
          const decoded = decodeEventLog({
            abi: htlcAbi,
            data: created.data,
            topics: created.topics,
          });
          if (decoded.eventName === "LockCreated") {
            setLockId((decoded.args.lockId as bigint).toString());
          }
        } catch {
          setLockId("(created; failed to decode LockCreated)");
        }
      }

      setStatus("Lock created.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(msg);
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Deposit</h1>
      <div className={styles.subtitle}>
        <strong>USDC amount</strong>
        <div>How much USDC will be locked in the contract.</div>
      </div>
      <input
        className={styles.input}
        value={amountInput}
        onChange={(e) => setAmountInput(e.target.value)}
        placeholder="USDC amount to lock (e.g. 0.01)"
      />

      <div className={styles.subtitle}>
        <strong>Unlock datetime (local)</strong>
        <div>Claim becomes available at this time.</div>
      </div>
      <input
        className={styles.input}
        type="datetime-local"
        value={unlockAtLocal}
        onChange={(e) => setUnlockAtLocal(e.target.value)}
      />

      <div className={styles.subtitle}>
        <strong>Secret</strong>
        <div>
          Enter any phrase.
          <br />
          Required to claim. If leaked, anyone can claim after unlock.
        </div>
      </div>
      <div className={styles.inputRow}>
        <input
          className={`${styles.input} ${styles.inputGrow}`}
          value={secretPlain}
          onChange={(e) => setSecretPlain(e.target.value)}
          placeholder="Secret (plain text)"
        />
        <button type="button" className={styles.autoButton} onClick={() => setSecretPlain(generateHumanSecret())}>
          Auto
        </button>
      </div>

      <details className={styles.subtitle}>
        <summary>Details</summary>
        <div>
          UnlockTime: <span className={styles.mono}>{unlockTime.toString()}</span>
        </div>
        {unlockDateText && (
          <div>
            Unlock (local): <span className={styles.mono}>{unlockDateText}</span>
          </div>
        )}
        <div>
          Secret bytes: <span className={styles.mono}>{secretHex}</span>
        </div>
        <div>
          Hashlock: <span className={styles.mono}>{hashlock}</span>
        </div>
      </details>

      <button type="button" className={styles.button} onClick={handleDeposit}>
        Approve + Create Lock
      </button>

      {status && <p className={styles.error}>{status}</p>}
      {lockId && (
        <p className={styles.subtitle}>
          LockId: <span className={styles.mono}>{lockId}</span>
        </p>
      )}
    </div>
  );
}
