// TS surface for the Move types in contracts/onemem/sources/*.move.
// Hand-written because Move modules are immutable per Sui publish semantics
// — these structures are frozen at v0.1 and any v2+ schema change ships a
// migration entry function + bumps the version dynamic field (per
// docs/05-our-architecture/01-protocol/upgrade-strategy.md). When that
// happens we add a versioned variant here.
//
// Type mapping conventions (Move → TS):
//   UID, ID, address → string (hex, "0x..." prefixed)
//   String           → string
//   vector<u8>       → Uint8Array
//   u8               → number  (0-255 fits in JS number safely)
//   u64              → bigint  (Sui u64 exceeds Number.MAX_SAFE_INTEGER)
//   Option<T>        → T | null

// === Namespace ===

export const NamespaceKind = {
  User: 0,
  Agent: 1,
  Org: 2,
  Session: 3,
  Shared: 4,
} as const;
export type NamespaceKind = (typeof NamespaceKind)[keyof typeof NamespaceKind];

/** Phantom KIND tags for `NamespaceCapability<KIND>`. */
export type CapKind = "ReadOnly" | "ReadWrite" | "Admin";

/** On-chain layout of `onemem::namespace::MemoryNamespace`. */
export interface MemoryNamespace {
  readonly id: string;
  readonly owner: string;
  readonly name: string;
  readonly namespaceKind: NamespaceKind;
  readonly sealPackageId: string;
  readonly walrusBlobCount: bigint;
  readonly lastActionCallId: string | null;
  readonly merkleRoot: Uint8Array;
  readonly createdAt: bigint;
  readonly active: boolean;
}

/**
 * `NamespaceCapability<KIND>` from the Move side. The `kind` discriminant
 * is NOT a Move struct field (Move encodes it via phantom typing) — we
 * derive it at fetch time from the object's Move type signature, e.g.
 * `0xpkg::namespace::NamespaceCapability<0xpkg::namespace::ReadOnly>`.
 */
export interface NamespaceCapability<K extends CapKind = CapKind> {
  readonly id: string;
  readonly namespaceId: string;
  readonly kind: K;
}

// === Trace ===

export const SessionStatus = {
  Active: 0,
  Completed: 1,
  Failed: 2,
  Aborted: 3,
} as const;
export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export const CallStatus = {
  Pending: 0,
  Success: 1,
  Failure: 2,
  Timeout: 3,
  Cancelled: 4,
} as const;
export type CallStatus = (typeof CallStatus)[keyof typeof CallStatus];

/** On-chain layout of `onemem::trace::TraceSession`. */
export interface TraceSession {
  readonly id: string;
  readonly packageId: string;
  readonly namespaceId: string;
  readonly agentId: string;
  readonly environment: string;
  readonly sdkVersion: string;
  readonly startedAt: bigint;
  readonly endedAt: bigint | null;
  readonly rootCallId: string | null;
  readonly lastCallId: string | null;
  readonly callCount: bigint;
  readonly lastContentHash: Uint8Array;
  readonly merkleRoot: Uint8Array;
  readonly status: SessionStatus;
  readonly capturedByAddress: string;
}

/** On-chain layout of `onemem::trace::ActionCall` (a dynamic-field child of TraceSession). */
export interface ActionCall {
  readonly id: string;
  readonly sessionId: string;
  readonly parentCallId: string | null;
  readonly toolName: string;
  readonly toolNamespace: string;
  readonly walrusInputBlob: string;
  readonly walrusOutputBlob: string | null;
  readonly inputHash: Uint8Array;
  readonly outputHash: Uint8Array | null;
  readonly contentHash: Uint8Array;
  readonly prevHash: Uint8Array;
  readonly startedAt: bigint;
  readonly endedAt: bigint | null;
  readonly status: CallStatus;
  readonly capturedByAddress: string;
  readonly label: string | null;
}

// === Registry ===

/** On-chain layout of `onemem::registry::OneMemRegistry`. */
export interface OneMemRegistry {
  readonly id: string;
  /** `namespace_index` is a Sui Table; the SDK exposes `lookup()` instead of the raw table. */
  readonly namespaceIndexTableId: string;
}

// === Events (subscription payloads) ===

export interface TraceSessionOpenedEvent {
  readonly sessionId: string;
  readonly namespaceId: string;
  readonly agentId: string;
  readonly environment: string;
  readonly sdkVersion: string;
  readonly capturedByAddress: string;
  readonly startedAt: bigint;
  readonly initialMerkleRoot: Uint8Array;
}

export interface TraceSessionClosedEvent {
  readonly sessionId: string;
  readonly namespaceId: string;
  readonly finalMerkleRoot: Uint8Array;
  readonly callCount: bigint;
  readonly status: SessionStatus;
  readonly endedAt: bigint;
}

export interface ActionCallEmittedEvent {
  readonly sessionId: string;
  readonly namespaceId: string;
  readonly callId: string;
  readonly parentCallId: string | null;
  readonly toolName: string;
  readonly toolNamespace: string;
  readonly walrusInputBlob: string;
  readonly inputHash: Uint8Array;
  readonly contentHash: Uint8Array;
  readonly prevHash: Uint8Array;
  readonly newSessionMerkleRoot: Uint8Array;
  readonly capturedByAddress: string;
  readonly capturedAt: bigint;
  readonly label: string | null;
}

export interface ActionCallClosedEvent {
  readonly sessionId: string;
  readonly callId: string;
  readonly walrusOutputBlob: string;
  readonly outputHash: Uint8Array;
  readonly status: CallStatus;
  readonly endedAt: bigint;
}
