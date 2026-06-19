// The local worker's durable store. Built on node:sqlite (built-in, no native
// dep). The hot path is: a hook POSTs a tool call → addObservation() writes it
// synchronously and the worker SSE-pushes it instantly, so the dashboard fills
// up live. A background reconciler later anchors each observation on-chain and
// flips its proof_status (local → queued → anchored → verified) — the chain is
// NEVER on the hot path. This is the claude-mem "alive" model adapted to OneMem.

import { createRequire } from "node:module";
import type { DatabaseSync } from "node:sqlite";

// node:sqlite is a Node builtin newer than some bundlers' builtin list, so a
// static `import` makes Vite/esbuild try to bundle it. Load it through
// createRequire at runtime (Node resolves it natively) and keep the type-only
// import above for full typing.
const sqlite = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");

export type ProofStatus = "local" | "queued" | "anchored" | "verified" | "failed";

export interface LocalSession {
  readonly id: string;
  readonly runtime: string;
  readonly projectPath: string | null;
  readonly namespaceId: string | null;
  readonly onememSessionId: string | null;
  readonly status: "open" | "closed";
  readonly startedAt: number;
  readonly endedAt: number | null;
}

export interface Observation {
  readonly id: number;
  readonly sessionId: string;
  readonly seq: number;
  readonly type: string;
  readonly toolName: string | null;
  readonly toolNamespace: string | null;
  readonly inputPreview: string | null;
  readonly outputPreview: string | null;
  readonly parentCallId: string | null;
  readonly createdAt: number;
  readonly proofStatus: ProofStatus;
  readonly callId: string | null;
  readonly txDigest: string | null;
}

export interface InitSessionInput {
  readonly id: string;
  readonly runtime: string;
  readonly projectPath?: string | null;
  readonly namespaceId?: string | null;
  readonly onememSessionId?: string | null;
  readonly startedAt?: number;
}

export interface AddObservationInput {
  readonly sessionId: string;
  readonly type: string;
  readonly toolName?: string | null;
  readonly toolNamespace?: string | null;
  readonly inputPreview?: string | null;
  readonly outputPreview?: string | null;
  readonly parentCallId?: string | null;
  readonly createdAt?: number;
}

interface SessionRow {
  readonly id: string;
  readonly runtime: string;
  readonly project_path: string | null;
  readonly namespace_id: string | null;
  readonly onemem_session_id: string | null;
  readonly status: string;
  readonly started_at: number;
  readonly ended_at: number | null;
}

