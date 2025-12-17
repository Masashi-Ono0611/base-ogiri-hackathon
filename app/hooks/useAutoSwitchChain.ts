"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { type SupportedChainId } from "../constants/onchain";

type Result = {
  isWrongNetwork: boolean;
  switchError: string;
  isSwitching: boolean;
  switchToTargetChain: () => Promise<void>;
};

export function useAutoSwitchChain({ targetChainId }: { targetChainId: SupportedChainId }): Result {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const chainIdLiteral = targetChainId;

  const [switchError, setSwitchError] = useState<string>("");
  const [hasAttemptedAutoSwitch, setHasAttemptedAutoSwitch] = useState(false);

  const isWrongNetwork = useMemo(() => {
    if (!isConnected) return false;
    return chainId !== targetChainId;
  }, [isConnected, chainId, targetChainId]);

  useEffect(() => {
    let cancelled = false;

    async function maybeAutoSwitch() {
      if (!isWrongNetwork) return;
      if (hasAttemptedAutoSwitch) return;

      setHasAttemptedAutoSwitch(true);
      try {
        await switchChainAsync({ chainId: chainIdLiteral });
        if (!cancelled) setSwitchError("");
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        setSwitchError(msg);
      }
    }

    void maybeAutoSwitch();
    return () => {
      cancelled = true;
    };
  }, [isWrongNetwork, hasAttemptedAutoSwitch, switchChainAsync, targetChainId, chainIdLiteral]);

  const switchToTargetChain = async () => {
    try {
      setSwitchError("");
      await switchChainAsync({ chainId: chainIdLiteral });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setSwitchError(msg);
    }
  };

  return { isWrongNetwork, switchError, isSwitching, switchToTargetChain };
}
