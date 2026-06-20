// Local SQLite index that mirrors MemWal writes.
//
// MemWal 0.0.7 is append-only: it has no get-by-id / get-all / update / delete /
// history primitive. To deliver the Mem0 CRUD + multi-scope surface
// (`get` / `getAll` / `delete` / userId·agentId·runId·metadata filters) we keep a
// LOCAL index of every memory we write — id, blob id, account, namespace, scope
// fields, metadata, plaintext, created-at — alongside MemWal. MemWal stays the
// source of truth for the encrypted blob + vector search; this index is the
// listing/scoping/soft-delete layer on top.
//
// Built on `node:sqlite` (a Node builtin, no native dep) — the SAME library
// `@onemem/worker` uses (see packages/worker/src/store.ts), loaded the same way
// (createRequire so bundlers don't try to resolve the builtin).
//
// One db file is isolated PER ACCOUNT: every query filters by account_id, so two
// accounts sharing a db path never see each other's rows. The default path is
// ~/.onemem/memory-index.db.

import { chmodSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import type { DatabaseSync, SQLInputValue } from "node:sqlite";

// The index db stores DECRYPTED plaintext (the `text` column) so get/getAll can
// return memories without a MemWal round-trip. That makes it as sensitive as the
// credentials file, so we harden it the SAME way credentials.ts hardens
// credentials.json: owner-only file (0600) inside an owner-only dir (0700).
const SECRET_FILE_MODE = 0o600;
const SECRET_DIR_MODE = 0o700;

// node:sqlite is newer than some bundlers' builtin list, so a static `import`
// makes Vite/esbuild try to bundle it. Load it through createRequire at runtime
// (Node resolves it natively) and keep the type-only import above for typing.
// Resolved lazily on first index construction so merely importing this module
// (e.g. for its types) never requires `node:sqlite` to exist.
let sqliteModule: typeof import("node:sqlite") | null = null;
function loadSqlite(): typeof import("node:sqlite") {
  if (!sqliteModule) {
    try {
      sqliteModule = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");
    } catch (error) {
      // node:sqlite stabilized in Node 22.5+ (stable in Node 24). On older Node
      // (e.g. a 20.x pin) the builtin is absent — surface that plainly instead of
      // a cryptic ERR_UNKNOWN_BUILTIN_MODULE.
      throw new MemoryIndexError(
        `the local memory index needs node:sqlite (Node >= 22.5; this is Node ${process.version}). ` +
          "Upgrade the Node runtime to enable get/getAll/delete + scoping.",
        { cause: error },
      );
    }
  }
  return sqliteModule;
}

/** Default index db path. Override via SqliteMemoryIndex's `path`. */
export const DEFAULT_MEMORY_INDEX_FILE = join(homedir(), ".onemem", "memory-index.db");

/**
 * chmod a path to `mode` if it exists. The WAL/SHM sidecars may be created
 * lazily, so a missing sidecar is fine; only a real chmod error (e.g. wrong
 * owner) is surfaced as a MemoryIndexError so a half-hardened plaintext db never
 * passes silently.
 */
function hardenPerm(target: string, mode: number): void {
  if (!existsSync(target)) return;
  try {
    chmodSync(target, mode);
  } catch (error) {
    throw new MemoryIndexError(`cannot harden permissions on ${target}`, { cause: error });
  }
}

/** A single mirrored memory row. */
export interface MemoryIndexRecord {
  readonly id: string;
  readonly blobId: string;
  /** MemWal account this row belongs to — every query is scoped by it. */
  readonly accountId: string;
  readonly namespace: string;
  readonly userId?: string;
  readonly agentId?: string;
  readonly runId?: string;
  /** Arbitrary JSON-serializable metadata. */
  readonly metadata?: Record<string, unknown>;
  readonly text: string;
  /** Client-side SHA-256 of the plaintext (hex), for local dedup. */
  readonly inputHashHex?: string;
  readonly createdAt: number;
  /** Soft-delete flag — 1 means removed from listing/search. */
  readonly deleted: boolean;
}

/** Filter for `list` — all fields are AND-combined and scoped to one account. */
export interface MemoryIndexFilter {
  readonly userId?: string;
  readonly agentId?: string;
  readonly runId?: string;
  readonly namespace?: string;
  /** Match rows whose metadata is a superset of these key/value pairs. */
  readonly metadata?: Record<string, unknown>;
  readonly limit?: number;
}

/**
 * The listing/scoping/soft-delete index that mirrors MemWal writes. All reads +
 * writes are scoped to a single MemWal account (set at construction), so one db
 * file can hold many accounts without cross-talk.
 */
export interface MemoryIndex {
  /** Upsert a mirrored memory row (overwrites by id). */
  put(record: MemoryIndexRecord): void;
  /** Fetch one non-deleted row by id (account-scoped). null if missing/deleted. */
  get(id: string): MemoryIndexRecord | null;
  /** List non-deleted rows matching the filter, newest-first. */
  list(filter?: MemoryIndexFilter): MemoryIndexRecord[];
  /** Soft-delete one row by id. Returns true if a row was flipped to deleted. */
  softDelete(id: string): boolean;
  /**
   * Look up rows by blob id (account-scoped, includes deleted). For search
   * post-filtering. Scoped to `namespace` so identical plaintext deduped to one
   * blob_id across namespaces resolves to the record for the searched namespace.
   */
  getByBlobIds(blobIds: readonly string[], namespace?: string): Map<string, MemoryIndexRecord>;
  /** Release the underlying db handle. */
  close(): void;
}

/** Thrown when the index db cannot be opened/created at its path. */
export class MemoryIndexError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "MemoryIndexError";
  }
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  blob_id TEXT,
  account_id TEXT NOT NULL,
  namespace TEXT,
  user_id TEXT,
  agent_id TEXT,
  run_id TEXT,
  metadata TEXT,
  text TEXT,
  input_hash TEXT,
  created_at INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_memories_scope
  ON memories(account_id, namespace, user_id, agent_id, run_id, deleted);
