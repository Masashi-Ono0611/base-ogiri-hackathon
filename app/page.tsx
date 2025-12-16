"use client";
import { useEffect, useMemo, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from "@coinbase/onchainkit/wallet";
import { Address, Avatar, EthBalance, Identity, Name } from "@coinbase/onchainkit/identity";
import { decodeEventLog, keccak256, parseUnits, type Hex } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import styles from "./page.module.css";

const HTLC_CONTRACT_ADDRESS = "0x5260a97eDaA53eF5edA4094f514Ef9973C310eD7" as const;
const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
const USDC_DECIMALS = 6;

const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const htlcAbi = [
  {
    type: "function",
    name: "createLock",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "hashlock", type: "bytes32" },
      { name: "unlockTime", type: "uint64" },
    ],
    outputs: [{ name: "lockId", type: "uint256" }],
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "lockId", type: "uint256" },
      { name: "secret", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "event",
    name: "LockCreated",
    inputs: [
      { name: "lockId", type: "uint256", indexed: true },
      { name: "depositor", type: "address", indexed: true },
      { name: "token", type: "address", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "hashlock", type: "bytes32", indexed: false },
      { name: "unlockTime", type: "uint64", indexed: false },
    ],
    anonymous: false,
  },
] as const;

function randomHex(bytesLength: number): Hex {
  const bytes = new Uint8Array(bytesLength);
  crypto.getRandomValues(bytes);
  return (`0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`) as Hex;
}

export default function Home() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [amountInput, setAmountInput] = useState("0.01");
  const [unlockDelayMinutes, setUnlockDelayMinutes] = useState("1");
  const [secret, setSecret] = useState<Hex>(() => "0x" as Hex);
  const [hashlock, setHashlock] = useState<Hex>(() => "0x" as Hex);
  const [lockId, setLockId] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const [claimLockId, setClaimLockId] = useState<string>("");
  const [claimSecret, setClaimSecret] = useState<Hex>(() => "0x" as Hex);
  const [claimStatus, setClaimStatus] = useState<string>("");

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [isFrameReady, setFrameReady]);

  useEffect(() => {
    if (secret.startsWith("0x") && secret.length === 66) {
      setHashlock(keccak256(secret));
    } else {
      setHashlock("0x" as Hex);
    }
  }, [secret]);

  const unlockTime = useMemo(() => {
    const minutes = Number(unlockDelayMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return BigInt(0);
    const now = BigInt(Math.floor(Date.now() / 1000));
    return now + BigInt(Math.floor(minutes * 60));
  }, [unlockDelayMinutes]);

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

      if (!secret.startsWith("0x") || secret.length !== 66) {
        setStatus("Secret must be a 32-byte hex string (0x + 64 hex chars). Use Generate.");
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
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.waitlistForm}>
          <h1 className={styles.title}>Token Inheritance</h1>
          <p className={styles.subtitle}>
            Base Sepolia / USDC / HTLC Timelock
            <br />
            Contract: <code>{HTLC_CONTRACT_ADDRESS}</code>
          </p>

          <div className={styles.form}>
            <Wallet>
              <ConnectWallet disconnectedLabel="Connect Wallet" className={styles.joinButton}>
                <Avatar className="h-6 w-6" />
                <Name />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>

            <div style={{ height: 16 }} />

            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Deposit (Lock)</h2>

            <input
              className={styles.emailInput}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="Amount in USDC (e.g. 0.01)"
            />

            <input
              className={styles.emailInput}
              value={unlockDelayMinutes}
              onChange={(e) => setUnlockDelayMinutes(e.target.value)}
              placeholder="Unlock in minutes (e.g. 1)"
            />

            <div style={{ width: "100%" }}>
              <button
                type="button"
                className={styles.joinButton}
                onClick={() => setSecret(randomHex(32))}
                style={{ width: "100%" }}
              >
                Generate Secret
              </button>
            </div>

            <input
              className={styles.emailInput}
              value={secret}
              onChange={(e) => setSecret(e.target.value as Hex)}
              placeholder="Secret (0x...)"
            />
            <p className={styles.subtitle} style={{ fontSize: 12, marginBottom: 0 }}>
              Hashlock: <code>{hashlock}</code>
              <br />
              UnlockTime: <code>{unlockTime.toString()}</code>
            </p>

            <button type="button" className={styles.joinButton} onClick={handleDeposit}>
              Approve + Create Lock
            </button>
            {status && <p className={styles.error}>{status}</p>}
            {lockId && <p className={styles.subtitle}>LockId: {lockId}</p>}

            <div style={{ height: 24 }} />

            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Claim</h2>
            <input
              className={styles.emailInput}
              value={claimLockId}
              onChange={(e) => setClaimLockId(e.target.value)}
              placeholder="LockId (e.g. 1)"
            />
            <input
              className={styles.emailInput}
              value={claimSecret}
              onChange={(e) => setClaimSecret(e.target.value as Hex)}
              placeholder="Secret (0x...)"
            />
            <button type="button" className={styles.joinButton} onClick={handleClaim}>
              Claim
            </button>
            {claimStatus && <p className={styles.error}>{claimStatus}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
