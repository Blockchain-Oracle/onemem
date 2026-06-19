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

/** Parse a `--metadata` JSON object flag into a plain record (or undefined). */
export function parseMetadata(raw: string | undefined): Record<string, unknown> | undefined {
  if (raw === undefined) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `--metadata must be valid JSON: ${error instanceof Error ? error.message : ""}`,
    );
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error('--metadata must be a JSON object, e.g. \'{"topic":"prefs"}\'');
  }
  return value as Record<string, unknown>;
}