`;

interface MemoryRow {
  readonly id: string;
  readonly blob_id: string | null;
  readonly account_id: string;
  readonly namespace: string | null;
  readonly user_id: string | null;
  readonly agent_id: string | null;
  readonly run_id: string | null;
  readonly metadata: string | null;
  readonly text: string | null;
  readonly input_hash: string | null;
  readonly created_at: number;
  readonly deleted: number;
}

function parseMetadata(raw: string | null): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
  } catch {
    // A corrupt metadata cell shouldn't sink a whole list — drop just the field.
    return undefined;
  }
}

function rowToRecord(r: MemoryRow): MemoryIndexRecord {
  return {
    id: r.id,
    blobId: r.blob_id ?? "",
    accountId: r.account_id,
    namespace: r.namespace ?? "default",
    userId: r.user_id ?? undefined,
    agentId: r.agent_id ?? undefined,
    runId: r.run_id ?? undefined,
    metadata: parseMetadata(r.metadata),
    text: r.text ?? "",
    inputHashHex: r.input_hash ?? undefined,
    createdAt: r.created_at,
    deleted: r.deleted !== 0,
  };
}

/**
 * True when `candidate` should win over the currently-kept `current` for the
 * same blob id: a live row beats a deleted one; otherwise the newer createdAt
 * wins. So `getByBlobIds` surfaces a non-deleted row whenever one exists.
 */
function preferRecord(candidate: MemoryIndexRecord, current: MemoryIndexRecord): boolean {
  if (candidate.deleted !== current.deleted) return !candidate.deleted;
  return candidate.createdAt >= current.createdAt;
}

/** Order-insensitive deep equality for JSON-serializable metadata values. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ao = a as Record<string, unknown>;
    const bo = b as Record<string, unknown>;
    const aKeys = Object.keys(ao);
    const bKeys = Object.keys(bo);
    if (aKeys.length !== bKeys.length) return false;
    // Key-order-insensitive: each key in `a` must exist in `b` with a deep-equal value.
    return aKeys.every((k) => Object.hasOwn(bo, k) && deepEqual(ao[k], bo[k]));
  }
  return false;
}

/**
 * True when `metadata` is a SUPERSET of `filter`: for each key in `filter`, the
 * stored metadata must contain that key with a deeply-equal value. The match is
 * key-order-insensitive ({a:1,b:2} matches {b:2,a:1}) — shared by `getAll` and
 * `search` so the two surfaces agree. Exported for reuse by the memory layer.
 */
export function metadataMatches(
  metadata: Record<string, unknown> | undefined,
  filter: Record<string, unknown>,
): boolean {
  if (!metadata) return false;
  for (const [key, want] of Object.entries(filter)) {
    if (!Object.hasOwn(metadata, key)) return false;
    if (!deepEqual(metadata[key], want)) return false;
  }
  return true;
}

/** Default `MemoryIndex` backed by `node:sqlite`. */
export class SqliteMemoryIndex implements MemoryIndex {
  private readonly db: DatabaseSync;
  private readonly accountId: string;

  /**
   * @param accountId MemWal account every row is scoped to.
   * @param path      db file path; defaults to ~/.onemem/memory-index.db.
   *                  ":memory:" gives an in-process db (tests).
   *
   * Fails at construction (MemoryIndexError) if the path is unwritable — no
   * silent fallback, so a misconfigured index surfaces immediately.
   */
  constructor(accountId: string, path: string = DEFAULT_MEMORY_INDEX_FILE) {
    this.accountId = accountId;
    const onDisk = path !== ":memory:";
    if (onDisk) {
      const dir = dirname(path);
      try {
        mkdirSync(dir, { recursive: true, mode: SECRET_DIR_MODE });
      } catch (error) {
        throw new MemoryIndexError(`cannot create memory index directory for ${path}`, {
          cause: error,
        });
      }
      // mkdirSync's `mode` only applies on creation (and is masked by umask), and
      // never tightens an EXISTING dir — chmod unconditionally so a pre-existing
      // looser dir is locked down too.
      hardenPerm(dir, SECRET_DIR_MODE);
    }
    // loadSqlite() throws its own (already-clear) MemoryIndexError on an old
    // Node — let it propagate; only the file-open below is "cannot open".
    const sqlite = loadSqlite();
    try {
      this.db = new sqlite.DatabaseSync(path);
      this.db.exec("PRAGMA journal_mode = WAL;");
      this.db.exec(SCHEMA);
    } catch (error) {
      throw new MemoryIndexError(`cannot open memory index at ${path}`, { cause: error });
    }
    // Harden the db file AND its WAL sidecars to owner-only: opening the db (and
    // running in WAL mode) creates them at the process umask default (typically
    // 0644), which would leave the decrypted plaintext world-readable.
    if (onDisk) {
      hardenPerm(path, SECRET_FILE_MODE);
      hardenPerm(`${path}-wal`, SECRET_FILE_MODE);
      hardenPerm(`${path}-shm`, SECRET_FILE_MODE);
    }
  }

  put(record: MemoryIndexRecord): void {
    this.db
      .prepare(
        `INSERT INTO memories
           (id, blob_id, account_id, namespace, user_id, agent_id, run_id, metadata, text, input_hash, created_at, deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           blob_id = excluded.blob_id,
           account_id = excluded.account_id,
           namespace = excluded.namespace,
           user_id = excluded.user_id,
           agent_id = excluded.agent_id,
           run_id = excluded.run_id,
           metadata = excluded.metadata,
           text = excluded.text,
           input_hash = excluded.input_hash,
           created_at = excluded.created_at,
           deleted = excluded.deleted`,
      )
      .run(
        record.id,
        record.blobId,
        record.accountId,
        record.namespace,
        record.userId ?? null,
        record.agentId ?? null,
        record.runId ?? null,
        record.metadata ? JSON.stringify(record.metadata) : null,
        record.text,
        record.inputHashHex ?? null,
        record.createdAt,
        record.deleted ? 1 : 0,
      );
  }

  get(id: string): MemoryIndexRecord | null {
    const row = this.db
      .prepare("SELECT * FROM memories WHERE id = ? AND account_id = ? AND deleted = 0")
      .get(id, this.accountId) as MemoryRow | undefined;
    return row ? rowToRecord(row) : null;
  }

  list(filter: MemoryIndexFilter = {}): MemoryIndexRecord[] {
    const where: string[] = ["account_id = ?", "deleted = 0"];
    const params: SQLInputValue[] = [this.accountId];
    if (filter.namespace !== undefined) {
      where.push("namespace = ?");
      params.push(filter.namespace);
    }
    if (filter.userId !== undefined) {
      where.push("user_id = ?");
      params.push(filter.userId);
    }
    if (filter.agentId !== undefined) {
      where.push("agent_id = ?");
      params.push(filter.agentId);
    }
    if (filter.runId !== undefined) {
      where.push("run_id = ?");
      params.push(filter.runId);
    }
    const hasMetadataFilter = filter.metadata && Object.keys(filter.metadata).length > 0;
    // ALWAYS bound the SQL fetch so we never materialize the whole table. Without
    // a metadata filter the SQL LIMIT is exact. WITH a metadata filter we
    // over-fetch a bounded window (the JSON match runs in-app), then slice to the
    // caller's limit — so metadata filtering is BEST-EFFORT within that window.
    let fetchLimit: number;
    if (hasMetadataFilter) {
      // Window scales with the requested limit but is always bounded.
      fetchLimit = Math.max((filter.limit ?? 0) * 10, 200);
    } else {
      fetchLimit = filter.limit ?? 200;
    }
    const sql = `SELECT * FROM memories WHERE ${where.join(" AND ")} ORDER BY created_at DESC, rowid DESC LIMIT ?`;
    params.push(fetchLimit);
    const rows = this.db.prepare(sql).all(...params) as unknown as MemoryRow[];
    let records = rows.map(rowToRecord);
    if (hasMetadataFilter && filter.metadata) {
      const metadataFilter = filter.metadata;
      records = records.filter((r) => metadataMatches(r.metadata, metadataFilter));
      if (filter.limit !== undefined) records = records.slice(0, filter.limit);
    }
    return records;
  }

  softDelete(id: string): boolean {
    const info = this.db
      .prepare("UPDATE memories SET deleted = 1 WHERE id = ? AND account_id = ? AND deleted = 0")
      .run(id, this.accountId);
    return Number(info.changes) > 0;
  }

  getByBlobIds(blobIds: readonly string[], namespace?: string): Map<string, MemoryIndexRecord> {
    const out = new Map<string, MemoryIndexRecord>();
    if (blobIds.length === 0) return out;
    const placeholders = blobIds.map(() => "?").join(", ");
    // Scope by namespace when given, so identical plaintext deduped to one
    // blob_id across namespaces doesn't apply another namespace's record.
    const nsClause = namespace !== undefined ? " AND namespace = ?" : "";
    const params: SQLInputValue[] = [this.accountId, ...blobIds];
    if (namespace !== undefined) params.push(namespace);
    const rows = this.db
      .prepare(
        `SELECT * FROM memories WHERE account_id = ? AND blob_id IN (${placeholders})${nsClause}`,
      )
      .all(...params) as unknown as MemoryRow[];
    for (const row of rows) {
      const record = rowToRecord(row);
      // A blob can be referenced by more than one row (e.g. delete-then-re-add of
      // identical plaintext deduped to the same blob_id). Pick a winner so search
      // post-filtering sees a LIVE row whenever one exists:
      //   1. a non-deleted row always beats a deleted one;
      //   2. among rows of the same deleted-state, newest createdAt wins.
      // A deleted row is only returned when NO live row references the blob.
      const prior = out.get(record.blobId);
      if (!prior || preferRecord(record, prior)) out.set(record.blobId, record);
    }
    return out;
  }

  close(): void {
    this.db.close();
  }
}
