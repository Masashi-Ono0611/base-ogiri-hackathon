"use client";

import { useMemo } from "react";
import { HTLC_CONTRACT_ADDRESS } from "../constants/onchain";

type Result = {
  contractAddress: `0x${string}`;
  isLoading: false;
  error: "";
};

export function useHtlcContractAddress(): Result {
  return useMemo(
    () => ({
      contractAddress: HTLC_CONTRACT_ADDRESS,
      isLoading: false,
      error: "",
    }),
    []
  );
}
