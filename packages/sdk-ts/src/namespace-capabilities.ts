import type { CapKind, NamespaceCapability } from "./types/move.js";

export type NamespaceCapabilityOwnerKind =
  | "address"
  | "object"
  | "shared"
  | "immutable"
  | "consensus"
  | "unknown";

export interface NamespaceCapabilityOwner {
  readonly kind: NamespaceCapabilityOwnerKind;
  readonly address: string | null;
  readonly display: string;
}

export interface NamespaceCapabilityDetails<K extends CapKind = CapKind>
  extends NamespaceCapability<K> {
  readonly objectType: string;
  readonly ownerKind: NamespaceCapabilityOwnerKind;
  readonly ownerAddress: string | null;
  readonly ownerDisplay: string;
}

interface MoveObjectContent {
  readonly dataType?: string;
  readonly fields?: Record<string, unknown>;
}

interface SuiObjectData {
  readonly type?: string | null;
  readonly content?: unknown;
  readonly owner?: unknown;
}

export function capabilityKindFromObjectType(objectType: string): CapKind {
  const match = objectType.match(/::namespace::NamespaceCapability<([^>]+)>$/);
  const kind = match?.[1]?.split("::").at(-1);
  if (kind === "ReadOnly" || kind === "ReadWrite" || kind === "Admin") {
    return kind;
  }
  throw new Error(`object is not a OneMem NamespaceCapability: ${objectType}`);
}

export function suiOwnerSummary(owner: unknown): NamespaceCapabilityOwner {
  if (typeof owner === "string") {
    if (owner === "Immutable") return { kind: "immutable", address: null, display: owner };
    return { kind: "unknown", address: null, display: owner };
  }

  if (!owner || typeof owner !== "object") {
    return { kind: "unknown", address: null, display: "unknown" };
  }

  const record = owner as Record<string, unknown>;
  if (typeof record.AddressOwner === "string") {
    return { kind: "address", address: record.AddressOwner, display: record.AddressOwner };
  }
  if (typeof record.ObjectOwner === "string") {
    return { kind: "object", address: record.ObjectOwner, display: record.ObjectOwner };
  }
  if (record.Shared) {
    return { kind: "shared", address: null, display: "Shared" };
  }
  const consensus = record.ConsensusAddressOwner as Record<string, unknown> | undefined;
  if (consensus && typeof consensus.owner === "string") {
    return { kind: "consensus", address: consensus.owner, display: consensus.owner };
  }
  if (record.$kind === "Immutable") {
    return { kind: "immutable", address: null, display: "Immutable" };
  }

  return { kind: "unknown", address: null, display: JSON.stringify(owner) };
}

export function namespaceCapabilityFromSuiObject(
  capId: string,
  data: SuiObjectData | null | undefined,
): NamespaceCapabilityDetails {
  const objectType = data?.type;
  if (!objectType) {
    throw new Error(`No NamespaceCapability found at ${capId}`);
  }
  const kind = capabilityKindFromObjectType(objectType);
  const content = data.content as MoveObjectContent | undefined;
  if (content?.dataType !== "moveObject" || !content.fields) {
    throw new Error(`NamespaceCapability at ${capId} has no Move object fields`);
  }

  const namespaceId = idField(content.fields.namespace_id);
  if (!namespaceId) {
    throw new Error(`NamespaceCapability at ${capId} is missing namespace_id`);
  }

  const owner = suiOwnerSummary(data.owner);
  return {
    id: capId,
    namespaceId,
    kind,
    objectType,
    ownerKind: owner.kind,
    ownerAddress: owner.address,
    ownerDisplay: owner.display,
  };
}

function idField(value: unknown): string | null {
  if (typeof value === "string" && value.startsWith("0x")) return value;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.id === "string" && record.id.startsWith("0x")) return record.id;
  }
  return null;
}
