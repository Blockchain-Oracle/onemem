// The local worker's durable store, built on node:sqlite (a Node builtin, no
// native dep). This is the claude-mem "alive" model adapted to OneMem:
//   - `events` = raw tool calls written synchronously on the hot path (the
//     instant a hook POSTs), so the dashboard can show activity immediately and
//     the observer has a queue to compress from.
//   - `observations` = the COMPRESSED, readable cards the observer produces
//     (8 types / 7 concepts / files view) — durable to MemWal (blob_id).
//   - `summaries` = 5-section session summaries.
//   - `prompts` = user prompts (prompt cards).
// Local SQLite is the alive cache + compression queue; MemWal is the durable,
// decentralized store (blob_id backfilled once the durable write lands).

import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { basename } from "node:path";
import type { DatabaseSync } from "node:sqlite";

// node:sqlite is a Node builtin newer than some bundlers' builtin list, so a
// static `import` makes Vite/esbuild try to bundle it. Load it through
// createRequire at runtime (Node resolves it natively) and keep the type-only
// import above for full typing.
const sqlite = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");

/** The 8 observation types claude-mem's observer uses (parity). */
export type ObservationType =
  | "bugfix"
  | "feature"
  | "refactor"
  | "change"
  | "discovery"
  | "decision"
  | "security_alert"
  | "security_note";

export type EventStatus = "pending" | "compressed" | "skipped";

export interface LocalSession {
  readonly id: string;
  readonly runtime: string;
  readonly project: string | null;
  readonly projectPath: string | null;
  readonly namespaceId: string | null;
  readonly onememSessionId: string | null;
  readonly status: "open" | "closed";
  readonly startedAt: number;
  readonly endedAt: number | null;
}

/** A raw tool call awaiting (or done with) compression. */
export interface WorkerEvent {
  readonly id: number;
  readonly sessionId: string;
  readonly seq: number;
  readonly toolName: string | null;
  readonly toolNamespace: string | null;
  readonly inputPreview: string | null;
  readonly outputPreview: string | null;
  readonly status: EventStatus;
  readonly contentHash: string;
  readonly createdAt: number;
}

/** A compressed, readable observation card. */
export interface Observation {
  readonly id: number;
  readonly sessionId: string;
  readonly seq: number;
  readonly type: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly facts: string[];
  readonly narrative: string;
  readonly concepts: string[];
  readonly filesRead: string[];
  readonly filesModified: string[];
  readonly contentHash: string;
  readonly blobId: string | null;
  readonly createdAt: number;
}

export interface Summary {
  readonly id: number;
  readonly sessionId: string;
  readonly request: string | null;
  readonly investigated: string | null;
  readonly learned: string | null;
  readonly completed: string | null;
  readonly nextSteps: string | null;
  readonly notes: string | null;
  readonly contentHash: string;
  readonly blobId: string | null;
  readonly createdAt: number;
}

export interface Prompt {
  readonly id: number;
  readonly sessionId: string;
  readonly seq: number;
  readonly text: string;
  readonly blobId: string | null;
  readonly createdAt: number;
}

/** The observer claims the oldest pending session's batch and compresses it. */
export interface PendingBatch {
  readonly sessionId: string;
  readonly events: WorkerEvent[];
}

export interface InitSessionInput {
  readonly id: string;
  readonly runtime: string;
  readonly project?: string | null;
  readonly projectPath?: string | null;
  readonly namespaceId?: string | null;
  readonly onememSessionId?: string | null;
  readonly startedAt?: number;
}

export interface AddEventInput {
  readonly sessionId: string;
  readonly toolName?: string | null;
  readonly toolNamespace?: string | null;
  readonly inputPreview?: string | null;
  readonly outputPreview?: string | null;
  readonly createdAt?: number;
}

export interface AddObservationInput {
  readonly sessionId: string;
  readonly type: ObservationType | string;
  readonly title: string;
  readonly subtitle?: string | null;
  readonly facts?: string[];
  readonly narrative: string;
  readonly concepts?: string[];
  readonly filesRead?: string[];
  readonly filesModified?: string[];
  readonly createdAt?: number;
}

