// Boundary validation for user-supplied CLI input. `resolveNetwork` trusts an
// explicit value, so a typo like `--network mannet` would otherwise slip through;
// validate it here where the user can be told exactly what's wrong.

import type { SuiNetwork } from "@onemem/sdk-ts";

const NETWORKS: SuiNetwork[] = ["testnet", "mainnet", "devnet", "local"];

export function parseNetwork(raw: string | undefined): SuiNetwork | undefined {
  if (raw === undefined) return undefined;
  if (!NETWORKS.includes(raw as SuiNetwork)) {
    throw new Error(`unknown network "${raw}" — expected one of: ${NETWORKS.join(", ")}`);
  }
  return raw as SuiNetwork;
}

export function parseTopK(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) throw new Error("--top-k must be a positive integer");
  return n;
}
