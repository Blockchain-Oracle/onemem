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

/**
 * Thrown when the memory blob WAS written to MemWal but the on-chain ActionCall
 * attestation failed. The memory exists (carries its ids) but is unattested —
 * retry the attestation with `walrusBlobId`/`memoryId` rather than re-adding.
 */
export class MemoryAttestationError extends Error {
  constructor(
    readonly memoryId: string,
    readonly walrusBlobId: string,
    options?: { cause?: unknown },
  ) {
    super(
      `Memory ${memoryId} written to Walrus (${walrusBlobId}) but the on-chain ActionCall failed — memory is unattested, retry the attestation`,
      options,
    );
    this.name = "MemoryAttestationError";
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

  /**
   * Write a memory: MemWal stores the Seal-encrypted blob; if session +
   * namespace + cap are supplied, OneMem also emits a verifiable ActionCall
   * referencing the blob (hash taken over the plaintext).
   */
  async add(text: string, opts: AddMemoryArgs = {}): Promise<AddMemoryResult> {
    let remembered: { id: string; blob_id: string };
    try {
      const memwal = await this.getMemWal();
      remembered = await memwal.rememberManual(text, opts.namespace);
    } catch (error) {
      throw new MemoryWriteError({ cause: error });
    }
    const inputHash = sha256(new TextEncoder().encode(text));

    let suiTxDigest: string | undefined;
    let callId: string | undefined;
    if (opts.sessionId && opts.onememNamespaceId && opts.rwCapId) {
      try {
        const emitted = await this.client.traces.appendCall({
          sessionId: opts.sessionId,
          namespaceId: opts.onememNamespaceId,
          rwCapId: opts.rwCapId,
          toolName: "memwal_write",
          toolNamespace: "@onemem/sdk-ts",
          input: { walrusBlob: remembered.blob_id, hash: inputHash },
          label: "memory",
        });
        callId = emitted.callId;
        suiTxDigest = emitted.txDigest;
      } catch (error) {
        // The memory IS written to MemWal; only the on-chain attestation
        // failed. Surface a recoverable typed error carrying the ids.
        throw new MemoryAttestationError(remembered.id, remembered.blob_id, { cause: error });
      }
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
        relevance: Math.max(0, 1 - hit.distance),
      }));
    return { results };
  }

  /**
   * List memory references from chain. MemWal 0.0.5 has no list endpoint, so the
   * inventory is derived from on-chain `memwal_write` ActionCalls — a verifiable
   * list of memory blobs (metadata only; plaintext stays Seal-encrypted on Walrus
   * and decrypts client-side). Optionally scope by OneMem namespace.
   */
  async getAll(opts: { namespaceId?: string; limit?: number } = {}): Promise<
    Array<{
      walrusBlobId: string | null;
      contentHash: string;
      namespaceId: string;
      callId: string;
      capturedAt: number;
    }>
  > {
    const packageId = this.client.addresses.originalPackageId || this.client.addresses.packageId;
    const out: Array<{
      walrusBlobId: string | null;
      contentHash: string;
      namespaceId: string;
      callId: string;
      capturedAt: number;
    }> = [];
    const limit = opts.limit ?? 100;
    // biome-ignore lint/suspicious/noExplicitAny: opaque cursor type
    let cursor: any = null;
    while (true) {
      const page = await this.client.client.queryEvents({
        query: { MoveEventType: `${packageId}::events::ActionCallEmittedEvent` },
        cursor,
        order: "descending",
        limit: 50,
      });
      for (const e of page.data) {
        const f = e.parsedJson as Record<string, unknown> | undefined;
        if (!f || f.tool_name !== "memwal_write") continue;
        if (opts.namespaceId && f.namespace_id !== opts.namespaceId) continue;
        out.push({
          walrusBlobId: (f.walrus_input_blob as string) || null,
          contentHash: `0x${Buffer.from((f.content_hash as number[]) ?? []).toString("hex")}`,
          namespaceId: String(f.namespace_id ?? ""),
          callId: String(f.call_id ?? ""),
          capturedAt: Number(f.captured_at ?? 0),
        });
        if (out.length >= limit) return out;
      }
      if (!page.hasNextPage || !page.nextCursor) break;
      cursor = page.nextCursor;
    }
    return out;
  }

  /** Wipe MemWal key material from memory. Call when done with the client. */
  dispose(): void {
    this.memwal?.destroy();
    this.memwal = null;
  }
}
