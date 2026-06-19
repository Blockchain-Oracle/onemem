// Memory API — the Mem0-mirror surface, wrapping MemWal's `/manual` flow plus a
// local SQLite index for the CRUD + scoping primitives MemWal lacks.
//
// MemWal stores each memory as a client-side-Seal-encrypted Walrus blob (the
// relayer never sees plaintext) and does its own Seal + Walrus internally.
//
// MemWal 0.0.7 is append-only: no get-by-id / get-all / update / delete /
// history. So `add` ALSO mirrors each write into a local SQLite index
// (`memory-index.ts`), and `get` / `getAll` / `delete` are served from that
// index. `search` still vector-recalls via MemWal, then post-filters against the
// index (soft-deletes + agent/run/metadata scoping the namespace didn't capture).
//
// Surface:
//   add(text, opts?)       → rememberManual + index mirror
//   search(query, opts?)   → recallManual, mapped + index post-filter
//   get(id)                → index lookup (excludes soft-deleted)
//   getAll(filter)         → index query (scope filters, newest-first)
//   delete(id)             → index soft-delete (honest semantics — see below)

import type { MemWalManual } from "@mysten-incubation/memwal/manual";
import { sha256 } from "@noble/hashes/sha2.js";

import type { OneMem } from "./client.js";
import {
  type MemoryIndex,
  type MemoryIndexFilter,
  metadataMatches,
  SqliteMemoryIndex,
} from "./memory-index.js";

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
  /**
   * Local index db path (the listing/scoping/soft-delete mirror). Defaults to
   * ~/.onemem/memory-index.db. Use ":memory:" for an ephemeral index.
   */
  readonly indexPath?: string;
}

/** Mem0-style multi-scope fields, applied to writes/queries/searches. */
export interface MemoryScopeArgs {
  /** Caller's user id. When set (and no explicit namespace), derives `user:<id>`. */
  readonly userId?: string;
  /** Agent id for agent-scoped memory. */
  readonly agentId?: string;
  /** Run/session id for run-scoped memory. */
  readonly runId?: string;
  /** Arbitrary JSON-serializable metadata stored alongside the memory. */
  readonly metadata?: Record<string, unknown>;
}

export interface AddMemoryArgs extends MemoryScopeArgs {
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

export interface SearchMemoryArgs extends MemoryScopeArgs {
  readonly namespace?: string;
  readonly topK?: number;
}

export interface GetAllMemoryArgs extends MemoryScopeArgs {
  readonly namespace?: string;
  readonly limit?: number;
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

/** A memory as stored in the local index — the CRUD/listing shape. */
export interface StoredMemory {
  readonly id: string;
  readonly text: string;
  readonly walrusBlobId: string;
  readonly namespace: string;
  readonly userId?: string;
  readonly agentId?: string;
  readonly runId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: number;
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

function recordToStored(record: {
  id: string;
  text: string;
  blobId: string;
  namespace: string;
  userId?: string;
  agentId?: string;
  runId?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}): StoredMemory {
  return {
    id: record.id,
    text: record.text,
    walrusBlobId: record.blobId,
    namespace: record.namespace,
    userId: record.userId,
    agentId: record.agentId,
    runId: record.runId,
    metadata: record.metadata,
    createdAt: record.createdAt,
  };
}

/** Mem0-style memory operations backed by MemWal `/manual` + a local index. */
export class MemoryAPI {
  private memwal: MemWalManual | null = null;
  private index: MemoryIndex | null = null;

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

  /** Lazily open the local index (same lazy pattern as getMemWal). */
  private getIndex(): MemoryIndex {
    if (!this.index) {
      this.index = new SqliteMemoryIndex(this.config.accountId, this.config.indexPath);
    }
    return this.index;
  }

  /**
   * Resolve the effective MemWal namespace:
   *   explicit namespace → `user:<userId>` → config.namespace → "default".
   */
  private effectiveNamespace(opts: { namespace?: string; userId?: string }): string {
    return (
      opts.namespace ??
      (opts.userId ? `user:${opts.userId}` : undefined) ??
      this.config.namespace ??
      "default"
    );
  }

  /**
   * Write a memory: MemWal stores the Seal-encrypted blob on Walrus, then we
   * mirror the row (id, blob id, account, namespace, scope, metadata, plaintext)
   * into the local index so `get` / `getAll` / `delete` / scoped `search` work.
   */
  async add(text: string, opts: AddMemoryArgs = {}): Promise<AddMemoryResult> {
    const namespace = this.effectiveNamespace(opts);
    let remembered: { id: string; blob_id: string };
    try {
      const memwal = await this.getMemWal();
      remembered = await memwal.rememberManual(text, namespace);
    } catch (error) {
      throw new MemoryWriteError({ cause: error });
    }
    const inputHash = sha256(new TextEncoder().encode(text));
    const inputHashHex = hex(inputHash);

    this.getIndex().put({
      id: remembered.id,
      blobId: remembered.blob_id,
      accountId: this.config.accountId,
      namespace,
      userId: opts.userId,
      agentId: opts.agentId,
      runId: opts.runId,
      metadata: opts.metadata,
      text,
      inputHashHex,
      createdAt: Date.now(),
      deleted: false,
    });

    return {
      memoryId: remembered.id,
      walrusBlobId: remembered.blob_id,
      inputHashHex,
    };
  }

