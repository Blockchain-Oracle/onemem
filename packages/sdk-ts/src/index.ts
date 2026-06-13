// @onemem/sdk-ts — public API surface.
//
// Quick start:
//   import { OneMem, NamespaceKind } from "@onemem/sdk-ts";
//   import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
//
//   const onemem = await OneMem.create({
//     network: "testnet",
//     signer: Ed25519Keypair.fromSecretKey(process.env.PRIVATE_KEY!),
//   });
//
//   const { namespaceId, adminCapId } = await onemem.namespaces.create({
//     name: "alice-memory",
//     kind: NamespaceKind.User,
//     sealPackageId: "0x...",
//   });
//
//   // Mint myself a RW cap (admin holds Admin; startSession needs RW)
//   const { capId: rwCapId } = await onemem.namespaces.shareReadWrite({
//     namespaceId, adminCapId, recipient: onemem.senderAddress(),
//   });
//
//   const { sessionId } = await onemem.traces.startSession({
//     namespaceId, rwCapId,
//     agentId: "my-agent", environment: "dev", sdkVersion: "0.1.0",
//   });
//
//   await onemem.traces.appendCall({
//     sessionId, namespaceId, rwCapId,
//     toolName: "Read", toolNamespace: "claude-code-builtin",
//     walrusInputBlob: "walrus:abc", inputHash: new Uint8Array([1,2,3]),
//   });
//
//   await onemem.traces.endSession({
//     sessionId, rwCapId, status: SessionStatus.Completed,
//   });
//
//   const verify = await onemem.traces.verifySession(sessionId);
//   // verify.ok === true means the Merkle chain is intact.
//
// Network switching: pass `network: "mainnet"` to OneMem.create(). The
// codegen-emitted manifest at src/generated/addresses.ts resolves all
// addresses. Until mainnet is deployed, mainnet calls throw a clear
// "OneMem is not deployed on mainnet" error (per the portability rule).

export const VERSION = "0.1.0";

export { OneMem, type OneMemConfig } from "./client.js";
export {
  ACTIVE_NETWORK,
  ADDRESSES,
  addressesFor,
  type OneMemAddresses,
  type SuiNetwork,
} from "./generated/addresses.js";
export {
  type AddMemoryArgs,
  type AddMemoryResult,
  type Memory,
  MemoryAPI,
  MemoryAttestationError,
  type MemoryConfig,
  MemoryNotConfiguredError,
  MemoryReadError,
  MemoryWriteError,
  type SearchMemoryArgs,
  type SearchMemoryResult,
} from "./memory.js";
export {
  type CreateNamespaceArgs,
  type CreateNamespaceResult,
  NamespacesAPI,
} from "./namespaces.js";
export {
  createSealClient,
  DEFAULT_SEAL_THRESHOLD,
  SEAL_KEY_SERVERS_BY_NETWORK,
  type SealConfig,
  SealDecryptError,
  SealEncryptError,
  SealNotConfiguredError,
  SealStore,
} from "./seal.js";
export {
  type AppendCallArgs,
  type CloseCallArgs,
  type EndSessionArgs,
  type StartSessionArgs,
  TracePayloadError,
  TracesAPI,
  type VerifyResult,
} from "./traces.js";
export type {
  ActionCall,
  ActionCallClosedEvent,
  ActionCallEmittedEvent,
  CapKind,
  MemoryNamespace,
  NamespaceCapability,
  OneMemRegistry,
  TraceSession,
  TraceSessionClosedEvent,
  TraceSessionOpenedEvent,
} from "./types/move.js";
// NamespaceKind/SessionStatus/CallStatus are exported as BOTH value (const
// object) AND type (union of the literal members) — the canonical TS
// "const-enum-like" pattern. Consumers do `NamespaceKind.User` for the
// value and `kind: NamespaceKind` for the type. Don't add a `type` prefix
// to these re-exports; doing so masks the runtime value.
export { CallStatus, NamespaceKind, SessionStatus } from "./types/move.js";
export {
  isRetryableWalrusError,
  UPLOAD_RELAY_BY_NETWORK,
  type WalrusConfig,
  WalrusNotConfiguredError,
  WalrusReadError,
  WalrusStore,
  WalrusWriteError,
} from "./walrus.js";
