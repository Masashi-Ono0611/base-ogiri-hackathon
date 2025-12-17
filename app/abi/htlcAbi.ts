import { type Abi } from "viem";

export const htlcAbi = [
  {
    type: "function",
    name: "MIN_COMMIT_DELAY_BLOCKS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
  },
  {
    type: "function",
    name: "getLock",
    stateMutability: "view",
    inputs: [{ name: "lockId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "depositor", type: "address" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "hashlock", type: "bytes32" },
          { name: "unlockTime", type: "uint64" },
          { name: "claimed", type: "bool" },
        ],
      },
    ],
  },
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
    name: "commit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "lockId", type: "uint256" },
      { name: "commitment", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "revealAndClaim",
    stateMutability: "nonpayable",
    inputs: [
      { name: "lockId", type: "uint256" },
      { name: "secret", type: "bytes" },
      { name: "salt", type: "bytes" },
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
  {
    type: "event",
    name: "LockCommitted",
    inputs: [
      { name: "lockId", type: "uint256", indexed: true },
      { name: "committer", type: "address", indexed: true },
      { name: "commitment", type: "bytes32", indexed: false },
      { name: "commitBlock", type: "uint64", indexed: false },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "LockClaimed",
    inputs: [
      { name: "lockId", type: "uint256", indexed: true },
      { name: "claimer", type: "address", indexed: true },
    ],
    anonymous: false,
  },
] as const satisfies Abi;
