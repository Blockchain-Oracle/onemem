import type { SuiObjectChange, SuiTransactionBlockResponse } from "@mysten/sui/jsonRpc";

export interface MemWalLookupResponse {
  readonly ok: true;
  readonly owner: string;
  readonly network: "testnet" | "mainnet" | "devnet";
  readonly packageId: string;
  readonly registryId: string;
  readonly relayerUrl: string;
  readonly accountId: string | null;
}

interface ApiError {
  readonly ok: false;
  readonly code?: string;
  readonly error?: string;
}

export type ExecuteResult = {
  readonly digest?: string;
  readonly effects?: { readonly bcs?: string } | string;
  readonly rawEffects?: readonly number[];
};

export function shortId(value: string | null | undefined): string {
  if (!value) return "none";
  return value.length > 22 ? `${value.slice(0, 12)}...${value.slice(-8)}` : value;
}

export function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(value: string): Uint8Array {
  const hex = value.startsWith("0x") ? value.slice(2) : value;
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) {
    throw new Error("invalid hex private key");
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function digestFromExecuteResult(result: ExecuteResult): string {
  if (typeof result.digest === "string" && result.digest.length > 0) return result.digest;
  throw new Error("Wallet execution did not return a transaction digest.");
}

export function findCreatedObject(
  tx: SuiTransactionBlockResponse,
  objectTypeSuffix: string,
): string {
  const changes = (tx.objectChanges ?? []) as SuiObjectChange[];
  const created = changes.find(
    (change) =>
      change.type === "created" &&
      "objectType" in change &&
      typeof change.objectType === "string" &&
      change.objectType.endsWith(objectTypeSuffix) &&
      "objectId" in change &&
      typeof change.objectId === "string",
  );
  if (!created || !("objectId" in created) || typeof created.objectId !== "string") {
    throw new Error(`Transaction did not create ${objectTypeSuffix}.`);
  }
  return created.objectId;
}

export async function fetchMemWalAccount(owner: string): Promise<MemWalLookupResponse> {
  const res = await fetch(`/api/cli-login/memwal-account?owner=${encodeURIComponent(owner)}`);
  const data = (await res.json()) as MemWalLookupResponse | ApiError;
  if (!res.ok || data.ok !== true) {
    throw new Error((data as ApiError).error ?? `MemWal account lookup returned ${res.status}`);
  }
  return data as MemWalLookupResponse;
}
