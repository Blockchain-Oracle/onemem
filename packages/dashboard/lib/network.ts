// The Sui network the dashboard reports (display/links only). Memory itself is
// stored on MemWal; this is just the network label surfaced in the UI.

export type SuiNetwork = "testnet" | "mainnet" | "devnet" | "local";

const VALID: readonly SuiNetwork[] = ["testnet", "mainnet", "devnet", "local"];

function resolve(): SuiNetwork {
  const env = process.env.ONEMEM_NETWORK;
  return env && (VALID as readonly string[]).includes(env) ? (env as SuiNetwork) : "testnet";
}

export const NETWORK: SuiNetwork = resolve();
