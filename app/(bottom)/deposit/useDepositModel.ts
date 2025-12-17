"use client";

import { useEffect, useMemo, useState } from "react";
import { decodeEventLog, keccak256, parseUnits, type Hex, type Log } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import {
  USDC_BASE_SEPOLIA,
  USDC_DECIMALS,
  erc20Abi,
  generateHumanSecret,
  htlcAbi,
  secretStringToHex,
} from "../_shared";

function formatDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

type StatusTone = "error" | "status";

type TxStage = "broadcast complete" | "included in a block";

type CreatedLock = {
  lockId: string;
  amountInput: string;
  unlockAtLocal: string;
  hashlock: Hex;
};

type Params = {
  htlcContractAddress: `0x${string}` | "";
};

export function useDepositModel({ htlcContractAddress }: Params) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [amountInput, setAmountInput] = useState("0.01");
  const [unlockAtLocal, setUnlockAtLocal] = useState<string>("");
  const [secretPlain, setSecretPlain] = useState<string>("");

  const [lockId, setLockId] = useState<string>("");
  const [createdLock, setCreatedLock] = useState<CreatedLock | null>(null);
  const [status, setStatus] = useState<string>("");
  const [statusIsError, setStatusIsError] = useState(false);

  const [isDepositing, setIsDepositing] = useState(false);

  const [approveTxHash, setApproveTxHash] = useState<`0x${string}` | "">("");
  const [approveTxStage, setApproveTxStage] = useState<TxStage>("broadcast complete");

  const [createTxHash, setCreateTxHash] = useState<`0x${string}` | "">("");
  const [createTxStage, setCreateTxStage] = useState<TxStage>("broadcast complete");

  const approveExplorerUrl = approveTxHash ? `https://sepolia.basescan.org/tx/${approveTxHash}` : "";
  const createExplorerUrl = createTxHash ? `https://sepolia.basescan.org/tx/${createTxHash}` : "";

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

  const preflightError = useMemo(() => {
    if (isDepositing) return "";
    if (!isConnected || !address) return "Connect your wallet first.";
    if (!publicClient) return "Public client not available.";
    if (!htlcContractAddress) return "Contract address not available.";
    if (!amountInput.trim()) return "Amount is required.";

    try {
      const amount = parseUnits(amountInput, USDC_DECIMALS);
      if (amount <= BigInt(0)) return "Amount must be > 0";
    } catch {
      return "Amount is invalid.";
    }

    if (!unlockAtLocal) return "Unlock datetime is required.";
    if (unlockTime <= BigInt(Math.floor(Date.now() / 1000))) return "Unlock time must be in the future.";
    if (!secretPlain.trim()) return "Secret is required. Enter a phrase you will remember.";
    return "";
  }, [isDepositing, isConnected, address, publicClient, htlcContractAddress, amountInput, unlockAtLocal, unlockTime, secretPlain]);

  const statusDisplay = useMemo(() => {
    if (!status && !lockId) return preflightError;
    const base = status || preflightError;
    if (!lockId) return base;
    return `${base}${base ? " " : ""}(LockId: ${lockId})`;
  }, [status, lockId, preflightError]);

  const statusTone: StatusTone = useMemo(() => {
    if (status) return statusIsError ? "error" : "status";
    if (preflightError) return "error";
    return "status";
  }, [status, statusIsError, preflightError]);

  const isReadyToDeposit = useMemo(() => {
    if (!isConnected || !address) return false;
    if (!publicClient) return false;
    if (!htlcContractAddress) return false;
    if (!secretPlain.trim()) return false;
    if (!unlockAtLocal) return false;
    if (unlockTime <= BigInt(Math.floor(Date.now() / 1000))) return false;

    try {
      const amount = parseUnits(amountInput, USDC_DECIMALS);
      if (amount <= BigInt(0)) return false;
    } catch {
      return false;
    }

    return true;
  }, [isConnected, address, publicClient, htlcContractAddress, secretPlain, unlockAtLocal, unlockTime, amountInput]);

  const autoFillSecret = () => setSecretPlain(generateHumanSecret());

  async function handleDeposit() {
    if (isDepositing) return;

    setStatus("");
    setStatusIsError(false);
    setLockId("");
    setCreatedLock(null);
    setApproveTxHash("");
    setCreateTxHash("");

    if (!isConnected || !address) {
      setStatus("Connect your wallet first.");
      setStatusIsError(true);
      return;
    }
    if (!publicClient) {
      setStatus("Public client not available.");
      setStatusIsError(true);
      return;
    }
    if (!htlcContractAddress) {
      setStatus("Contract address not available.");
      setStatusIsError(true);
      return;
    }
    if (!secretPlain.trim()) {
      setStatus("Secret is required. Enter a phrase you will remember.");
      setStatusIsError(true);
      return;
    }

    let amount: bigint;
    try {
      amount = parseUnits(amountInput, USDC_DECIMALS);
    } catch {
      setStatus("Amount is invalid.");
      setStatusIsError(true);
      return;
    }
    if (amount <= BigInt(0)) {
      setStatus("Amount must be > 0");
      setStatusIsError(true);
      return;
    }
    if (unlockTime <= BigInt(Math.floor(Date.now() / 1000))) {
      setStatus("Unlock time must be in the future.");
      setStatusIsError(true);
      return;
    }

    setIsDepositing(true);
    try {
      setStatus("Approving USDC...");
      setStatusIsError(false);
      const approveHash = await writeContractAsync({
        address: USDC_BASE_SEPOLIA,
        abi: erc20Abi,
        functionName: "approve",
        args: [htlcContractAddress, amount],
      });
      setApproveTxHash(approveHash);
      setApproveTxStage("broadcast complete");
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      setApproveTxStage("included in a block");

      setStatus("Creating lock...");
      setStatusIsError(false);
      const createHash = await writeContractAsync({
        address: htlcContractAddress,
        abi: htlcAbi,
        functionName: "createLock",
        args: [USDC_BASE_SEPOLIA, amount, hashlock as Hex, unlockTime],
      });
      setCreateTxHash(createHash);
      setCreateTxStage("broadcast complete");
      const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
      setCreateTxStage("included in a block");

      const created = receipt.logs.find((l: Log) => l.address.toLowerCase() === htlcContractAddress.toLowerCase());
      if (created) {
        try {
          const decoded = decodeEventLog({
            abi: htlcAbi,
            data: created.data,
            topics: created.topics,
          });
          if (decoded.eventName === "LockCreated") {
            const createdLockId = (decoded.args.lockId as bigint).toString();
            setLockId(createdLockId);

            setCreatedLock({
              lockId: createdLockId,
              amountInput,
              unlockAtLocal,
              hashlock: hashlock as Hex,
            });
          }
        } catch {
          setLockId("(created; failed to decode LockCreated)");
        }
      }

      setStatus("Lock created.");
      setStatusIsError(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(msg);
      setStatusIsError(true);
    } finally {
      setIsDepositing(false);
    }
  }

  return {
    amountInput,
    setAmountInput,
    unlockAtLocal,
    setUnlockAtLocal,
    secretPlain,
    setSecretPlain,
    lockId,
    createdLock,
    unlockTime,
    unlockDateText,
    secretHex,
    hashlock,
    isReadyToDeposit,
    isDepositing,
    autoFillSecret,
    handleDeposit,
    statusDisplay,
    statusTone,
    approveTxHash,
    approveTxStage,
    createTxHash,
    createTxStage,
    approveExplorerUrl,
    createExplorerUrl,
  };
}
