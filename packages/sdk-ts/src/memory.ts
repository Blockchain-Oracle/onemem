// Memory API — the Mem0-mirror surface, wrapping MemWal's `/manual` flow.
//
// MemWal stores each memory as a client-side-Seal-encrypted Walrus blob (the
// relayer never sees plaintext). OneMem's value-add: every memory write also
// emits an on-chain `ActionCall` (tool_name="memwal_write") referencing that
// blob — the verifiable, Merkle-chained attestation MemWal itself doesn't ship.
//
// Surface (per docs/.../shared-api-surface.md):
//   add(text, opts?)    → rememberManual + optional ActionCall + attestation
//   search(query, opts?)→ recallManual, mapped to Memory[] (relevance=1-distance)
//
// MemWal 0.0.5 has no get-by-id / update / delete / history primitives, so
// those are intentionally not exposed at v0.1 (tracked as OneMem-side
// bookkeeping / v0.2 — see PILLAR2_AUDIT_AND_CORRECTION.md).

import { MemWalManual } from "@mysten-incubation/memwal/manual";
import { sha256 } from "@noble/hashes/sha2.js";

import type { OneMem } from "./client.js";

/** Config for the memory layer — MemWal `/manual` credentials + relayer. */
export interface MemoryConfig {
  /** Ed25519 delegate private key (hex) for MemWal relayer auth. */
  readonly delegateKey: string;
  /** MemWalAccount Sui object id. */
  readonly accountId: string;
  /** OpenAI/OpenRouter API key for client-side embeddings. */
  readonly embeddingApiKey: string;
  /** MemWal contract package id (network-matched). */
  readonly memwalPackageId: string;
  /** MemWal relayer URL (e.g. testnet relayer-staging.memory.walrus.xyz). */
  readonly relayerUrl: string;
  /** Sui private key (bech32) for Seal + Walrus signing. Defaults to the client signer's. */
  readonly suiPrivateKey?: string;
  /** Default MemWal namespace for memory isolation. */
  readonly namespace?: string;
}

export interface AddMemoryArgs {
  /** MemWal namespace override. */
  readonly namespace?: string;
  /**
   * When all three are present, the memory write also emits a verifiable
   * on-chain ActionCall into the session (the OneMem differentiator).
   */
  readonly sessionId?: string;
  readonly onememNamespaceId?: string;
  readonly rwCapId?: string;
}

export interface AddMemoryResult {
  /** MemWal memory id. */
  readonly memoryId: string;
  /** Walrus blob id holding the Seal-encrypted memory. */
  readonly walrusBlobId: string;
  /** ActionCall tx digest, when a verifiable trace was emitted. */
  readonly suiTxDigest?: string;
  /** ActionCall id, when emitted. */
  readonly callId?: string;
  /** Verifiability receipt the host app can surface. */
  readonly attestation: {
    readonly walrusBlobId: string;
    readonly memoryId: string;
    readonly inputHashHex: string;
    readonly suiTxDigest?: string;
    readonly callId?: string;
  };
}

export interface SearchMemoryArgs {
  readonly namespace?: string;
  readonly topK?: number;
}

export interface Memory {
  readonly text: string;
  readonly walrusBlobId: string;
  /** Normalized relevance in [0,1] (1 − L2 distance). */
  readonly relevance: number;
}

export interface SearchMemoryResult {
  readonly results: Memory[];
}

/** Thrown when the memory layer is used without MemWal config. */
export class MemoryNotConfiguredError extends Error {
  constructor() {
    super(
      "Memory is not configured. Pass { memory: { delegateKey, accountId, embeddingApiKey, memwalPackageId, relayerUrl } } to OneMem.create().",
    );
    this.name = "MemoryNotConfiguredError";
  }
}

function hex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Mem0-style memory operations backed by MemWal `/manual` + OneMem traces. */
export class MemoryAPI {
  private memwal: MemWalManual | null = null;

  constructor(
    private readonly client: OneMem,
    private readonly config: MemoryConfig,
    private readonly suiPrivateKey: string,
  ) {}

  private getMemWal(): MemWalManual {
    if (!this.memwal) {
      this.memwal = MemWalManual.create({
        key: this.config.delegateKey,
        suiPrivateKey: this.suiPrivateKey,
        embeddingApiKey: this.config.embeddingApiKey,
        packageId: this.config.memwalPackageId,
        accountId: this.config.accountId,
        serverUrl: this.config.relayerUrl,
        suiNetwork: this.client.network === "mainnet" ? "mainnet" : "testnet",
        // biome-ignore lint/suspicious/noExplicitAny: pass the shared Sui client (v2.x has no SuiClient ctor)
        suiClient: this.client.client as any,
        namespace: this.config.namespace,
      });
    }
    return this.memwal;
  }

  /**
   * Write a memory: MemWal stores the Seal-encrypted blob; if session +
   * namespace + cap are supplied, OneMem also emits a verifiable ActionCall
   * referencing the blob (hash taken over the plaintext).
   */
  async add(text: string, opts: AddMemoryArgs = {}): Promise<AddMemoryResult> {
    const remembered = await this.getMemWal().rememberManual(text, opts.namespace);
    const inputHash = sha256(new TextEncoder().encode(text));

    let suiTxDigest: string | undefined;
    let callId: string | undefined;
    if (opts.sessionId && opts.onememNamespaceId && opts.rwCapId) {
      const emitted = await this.client.traces.appendCall({
        sessionId: opts.sessionId,
        namespaceId: opts.onememNamespaceId,
        rwCapId: opts.rwCapId,
        toolName: "memwal_write",
        toolNamespace: "@onemem/sdk-ts",
        walrusInputBlob: remembered.blob_id,
        inputHash,
        label: "memory",
      });
      callId = emitted.callId;
      suiTxDigest = emitted.txDigest;
    }

    return {
      memoryId: remembered.id,
      walrusBlobId: remembered.blob_id,
      suiTxDigest,
      callId,
      attestation: {
        walrusBlobId: remembered.blob_id,
        memoryId: remembered.id,
        inputHashHex: hex(inputHash),
        suiTxDigest,
        callId,
      },
    };
  }

  /** Vector search via MemWal recall; returns decrypted memories ranked by relevance. */
  async search(query: string, opts: SearchMemoryArgs = {}): Promise<SearchMemoryResult> {
    const recalled = await this.getMemWal().recallManual(query, opts.topK ?? 10, opts.namespace);
    const results: Memory[] = recalled.results
      .filter((hit): hit is { blob_id: string; text: string; distance: number } => "text" in hit)
      .map((hit) => ({
        text: hit.text,
        walrusBlobId: hit.blob_id,
        relevance: Math.max(0, 1 - hit.distance),
      }));
    return { results };
  }
}
