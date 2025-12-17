import { toHex, type Hex } from "viem";

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
