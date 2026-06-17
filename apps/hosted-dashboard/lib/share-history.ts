import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { type NamespaceCapabilityHistoryRow, OneMem, type SuiNetwork } from "@onemem/sdk-ts";

export const SHARE_HISTORY_NETWORK: SuiNetwork =
  (process.env.ONEMEM_NETWORK as SuiNetwork) || "testnet";

export class ShareHistoryValidationError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ShareHistoryValidationError";
  }
}

interface ShareHistoryReader {
  getCapabilityHistory(namespaceId: string): Promise<NamespaceCapabilityHistoryRow[]>;
}

export interface ShareHistoryResult {
  readonly ok: true;
  readonly namespaceId: string;
  readonly network: SuiNetwork;
  readonly rows: readonly NamespaceCapabilityHistoryRow[];
}

export async function loadShareHistory(
  input: { readonly namespaceId: string; readonly network?: string | null },
  deps: { readonly reader?: ShareHistoryReader } = {},
): Promise<ShareHistoryResult> {
  const namespaceId = input.namespaceId.trim();
  if (!isSuiObjectId(namespaceId)) {
    throw new ShareHistoryValidationError(
      "invalid_namespace_id",
      "namespaceId must be a 0x-prefixed 32-byte Sui object ID",
    );
  }

  const network = resolveShareHistoryNetwork(input.network);
  const reader = deps.reader ?? (await readOnlyClient(network)).namespaces;
  const rows = await reader.getCapabilityHistory(namespaceId);
  return { ok: true, namespaceId, network, rows };
}

export function resolveShareHistoryNetwork(value: string | null | undefined): SuiNetwork {
  if (!value) return SHARE_HISTORY_NETWORK;
  if (value === "testnet" || value === "mainnet" || value === "devnet" || value === "local") {
    return value;
  }
  throw new ShareHistoryValidationError(
    "invalid_network",
    "network must be testnet, mainnet, devnet, or local",
  );
}

export function isSuiObjectId(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

async function readOnlyClient(network: SuiNetwork): Promise<OneMem> {
  return OneMem.create({ network, signer: Ed25519Keypair.generate() });
}
