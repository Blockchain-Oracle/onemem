"use client";

import {
  createNetworkConfig,
  SuiClientProvider,
  useSuiClientContext,
  WalletProvider,
} from "@mysten/dapp-kit";
import {
  isEnokiNetwork,
  type RegisterEnokiWalletsOptions,
  registerEnokiWallets,
} from "@mysten/enoki";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

const { networkConfig } = createNetworkConfig({
  testnet: { url: "https://fullnode.testnet.sui.io:443" },
  mainnet: { url: "https://fullnode.mainnet.sui.io:443" },
  devnet: { url: "https://fullnode.devnet.sui.io:443" },
});

const configuredNetwork = process.env.NEXT_PUBLIC_SUI_NETWORK;
const defaultNetwork =
  configuredNetwork === "mainnet" || configuredNetwork === "devnet" ? configuredNetwork : "testnet";

const enokiApiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY ?? "";
const googleClientId =
  process.env.NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export interface HostedAuthConfig {
  readonly defaultNetwork: "testnet" | "mainnet" | "devnet";
  readonly enokiConfigured: boolean;
  readonly enokiMissing: readonly string[];
}

const HostedAuthConfigContext = createContext<HostedAuthConfig | null>(null);

export function useHostedAuthConfig(): HostedAuthConfig {
  const value = useContext(HostedAuthConfigContext);
  if (!value) throw new Error("HostedAuthConfigContext is missing");
  return value;
}

export function HostedProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const config = useMemo<HostedAuthConfig>(() => {
    const missing = [
      enokiApiKey ? null : "NEXT_PUBLIC_ENOKI_API_KEY",
      googleClientId ? null : "NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID",
    ].filter((value): value is string => value !== null);

    return {
      defaultNetwork,
      enokiConfigured: missing.length === 0,
      enokiMissing: missing,
    };
  }, []);

  return (
    <HostedAuthConfigContext.Provider value={config}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork={defaultNetwork}>
          <RegisterEnokiWallets config={config} />
          <WalletProvider autoConnect>{children}</WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </HostedAuthConfigContext.Provider>
  );
}

function RegisterEnokiWallets({ config }: { config: HostedAuthConfig }) {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    if (!config.enokiConfigured || !isEnokiNetwork(network)) return;

    const { unregister } = registerEnokiWallets({
      apiKey: enokiApiKey,
      providers: {
        google: {
          clientId: googleClientId,
        },
      },
      client: client as unknown as RegisterEnokiWalletsOptions["client"],
      network,
    });

    return unregister;
  }, [client, config.enokiConfigured, network]);

  return null;
}
