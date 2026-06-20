// The durable, decentralized store — this is what makes OneMem's memory live on
// Walrus instead of only in local SQLite. It uses MemWal's main (relayer) client:
// the relayer is a Rust TEE that embeds + SEAL-encrypts + uploads to Walrus
// SERVER-SIDE, so NO embedding API key is needed (proven on testnet 2026-06-20).
// Auth is just the auto-provisioned delegate key + account id.
//
// Writes are async: remember() returns a job_id in ~1s; the TEE finishes the
// Walrus upload over the next 1-3 min. We store the job_id as the "durably
// queued" marker and never block the worker; recall becomes available once the
// job lands (eventual consistency — fine for cross-session memory).

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Observation, Summary } from "./store.js";

export interface DurableHit {
  readonly text: string;
  readonly distance: number;
  readonly blobId: string;
}

/** State of a durable (Walrus) write job, polled from the relayer. */
export type DurableJobState = "pending" | "done" | "failed";

export interface DurableJobStatus {
  readonly state: DurableJobState;
  /** The real Walrus blob id — present only when state === "done". */
  readonly blobId?: string;
}

/** A pluggable durable store so the worker loop is testable with a fake. */
export interface DurableStore {
  available(): boolean;
  /**
   * Enqueue a durable write; returns the relayer job id in ~1s (the TEE finishes
   * the Walrus upload over the next 1-3 min). The reconciler polls `status` and
   * backfills the real blob id once the job is done — so an explorer link only
   * ever appears for a blob that genuinely exists.
   */
  write(text: string, namespace: string): Promise<string>;
  /** Poll a write job's status (drives the reconciler). */
  status(jobId: string): Promise<DurableJobStatus>;
  /** Semantic recall within a namespace. */
  recall(query: string, namespace: string, limit: number): Promise<DurableHit[]>;
}

export interface DurableConfig {
  readonly key: string;
  readonly accountId: string;
  readonly serverUrl?: string;
}

function defaultCredsPath(): string {
  return process.env.ONEMEM_CREDENTIALS_PATH ?? join(homedir(), ".onemem", "credentials.json");
}

interface CredentialsFile {
  readonly delegateKey?: string;
  readonly accountId?: string;
  readonly relayerUrl?: string;
}

function readCredentials(path: string): CredentialsFile | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as CredentialsFile;
  } catch {
    return null;
  }
}

/**
 * Resolve the zero-key durable config: env first, then ~/.onemem/credentials.json
 * (auto-provisioned by the CLI/MCP). Returns null if no delegate+account found.
 */
export function resolveDurableConfig(
  env: NodeJS.ProcessEnv = process.env,
  credsPath: string = defaultCredsPath(),
): DurableConfig | null {
  let key = env.ONEMEM_DELEGATE_KEY;
  let accountId = env.ONEMEM_ACCOUNT_ID;
  let serverUrl = env.MEMWAL_RELAYER_URL;

  if (!key || !accountId) {
    const creds = readCredentials(credsPath);
    key = key ?? creds?.delegateKey;
    accountId = accountId ?? creds?.accountId;
    serverUrl = serverUrl ?? creds?.relayerUrl;
  }

  if (!key || !accountId) return null;
  return { key, accountId, serverUrl };
}

// Minimal structural type for the MemWal main client (lazy-imported to avoid
// loading @mysten/seal + @mysten/sui unless durable storage is actually used).
interface MemWalClient {
  remember(text: string, namespace?: string): Promise<{ job_id: string; status: string }>;
  getRememberStatus(jobId: string): Promise<{
    status: "pending" | "running" | "uploaded" | "done" | "failed" | "not_found";
    blob_id?: string;
  }>;
  recall(params: { query: string; limit?: number; namespace?: string }): Promise<{
    results: { blob_id: string; text: string; distance: number }[];
    total: number;
  }>;
}

export class MemWalDurableStore implements DurableStore {
  private client: MemWalClient | null = null;

  constructor(private readonly config: DurableConfig) {}

  available(): boolean {
    return Boolean(this.config.key && this.config.accountId);
  }

  private async memwal(): Promise<MemWalClient> {
    if (!this.client) {
      const { MemWal } = await import("@mysten-incubation/memwal");
      this.client = MemWal.create({
        key: this.config.key,
        accountId: this.config.accountId,
        serverUrl: this.config.serverUrl,
      }) as unknown as MemWalClient;
    }
    return this.client;
  }

  async write(text: string, namespace: string): Promise<string> {
    // Returns a job id in ~1s; the TEE finishes the Walrus upload in the
    // background. The reconciler resolves the real blob id via status().
    const accepted = await (await this.memwal()).remember(text, namespace);
    return accepted.job_id;
  }

  async status(jobId: string): Promise<DurableJobStatus> {
    const s = await (await this.memwal()).getRememberStatus(jobId);
    if ((s.status === "done" || s.status === "uploaded") && s.blob_id) {
      return { state: "done", blobId: s.blob_id };
    }
    if (s.status === "failed" || s.status === "not_found") return { state: "failed" };
    return { state: "pending" };
  }

  async recall(query: string, namespace: string, limit: number): Promise<DurableHit[]> {
    const result = await (await this.memwal()).recall({ query, limit, namespace });
    return result.results.map((m) => ({ text: m.text, distance: m.distance, blobId: m.blob_id }));
  }
}

/** Build a MemWal durable store from resolved zero-key config, or null if unconfigured. */
export function makeDurableStore(
  env: NodeJS.ProcessEnv = process.env,
  credsPath?: string,
): DurableStore | null {
  const config = resolveDurableConfig(env, credsPath);
  return config ? new MemWalDurableStore(config) : null;
}

/** The MemWal namespace for a project's coding memory. */
export function projectNamespace(project: string | null | undefined): string {
  return `cm:${project ?? "default"}`;
}

/** Readable, embeddings-friendly text for an observation (what recall returns + injects). */
export function observationText(o: Observation): string {
  const parts = [`[${o.type}] ${o.title}`];
  if (o.subtitle) parts.push(o.subtitle);
  if (o.narrative) parts.push(o.narrative);
  if (o.facts.length) parts.push(`Facts:\n${o.facts.map((f) => `- ${f}`).join("\n")}`);
  if (o.filesModified.length) parts.push(`Files modified: ${o.filesModified.join(", ")}`);
  return parts.join("\n");
}

/** Readable text for a session summary. */
export function summaryText(s: Summary): string {
  const section = (label: string, value: string | null): string | null =>
    value ? `${label}: ${value}` : null;
  return [
    section("Request", s.request),
    section("Investigated", s.investigated),
    section("Learned", s.learned),
    section("Completed", s.completed),
    section("Next steps", s.nextSteps),
  ]
    .filter(Boolean)
    .join("\n");
}
