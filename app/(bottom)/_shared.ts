import { toHex, type Abi, type Hex } from "viem";

export const HTLC_CONTRACT_ADDRESS = "0x5260a97eDaA53eF5edA4094f514Ef9973C310eD7" as const;
export const USDC_BASE_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;
export const USDC_DECIMALS = 6;

export const erc20Abi = [
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
] as const satisfies Abi;

export const htlcAbi = [
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
] as const satisfies Abi;

export function randomHex(bytesLength: number): Hex {
  const bytes = new Uint8Array(bytesLength);
  crypto.getRandomValues(bytes);
  return (`0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`) as Hex;
}

export function secretStringToHex(secret: string): Hex {
  const trimmed = secret.trim();
  if (!trimmed) return "0x" as Hex;
  if (trimmed.startsWith("0x")) return trimmed as Hex;
  return toHex(trimmed) as Hex;
}

export function generateHumanSecret(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const binary = String.fromCharCode(...Array.from(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