interface ObservationRow {
  readonly id: number;
  readonly session_id: string;
  readonly seq: number;
  readonly type: string;
  readonly tool_name: string | null;
  readonly tool_namespace: string | null;
  readonly input_preview: string | null;
  readonly output_preview: string | null;
  readonly parent_call_id: string | null;
  readonly created_at: number;
  readonly proof_status: string;
  readonly call_id: string | null;
  readonly tx_digest: string | null;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  runtime TEXT NOT NULL,
  project_path TEXT,
  namespace_id TEXT,
  onemem_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  started_at INTEGER NOT NULL,
  ended_at INTEGER
);
CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  type TEXT NOT NULL,
  tool_name TEXT,
  tool_namespace TEXT,
  input_preview TEXT,
  output_preview TEXT,
  parent_call_id TEXT,
  created_at INTEGER NOT NULL,
  proof_status TEXT NOT NULL DEFAULT 'local',
  call_id TEXT,
  tx_digest TEXT
);
CREATE INDEX IF NOT EXISTS idx_obs_session ON observations(session_id, seq);
CREATE INDEX IF NOT EXISTS idx_obs_proof ON observations(proof_status);
`;

const PENDING_STATUSES: readonly ProofStatus[] = ["local", "queued", "failed"];

function toProofStatus(value: string): ProofStatus {
  return value === "queued" || value === "anchored" || value === "verified" || value === "failed"
    ? value
    : "local";
}

function rowToSession(r: SessionRow): LocalSession {
  return {
    id: r.id,
    runtime: r.runtime,
    projectPath: r.project_path,
    namespaceId: r.namespace_id,
    onememSessionId: r.onemem_session_id,
    status: r.status === "closed" ? "closed" : "open",
    startedAt: r.started_at,
    endedAt: r.ended_at,
  };
}

function rowToObservation(r: ObservationRow): Observation {
  return {
    id: r.id,
    sessionId: r.session_id,
    seq: r.seq,
    type: r.type,
    toolName: r.tool_name,
    toolNamespace: r.tool_namespace,
    inputPreview: r.input_preview,
    outputPreview: r.output_preview,
    parentCallId: r.parent_call_id,
    createdAt: r.created_at,
    proofStatus: toProofStatus(r.proof_status),
    callId: r.call_id,
    txDigest: r.tx_digest,
  };
}

export class WorkerStore {
  private readonly db: DatabaseSync;

  constructor(path = ":memory:") {
    this.db = new sqlite.DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec(SCHEMA);
  }

  /** Idempotent: opening a session that already exists updates its metadata. */
  initSession(input: InitSessionInput): LocalSession {
    const startedAt = input.startedAt ?? Date.now();
    this.db
      .prepare(
        `INSERT INTO sessions (id, runtime, project_path, namespace_id, onemem_session_id, status, started_at)
         VALUES (?, ?, ?, ?, ?, 'open', ?)
         ON CONFLICT(id) DO UPDATE SET
           runtime = excluded.runtime,
           project_path = excluded.project_path,
           namespace_id = excluded.namespace_id,
           onemem_session_id = COALESCE(excluded.onemem_session_id, sessions.onemem_session_id)`,
      )
      .run(
        input.id,
        input.runtime,
        input.projectPath ?? null,
        input.namespaceId ?? null,
        input.onememSessionId ?? null,
        startedAt,
      );
    const session = this.getSession(input.id);
    if (!session) throw new Error(`initSession failed for ${input.id}`);
    return session;
  }

  /** Hot path: write a tool call instantly, assign the next per-session seq. */
  addObservation(input: AddObservationInput): Observation {
    const createdAt = input.createdAt ?? Date.now();
    const next = this.db
      .prepare("SELECT COALESCE(MAX(seq), 0) + 1 AS next FROM observations WHERE session_id = ?")
      .get(input.sessionId) as { next: number };
    const info = this.db
      .prepare(
        `INSERT INTO observations
           (session_id, seq, type, tool_name, tool_namespace, input_preview, output_preview, parent_call_id, created_at, proof_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'local')`,
      )
      .run(
        input.sessionId,
        next.next,
        input.type,
        input.toolName ?? null,
        input.toolNamespace ?? null,
        input.inputPreview ?? null,
        input.outputPreview ?? null,
        input.parentCallId ?? null,
        createdAt,
      );
    const created = this.getObservation(Number(info.lastInsertRowid));
    if (!created) throw new Error("addObservation failed");
    return created;
  }

  /** Background reconciler flips an observation's proof badge as the chain settles. */
  setProofStatus(
    id: number,
    status: ProofStatus,
    meta: { callId?: string; txDigest?: string } = {},
  ): Observation | null {
    this.db
      .prepare(
        "UPDATE observations SET proof_status = ?, call_id = COALESCE(?, call_id), tx_digest = COALESCE(?, tx_digest) WHERE id = ?",
      )
      .run(status, meta.callId ?? null, meta.txDigest ?? null, id);
    return this.getObservation(id);
  }

  endSession(id: string, endedAt = Date.now()): void {
    this.db
      .prepare("UPDATE sessions SET status = 'closed', ended_at = ? WHERE id = ?")
      .run(endedAt, id);
  }

  getSession(id: string): LocalSession | null {
    const row = this.db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as
      | SessionRow
      | undefined;
    return row ? rowToSession(row) : null;
  }

  listSessions(limit = 100): LocalSession[] {
    const rows = this.db
      .prepare("SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?")
      .all(limit) as unknown as SessionRow[];
    return rows.map(rowToSession);
  }

  getObservation(id: number): Observation | null {
    const row = this.db.prepare("SELECT * FROM observations WHERE id = ?").get(id) as
      | ObservationRow
      | undefined;
    return row ? rowToObservation(row) : null;
  }

  listObservations(sessionId?: string, limit = 200): Observation[] {
    const rows = (sessionId
      ? this.db
          .prepare("SELECT * FROM observations WHERE session_id = ? ORDER BY seq ASC LIMIT ?")
          .all(sessionId, limit)
      : this.db
          .prepare("SELECT * FROM observations ORDER BY id DESC LIMIT ?")
          .all(limit)) as unknown as ObservationRow[];
    return rows.map(rowToObservation);
  }

  /** Observations still awaiting on-chain anchoring (the reconciler's work queue). */
  pendingProof(limit = 50): Observation[] {
    const placeholders = PENDING_STATUSES.map(() => "?").join(", ");
    const rows = this.db
      .prepare(
        `SELECT * FROM observations WHERE proof_status IN (${placeholders}) ORDER BY id ASC LIMIT ?`,
      )
      .all(...PENDING_STATUSES, limit) as unknown as ObservationRow[];
    return rows.map(rowToObservation);
  }

  close(): void {
    this.db.close();
  }
}