  /** Fetch one stored memory by id from the local index (excludes soft-deleted). */
  async get(id: string): Promise<StoredMemory | null> {
    const record = this.getIndex().get(id);
    return record ? recordToStored(record) : null;
  }

  /**
   * List stored memories from the local index by scope filter, newest-first.
   * Excludes soft-deleted rows. Filters are AND-combined and account-scoped.
   */
  async getAll(filter: GetAllMemoryArgs = {}): Promise<StoredMemory[]> {
    const indexFilter: MemoryIndexFilter = {
      userId: filter.userId,
      agentId: filter.agentId,
      runId: filter.runId,
      namespace: filter.namespace,
      metadata: filter.metadata,
      limit: filter.limit,
    };
    return this.getIndex().list(indexFilter).map(recordToStored);
  }

  /**
   * Remove a memory by id.
   *
   * This is a SOFT delete: the row is flagged deleted in the local index, which
   * removes it from `get` / `getAll` and excludes its blob from `search`
   * results. The Seal-encrypted blob itself PERSISTS on Walrus until its storage
   * epoch expires — a true hard delete is not possible on append-only MemWal
   * 0.0.7 (no delete primitive). Returns true if a row was flipped to deleted.
   */
  async delete(id: string): Promise<boolean> {
    return this.getIndex().softDelete(id);
  }

  /**
   * Vector search via MemWal recall, then post-filtered against the local index:
   *
   *   - A hit whose index record is soft-deleted (`deleted=1`) is ALWAYS dropped.
   *   - When ANY scope/metadata filter is requested (userId/agentId/runId/
   *     metadata), a hit with NO matching index record is EXCLUDED — we can't
   *     verify the filter against an absent record, so we must not leak it. This
   *     also means a cross-machine write whose index row this client never saw
   *     won't bypass the requested scope.
   *   - When NO filter is requested, an unindexed hit is KEPT, so fresh/cross-
   *     device writes still surface.
   *
   * The index lookup is scoped to the effective namespace so deduped-across-
   * namespace blobs resolve to the right record. Returns decrypted memories
   * ranked by relevance.
   */
  async search(query: string, opts: SearchMemoryArgs = {}): Promise<SearchMemoryResult> {
    const namespace = this.effectiveNamespace(opts);
    let recalled: { results: ({ blob_id: string; distance: number } & { text?: string })[] };
    try {
      const memwal = await this.getMemWal();
      recalled = await memwal.recallManual(query, opts.topK ?? 10, namespace);
    } catch (error) {
      throw new MemoryReadError({ cause: error });
    }
    // The /manual full-recall variant returns decrypted `text`. Hits without it
    // are vector-only (or a decrypt that was denied) — excluded from results.
    const hits = recalled.results.filter(
      (hit): hit is { blob_id: string; text: string; distance: number } => "text" in hit,
    );

    const byBlobId = this.getIndex().getByBlobIds(
      hits.map((h) => h.blob_id),
      namespace,
    );
    const hasScopeFilter =
      opts.userId !== undefined ||
      opts.agentId !== undefined ||
      opts.runId !== undefined ||
      (opts.metadata !== undefined && Object.keys(opts.metadata).length > 0);

    const results: Memory[] = [];
    for (const hit of hits) {
      const record = byBlobId.get(hit.blob_id);
      // Drop soft-deleted blobs.
      if (record?.deleted) continue;
      if (hasScopeFilter) {
        // Can't verify the requested filter without an index record — exclude it
        // rather than leak a hit that may belong to another scope.
        if (!record) continue;
        if (opts.userId !== undefined && record.userId !== opts.userId) continue;
        if (opts.agentId !== undefined && record.agentId !== opts.agentId) continue;
        if (opts.runId !== undefined && record.runId !== opts.runId) continue;
        if (opts.metadata && !metadataMatches(record.metadata, opts.metadata)) continue;
      }
      results.push({
        text: hit.text,
        walrusBlobId: hit.blob_id,
        relevance: Math.min(1, Math.max(0, 1 - hit.distance)),
      });
    }
    return { results };
  }

  /** Wipe MemWal key material from memory + close the index. Call when done. */
  dispose(): void {
    this.memwal?.destroy();
    this.memwal = null;
    this.index?.close();
    this.index = null;
  }
}
