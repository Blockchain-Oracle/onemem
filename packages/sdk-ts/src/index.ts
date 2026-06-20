// @onemem/sdk-ts — public API surface.
//
// Decentralized memory for AI agents, the Mem0-style way. Memory is stored via
// MemWal (`@mysten-incubation/memwal`), which does its own Seal encryption +
// Walrus storage internally.
//
// Quick start:
//   import { OneMem } from "@onemem/sdk-ts";
//   import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
//
//   const onemem = await OneMem.create({
//     network: "testnet",
//     signer: Ed25519Keypair.fromSecretKey(process.env.PRIVATE_KEY!),
//     memory: { delegateKey, accountId, embeddingApiKey, memwalPackageId, relayerUrl },
//   });
//
//   await onemem.requireMemory().add("alice prefers TypeScript");
//   const { results } = await onemem.requireMemory().search("what language?");
//
// Node-only runtime helpers (signer/network resolution, memory recorder,
// credentials, runtime controls) live in `@onemem/sdk-ts/runtime`.

export { OneMem, type OneMemConfig, type SuiNetwork } from "./client.js";
export {
  type AddMemoryArgs,
  type AddMemoryResult,
  type GetAllMemoryArgs,
  type Memory,
  MemoryAPI,
  type MemoryConfig,
  MemoryNotConfiguredError,
  MemoryReadError,
  type MemoryScopeArgs,
  MemoryWriteError,
  type SearchMemoryArgs,
  type SearchMemoryResult,
  type StoredMemory,
} from "./memory.js";
export {
  DEFAULT_MEMORY_INDEX_FILE,
  type MemoryIndex,
  MemoryIndexError,
  type MemoryIndexFilter,
  type MemoryIndexRecord,
  metadataMatches,
  SqliteMemoryIndex,
} from "./memory-index.js";
export { VERSION } from "./version.js";