export interface AddSummaryInput {
  readonly sessionId: string;
  readonly request?: string | null;
  readonly investigated?: string | null;
  readonly learned?: string | null;
  readonly completed?: string | null;
  readonly nextSteps?: string | null;
  readonly notes?: string | null;
  readonly createdAt?: number;
}

export interface AddPromptInput {
  readonly sessionId: string;
  readonly text: string;
  readonly createdAt?: number;
}

interface SessionRow {
  readonly id: string;
  readonly runtime: string;
  readonly project: string | null;
  readonly project_path: string | null;
  readonly namespace_id: string | null;
  readonly onemem_session_id: string | null;
  readonly status: string;
  readonly started_at: number;
  readonly ended_at: number | null;
}

interface EventRow {
  readonly id: number;
  readonly session_id: string;
  readonly seq: number;
  readonly tool_name: string | null;
  readonly tool_namespace: string | null;
  readonly input_preview: string | null;
  readonly output_preview: string | null;
  readonly status: string;
  readonly content_hash: string;
  readonly created_at: number;
}

interface ObservationRow {
  readonly id: number;
  readonly session_id: string;
  readonly seq: number;
  readonly type: string;
  readonly title: string;
  readonly subtitle: string | null;
  readonly facts: string;
  readonly narrative: string;
  readonly concepts: string;
  readonly files_read: string;
  readonly files_modified: string;
  readonly content_hash: string;
  readonly blob_id: string | null;
  readonly created_at: number;
}

interface SummaryRow {
  readonly id: number;
  readonly session_id: string;
  readonly request: string | null;
  readonly investigated: string | null;
  readonly learned: string | null;
  readonly completed: string | null;
  readonly next_steps: string | null;
  readonly notes: string | null;
  readonly content_hash: string;
  readonly blob_id: string | null;
  readonly created_at: number;
}

interface PromptRow {
  readonly id: number;
  readonly session_id: string;
  readonly seq: number;
  readonly text: string;
  readonly blob_id: string | null;
  readonly created_at: number;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  runtime TEXT NOT NULL,
  project TEXT,
  project_path TEXT,
  namespace_id TEXT,
  onemem_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  started_at INTEGER NOT NULL,
  ended_at INTEGER
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  tool_name TEXT,
  tool_namespace TEXT,
  input_preview TEXT,
  output_preview TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  content_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_pending ON events(status, created_at, id);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id, seq);
CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  facts TEXT NOT NULL DEFAULT '[]',
  narrative TEXT NOT NULL,
  concepts TEXT NOT NULL DEFAULT '[]',
  files_read TEXT NOT NULL DEFAULT '[]',
  files_modified TEXT NOT NULL DEFAULT '[]',
  content_hash TEXT NOT NULL UNIQUE,
  blob_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_obs_session ON observations(session_id, seq);
CREATE TABLE IF NOT EXISTS summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  request TEXT,
  investigated TEXT,
  learned TEXT,
  completed TEXT,
  next_steps TEXT,
  notes TEXT,
  content_hash TEXT NOT NULL UNIQUE,
  blob_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sum_session ON summaries(session_id, created_at);
CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  text TEXT NOT NULL,
  blob_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prompts_session ON prompts(session_id, seq);
