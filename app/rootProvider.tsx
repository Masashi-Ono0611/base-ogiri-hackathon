"use client";
import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { MiniKitProvider } from "@coinbase/onchainkit/minikit";
import "@coinbase/onchainkit/styles.css";
import { config } from "./wagmi";

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <OnchainKitProvider
      apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
      chain={baseSepolia}
      config={{
        appearance: {
          mode: "auto",
        },
        wallet: {
          display: "modal",
          preference: "all",
        },
      }}
      miniKit={{
        enabled: true,
        autoConnect: true,
        notificationProxyUrl: undefined,
      }}
    >
      <MiniKitProvider
        {...({
          apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY,
          chain: baseSepolia,
          config: {
            appearance: {
              mode: "auto",
            },
          },
        } as any)}
      >
        <WagmiProvider config={config}>{children}</WagmiProvider>
      </MiniKitProvider>
    </OnchainKitProvider>
  );
}
