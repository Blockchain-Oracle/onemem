// Memory API — the Mem0-mirror surface, wrapping MemWal's `/manual` flow.
//
// MemWal stores each memory as a client-side-Seal-encrypted Walrus blob (the
// relayer never sees plaintext) and does its own Seal + Walrus internally.
//
// Surface:
//   add(text, opts?)    → rememberManual
//   search(query, opts?)→ recallManual, mapped to Memory[] (relevance=1-distance)
//
// MemWal 0.0.7 has no get-by-id / update / delete / history / list primitives,
// so those are intentionally not exposed at v0.1 (the index/listing layer is a
// later phase).

import type { MemWalManual } from "@mysten-incubation/memwal/manual";
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
}

export interface AddMemoryResult {
  /** MemWal memory id. */
  readonly memoryId: string;
  /** Walrus blob id holding the Seal-encrypted memory. */
  readonly walrusBlobId: string;
  /**
   * Client-side SHA-256 of the plaintext, for local dedup — NOT a chain
   * attestation.
   */
  readonly inputHashHex?: string;
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
  constructor(detail?: string) {
    super(
      detail ??
        "Memory is not configured. Pass { memory: { delegateKey, accountId, embeddingApiKey, memwalPackageId, relayerUrl } } to OneMem.create().",
    );
    this.name = "MemoryNotConfiguredError";
  }
}

/** Thrown when the MemWal memory write fails. */
export class MemoryWriteError extends Error {
  constructor(options?: { cause?: unknown }) {
    super("Memory write (MemWal rememberManual) failed", options);
    this.name = "MemoryWriteError";
  }
}

/** Thrown when the MemWal recall fails. */
export class MemoryReadError extends Error {
  constructor(options?: { cause?: unknown }) {
    super("Memory search (MemWal recallManual) failed", options);
    this.name = "MemoryReadError";
  }
}

function hex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Mem0-style memory operations backed by MemWal `/manual`. */
export class MemoryAPI {
  private memwal: MemWalManual | null = null;

  constructor(
    private readonly client: OneMem,
    private readonly config: MemoryConfig,
    private readonly suiPrivateKey: string,
  ) {}

  private async getMemWal(): Promise<MemWalManual> {
    if (!this.memwal) {
      const { MemWalManual } = await import("@mysten-incubation/memwal/manual");
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

  /** Write a memory: MemWal stores the Seal-encrypted blob on Walrus. */
  async add(text: string, opts: AddMemoryArgs = {}): Promise<AddMemoryResult> {
    let remembered: { id: string; blob_id: string };
    try {
      const memwal = await this.getMemWal();
      remembered = await memwal.rememberManual(text, opts.namespace);
    } catch (error) {
      throw new MemoryWriteError({ cause: error });
    }
    const inputHash = sha256(new TextEncoder().encode(text));

    return {
      memoryId: remembered.id,
      walrusBlobId: remembered.blob_id,
      inputHashHex: hex(inputHash),
    };
  }

  /** Vector search via MemWal recall; returns decrypted memories ranked by relevance. */
  async search(query: string, opts: SearchMemoryArgs = {}): Promise<SearchMemoryResult> {
    let recalled: { results: ({ blob_id: string; distance: number } & { text?: string })[] };
    try {
      const memwal = await this.getMemWal();
      recalled = await memwal.recallManual(query, opts.topK ?? 10, opts.namespace);
    } catch (error) {
      throw new MemoryReadError({ cause: error });
    }
    // The /manual full-recall variant returns decrypted `text`. Hits without it
    // are vector-only (or a decrypt that was denied) — excluded from results.
    const results: Memory[] = recalled.results
      .filter((hit): hit is { blob_id: string; text: string; distance: number } => "text" in hit)
      .map((hit) => ({
        text: hit.text,
        walrusBlobId: hit.blob_id,
        relevance: Math.min(1, Math.max(0, 1 - hit.distance)),
      }));
    return { results };
  }

  /** Wipe MemWal key material from memory. Call when done with the client. */
  dispose(): void {
    this.memwal?.destroy();
    this.memwal = null;
  }
}