`;

function sha256(parts: (string | null | undefined)[]): string {
  return createHash("sha256")
    .update(parts.map((p) => p ?? "").join(" "))
    .digest("hex");
}

function toJson(arr: string[] | undefined): string {
  return JSON.stringify(arr ?? []);
}

function fromJson(s: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s) as unknown;
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function deriveProject(input: InitSessionInput): string | null {
  if (input.project) return input.project;
  if (input.projectPath) return basename(input.projectPath) || null;
  return null;
}

function rowToSession(r: SessionRow): LocalSession {
  return {
    id: r.id,
    runtime: r.runtime,
    project: r.project,
    projectPath: r.project_path,
    namespaceId: r.namespace_id,
    onememSessionId: r.onemem_session_id,
    status: r.status === "closed" ? "closed" : "open",
    startedAt: r.started_at,
    endedAt: r.ended_at,
  };
}

function rowToEvent(r: EventRow): WorkerEvent {
  return {
    id: r.id,
    sessionId: r.session_id,
    seq: r.seq,
    toolName: r.tool_name,
    toolNamespace: r.tool_namespace,
    inputPreview: r.input_preview,
    outputPreview: r.output_preview,
    status:
      r.status === "compressed" ? "compressed" : r.status === "skipped" ? "skipped" : "pending",
    contentHash: r.content_hash,
    createdAt: r.created_at,
  };
}

function rowToObservation(r: ObservationRow): Observation {
  return {
    id: r.id,
    sessionId: r.session_id,
    seq: r.seq,
    type: r.type,
    title: r.title,
    subtitle: r.subtitle,
    facts: fromJson(r.facts),
    narrative: r.narrative,
    concepts: fromJson(r.concepts),
    filesRead: fromJson(r.files_read),
    filesModified: fromJson(r.files_modified),
    contentHash: r.content_hash,
    blobId: r.blob_id,
    createdAt: r.created_at,
  };
}

function rowToSummary(r: SummaryRow): Summary {
  return {
    id: r.id,
    sessionId: r.session_id,
    request: r.request,
    investigated: r.investigated,
    learned: r.learned,
    completed: r.completed,
    nextSteps: r.next_steps,
    notes: r.notes,
    contentHash: r.content_hash,
    blobId: r.blob_id,
    createdAt: r.created_at,
  };
}

function rowToPrompt(r: PromptRow): Prompt {
  return {
    id: r.id,
    sessionId: r.session_id,
    seq: r.seq,
    text: r.text,
    blobId: r.blob_id,
    createdAt: r.created_at,
  };
}

export class WorkerStore {
  private readonly db: DatabaseSync;

  constructor(path = ":memory:") {
    this.db = new sqlite.DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec(SCHEMA);
  }

  /** Idempotent: re-opening a session updates metadata without losing prior fields. */
  initSession(input: InitSessionInput): LocalSession {
    const startedAt = input.startedAt ?? Date.now();
    this.db
      .prepare(
        `INSERT INTO sessions (id, runtime, project, project_path, namespace_id, onemem_session_id, status, started_at)
         VALUES (?, ?, ?, ?, ?, ?, 'open', ?)
         ON CONFLICT(id) DO UPDATE SET
           runtime = excluded.runtime,
           project = COALESCE(excluded.project, sessions.project),
           project_path = COALESCE(excluded.project_path, sessions.project_path),
           namespace_id = COALESCE(excluded.namespace_id, sessions.namespace_id),
           onemem_session_id = COALESCE(excluded.onemem_session_id, sessions.onemem_session_id)`,
      )
      .run(
        input.id,
        input.runtime,
        deriveProject(input),
        input.projectPath ?? null,
        input.namespaceId ?? null,
        input.onememSessionId ?? null,
        startedAt,
      );
    const session = this.getSession(input.id);
    if (!session) throw new Error(`initSession failed for ${input.id}`);
    return session;
  }

  /** Hot path: write a raw tool call instantly as a pending event. */
  addEvent(input: AddEventInput): WorkerEvent {
    const createdAt = input.createdAt ?? Date.now();
    const next = this.db
      .prepare("SELECT COALESCE(MAX(seq), 0) + 1 AS next FROM events WHERE session_id = ?")
      .get(input.sessionId) as { next: number };
    const contentHash = sha256([
      input.sessionId,
      input.toolName,
      input.inputPreview,
      input.outputPreview,
    ]);
    const info = this.db
      .prepare(
        `INSERT INTO events
           (session_id, seq, tool_name, tool_namespace, input_preview, output_preview, status, content_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      )
      .run(
        input.sessionId,
        next.next,
        input.toolName ?? null,
        input.toolNamespace ?? null,
        input.inputPreview ?? null,
        input.outputPreview ?? null,
        contentHash,
        createdAt,
      );
    const created = this.getEvent(Number(info.lastInsertRowid));
    if (!created) throw new Error("addEvent failed");
    return created;
  }

  getEvent(id: number): WorkerEvent | null {
    const row = this.db.prepare("SELECT * FROM events WHERE id = ?").get(id) as
      | EventRow
      | undefined;
    return row ? rowToEvent(row) : null;
  }

  pendingEventCount(): number {
    const r = this.db
      .prepare("SELECT COUNT(*) AS c FROM events WHERE status = 'pending'")
      .get() as { c: number };
    return r.c;
  }

  /**
   * Hand the observer the oldest pending session's batch. Batching per session
   * keeps the compression coherent and amortizes the observer's prompt overhead.
   */
  nextPendingBatch(maxEvents: number): PendingBatch | null {
    const oldest = this.db
      .prepare(
        "SELECT session_id FROM events WHERE status = 'pending' ORDER BY created_at ASC, id ASC LIMIT 1",
      )
      .get() as { session_id: string } | undefined;
    if (!oldest) return null;
    const rows = this.db
      .prepare(
        "SELECT * FROM events WHERE session_id = ? AND status = 'pending' ORDER BY seq ASC LIMIT ?",
      )
      .all(oldest.session_id, maxEvents) as unknown as EventRow[];
    return { sessionId: oldest.session_id, events: rows.map(rowToEvent) };
  }

  markEvents(ids: number[], status: EventStatus): void {
    if (ids.length === 0) return;
    const placeholders = ids.map(() => "?").join(", ");
    this.db
      .prepare(`UPDATE events SET status = ? WHERE id IN (${placeholders})`)
      .run(status, ...ids);
  }

  /** Store a compressed observation. Idempotent by content hash (replay-safe). */
  addObservation(input: AddObservationInput): Observation {
    const facts = input.facts ?? [];
    const concepts = input.concepts ?? [];
    const filesRead = input.filesRead ?? [];
    const filesModified = input.filesModified ?? [];
    const contentHash = sha256([
      input.sessionId,
      input.type,
      input.title,
      input.subtitle,
      input.narrative,
      facts.join("|"),
      concepts.join("|"),
      filesRead.join("|"),
      filesModified.join("|"),
    ]);
    const existing = this.db
      .prepare("SELECT id FROM observations WHERE content_hash = ?")
      .get(contentHash) as { id: number } | undefined;
    if (existing) {
      const found = this.getObservation(existing.id);
      if (found) return found;
    }
    const createdAt = input.createdAt ?? Date.now();
    const next = this.db
      .prepare("SELECT COALESCE(MAX(seq), 0) + 1 AS next FROM observations WHERE session_id = ?")
      .get(input.sessionId) as { next: number };
    const info = this.db
      .prepare(
        `INSERT INTO observations
           (session_id, seq, type, title, subtitle, facts, narrative, concepts, files_read, files_modified, content_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.sessionId,
        next.next,
        input.type,
        input.title,
        input.subtitle ?? null,
        toJson(facts),
        input.narrative,
        toJson(concepts),
        toJson(filesRead),
        toJson(filesModified),
        contentHash,
        createdAt,
      );
    const created = this.getObservation(Number(info.lastInsertRowid));
    if (!created) throw new Error("addObservation failed");
    return created;
  }

  setObservationBlob(id: number, blobId: string): void {
    this.db.prepare("UPDATE observations SET blob_id = ? WHERE id = ?").run(blobId, id);
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

  /** Store a 5-section summary. Idempotent by content hash. */
  addSummary(input: AddSummaryInput): Summary {
    const contentHash = sha256([
      input.sessionId,
      input.request,
      input.investigated,
      input.learned,
      input.completed,
      input.nextSteps,
      input.notes,
    ]);
    const existing = this.db
      .prepare("SELECT id FROM summaries WHERE content_hash = ?")
      .get(contentHash) as { id: number } | undefined;
    if (existing) {
      const found = this.getSummary(existing.id);
      if (found) return found;
    }
    const createdAt = input.createdAt ?? Date.now();
    const info = this.db
      .prepare(
        `INSERT INTO summaries
           (session_id, request, investigated, learned, completed, next_steps, notes, content_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.sessionId,
        input.request ?? null,
        input.investigated ?? null,
        input.learned ?? null,
        input.completed ?? null,
        input.nextSteps ?? null,
        input.notes ?? null,
        contentHash,
        createdAt,
      );
    const created = this.getSummary(Number(info.lastInsertRowid));
    if (!created) throw new Error("addSummary failed");
    return created;
  }

  setSummaryBlob(id: number, blobId: string): void {
    this.db.prepare("UPDATE summaries SET blob_id = ? WHERE id = ?").run(blobId, id);
  }

  getSummary(id: number): Summary | null {
    const row = this.db.prepare("SELECT * FROM summaries WHERE id = ?").get(id) as
      | SummaryRow
      | undefined;
    return row ? rowToSummary(row) : null;
  }

  listSummaries(sessionId?: string, limit = 100): Summary[] {
    const rows = (sessionId
      ? this.db
          .prepare("SELECT * FROM summaries WHERE session_id = ? ORDER BY created_at ASC LIMIT ?")
          .all(sessionId, limit)
      : this.db
          .prepare("SELECT * FROM summaries ORDER BY created_at DESC LIMIT ?")
          .all(limit)) as unknown as SummaryRow[];
    return rows.map(rowToSummary);
  }

  /** The most recent summary, optionally scoped to a project (for recall). */
  getLatestSummary(project?: string): Summary | null {
    const row = (
      project
        ? this.db
            .prepare(
              `SELECT su.* FROM summaries su
             JOIN sessions se ON se.id = su.session_id
             WHERE se.project = ?
             ORDER BY su.created_at DESC, su.id DESC LIMIT 1`,
            )
            .get(project)
        : this.db.prepare("SELECT * FROM summaries ORDER BY created_at DESC, id DESC LIMIT 1").get()
    ) as SummaryRow | undefined;
    return row ? rowToSummary(row) : null;
  }

  /** A closed session that has observations but no summary yet (drives the summarizer). */
  findSessionNeedingSummary(): string | null {
    const row = this.db
      .prepare(
        `SELECT s.id FROM sessions s
         WHERE s.status = 'closed'
           AND EXISTS (SELECT 1 FROM observations o WHERE o.session_id = s.id)
           AND NOT EXISTS (SELECT 1 FROM summaries su WHERE su.session_id = s.id)
         ORDER BY s.ended_at ASC, s.id ASC LIMIT 1`,
      )
      .get() as { id: string } | undefined;
    return row ? row.id : null;
  }

  addPrompt(input: AddPromptInput): Prompt {
    const createdAt = input.createdAt ?? Date.now();
    const next = this.db
      .prepare("SELECT COALESCE(MAX(seq), 0) + 1 AS next FROM prompts WHERE session_id = ?")
      .get(input.sessionId) as { next: number };
    const info = this.db
      .prepare("INSERT INTO prompts (session_id, seq, text, created_at) VALUES (?, ?, ?, ?)")
      .run(input.sessionId, next.next, input.text, createdAt);
    const created = this.getPrompt(Number(info.lastInsertRowid));
    if (!created) throw new Error("addPrompt failed");
    return created;
  }

  setPromptBlob(id: number, blobId: string): void {
    this.db.prepare("UPDATE prompts SET blob_id = ? WHERE id = ?").run(blobId, id);
  }

  getPrompt(id: number): Prompt | null {
    const row = this.db.prepare("SELECT * FROM prompts WHERE id = ?").get(id) as
      | PromptRow
      | undefined;
    return row ? rowToPrompt(row) : null;
  }

  listPrompts(sessionId?: string, limit = 200): Prompt[] {
    const rows = (sessionId
      ? this.db
          .prepare("SELECT * FROM prompts WHERE session_id = ? ORDER BY seq ASC LIMIT ?")
          .all(sessionId, limit)
      : this.db
          .prepare("SELECT * FROM prompts ORDER BY id DESC LIMIT ?")
          .all(limit)) as unknown as PromptRow[];
    return rows.map(rowToPrompt);
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

  close(): void {
    this.db.close();
  }
}
