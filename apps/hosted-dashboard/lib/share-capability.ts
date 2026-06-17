import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import {
  addressesFor,
  type NamespaceCapabilityDetails,
  namespaceCapabilityFromSuiObject,
  type SuiNetwork,
} from "@onemem/sdk-ts";

export const SHARE_CAPABILITY_NETWORK: SuiNetwork =
  (process.env.ONEMEM_NETWORK as SuiNetwork) || "testnet";

interface ShareCapabilityRpc {
  getObject(input: {
    readonly id: string;
    readonly options: {
      readonly showType?: true;
      readonly showContent?: true;
      readonly showOwner?: true;
    };
  }): Promise<{ readonly data?: ShareObjectData | null }>;
}

interface ShareObjectData {
  readonly type?: string;
  readonly content?: unknown;
  readonly owner?: unknown;
}

interface NamespaceFields {
  readonly owner?: unknown;
  readonly name?: unknown;
  readonly kind?: unknown;
  readonly active?: unknown;
}

export interface ShareCapabilityNamespace {
  readonly id: string;
  readonly owner: string;
  readonly name: string;
  readonly kind: number;
  readonly active: boolean;
}

export interface ShareCapabilityData {
  readonly network: SuiNetwork;
  readonly capability: NamespaceCapabilityDetails;
  readonly namespace: ShareCapabilityNamespace | null;
  readonly namespaceError: string | null;
  readonly suiscanCapability: string;
  readonly suiscanNamespace: string;
}

export interface ShareCapabilityNotFound {
  readonly ok: false;
  readonly network: SuiNetwork;
  readonly capabilityId: string;
  readonly error: string;
  readonly suiscanCapability: string;
}

export type ShareCapabilityLoadResult =
  | { readonly ok: true; readonly data: ShareCapabilityData }
  | ShareCapabilityNotFound;

export async function loadShareCapability(
  capabilityId: string,
  deps: { readonly rpc?: ShareCapabilityRpc; readonly network?: SuiNetwork } = {},
): Promise<ShareCapabilityLoadResult> {
  const network = deps.network ?? SHARE_CAPABILITY_NETWORK;
  const addresses = addressesFor(network);
  const rpc = deps.rpc ?? new SuiJsonRpcClient({ network, url: addresses.rpcUrl });
  const suiscanCapability = suiscanObject(network, capabilityId);

  let capability: NamespaceCapabilityDetails;
  try {
    const obj = await rpc.getObject({
      id: capabilityId,
      options: { showType: true, showContent: true, showOwner: true },
    });
    capability = namespaceCapabilityFromSuiObject(capabilityId, obj.data);
  } catch (err) {
    return {
      ok: false,
      network,
      capabilityId,
      error: err instanceof Error ? err.message : String(err),
      suiscanCapability,
    };
  }

  let namespace: ShareCapabilityNamespace | null = null;
  let namespaceError: string | null = null;
  try {
    const ns = await rpc.getObject({
      id: capability.namespaceId,
      options: { showContent: true },
    });
    namespace = parseNamespace(capability.namespaceId, ns.data?.content);
  } catch (err) {
    namespaceError = err instanceof Error ? err.message : String(err);
  }

  return {
    ok: true,
    data: {
      network,
      capability,
      namespace,
      namespaceError,
      suiscanCapability,
      suiscanNamespace: suiscanObject(network, capability.namespaceId),
    },
  };
}

export function namespaceKindLabel(kind: number): string {
  if (kind === 0) return "User";
  if (kind === 1) return "Agent";
  if (kind === 2) return "Org";
  if (kind === 3) return "Session";
  if (kind === 4) return "Shared";
  return `Unknown(${kind})`;
}

export function holderSelfRevokeCommand(
  capabilityId: string,
  kind: NamespaceCapabilityDetails["kind"],
): string {
  const suffix = kind === "Admin" ? " --allow-admin" : "";
  return `onemem namespace revoke ${capabilityId}${suffix}`;
}

function parseNamespace(namespaceId: string, content: unknown): ShareCapabilityNamespace {
  const object = content as { readonly dataType?: string; readonly fields?: NamespaceFields };
  if (object?.dataType !== "moveObject" || !object.fields) {
    throw new Error(`No MemoryNamespace found at ${namespaceId}`);
  }
  return {
    id: namespaceId,
    owner: String(object.fields.owner ?? ""),
    name: String(object.fields.name ?? ""),
    kind: Number(object.fields.kind ?? 0),
    active: object.fields.active !== false,
  };
}

function suiscanObject(network: SuiNetwork, objectId: string): string {
  return `https://suiscan.xyz/${network}/object/${objectId}`;
}
