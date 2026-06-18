// Object + event fetchers for trace operations. Kept separate from
// traces.ts so the main module stays under the 400-line cap per
// CODING_GUARDRAILS.md.

import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

import type { SessionStatus, TraceSession } from "../types/move.js";

interface RawTraceSessionFields {
  id?: { id: string };
  namespace_id: string;
  agent_id: string;
  environment: string;
  sdk_version: string;
  started_at: string;
  ended_at?: { vec: string[] };
  root_call_id?: { vec: string[] };
  last_call_id?: { vec: string[] };
  call_count: string;
  last_content_hash: number[];
  merkle_root: number[];
  status: number;
  captured_by_address: string;
}

export async function fetchTraceSession(
  client: SuiJsonRpcClient,
  sessionId: string,
): Promise<TraceSession> {
  const obj = await client.getObject({
    id: sessionId,
    options: { showContent: true, showType: true },
  });
  if (obj.error || !obj.data) {
    throw new Error(`fetchTraceSession(${sessionId}): ${JSON.stringify(obj.error)}`);
  }
  const content = obj.data.content;
  if (!content || content.dataType !== "moveObject") {
    throw new Error(`fetchTraceSession(${sessionId}): not a Move object`);
  }
  const f = content.fields as unknown as RawTraceSessionFields;
  return {
    id: sessionId,
    namespaceId: f.namespace_id,
    agentId: f.agent_id,
    environment: f.environment,
    sdkVersion: f.sdk_version,
    startedAt: BigInt(f.started_at),
    endedAt: optBig(f.ended_at?.vec),
    rootCallId: optStr(f.root_call_id?.vec),
    lastCallId: optStr(f.last_call_id?.vec),
    callCount: BigInt(f.call_count),
    lastContentHash: new Uint8Array(f.last_content_hash),
    merkleRoot: new Uint8Array(f.merkle_root),
    status: f.status as SessionStatus,
    capturedByAddress: f.captured_by_address,
  };
}

export interface EmittedEventRow {
  readonly timestampMs: bigint;
  readonly callId: string;
  readonly parentCallId: string | null;
  readonly contentHash: Uint8Array;
  readonly prevHash: Uint8Array;
}

interface RawEmittedFields {
  session_id: string;
  call_id: string;
  parent_call_id?: string | { vec?: string[] } | null;
  content_hash: number[];
  prev_hash: number[];
}

export async function fetchActionCallEmittedEvents(
  client: SuiJsonRpcClient,
  packageId: string,
  sessionId: string,
): Promise<EmittedEventRow[]> {
  const eventType = `${packageId}::events::ActionCallEmittedEvent`;
  const all: EmittedEventRow[] = [];
  // biome-ignore lint/suspicious/noExplicitAny: cursor pagination type is opaque across @mysten/sui versions
  let cursor: any = null;
  while (true) {
    const page = await client.queryEvents({
      query: { MoveEventType: eventType },
      cursor,
      order: "ascending",
      limit: 100,
    });
    for (const e of page.data) {
      const fields = e.parsedJson as RawEmittedFields | undefined;
      if (!fields || fields.session_id !== sessionId) continue;
      const ts = (e.timestampMs as string | undefined) ?? "0";
      all.push({
        timestampMs: BigInt(ts),
        callId: fields.call_id,
        parentCallId: optStrAny(fields.parent_call_id),
        contentHash: new Uint8Array(fields.content_hash),
        prevHash: new Uint8Array(fields.prev_hash),
      });
    }
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return all;
}

export interface OpenedSessionRow {
  sessionId: string;
  agentId: string;
  environment: string;
  namespaceId: string;
  timestampMs: bigint;
}

/** List TraceSessionOpenedEvents (most recent first), optionally scoped. */
export async function fetchOpenedSessions(
  client: SuiJsonRpcClient,
  packageId: string,
  opts: { namespaceId?: string; agentId?: string; limit?: number } = {},
): Promise<OpenedSessionRow[]> {
  const eventType = `${packageId}::events::TraceSessionOpenedEvent`;
  const out: OpenedSessionRow[] = [];
  const limit = opts.limit ?? 50;
  // biome-ignore lint/suspicious/noExplicitAny: cursor pagination type is opaque across @mysten/sui versions
  let cursor: any = null;
  while (true) {
    const page = await client.queryEvents({
      query: { MoveEventType: eventType },
      cursor,
      order: "descending",
      limit: 50,
    });
    for (const e of page.data) {
      const f = e.parsedJson as Record<string, unknown> | undefined;
      if (!f) continue;
      if (opts.namespaceId && f.namespace_id !== opts.namespaceId) continue;
      if (opts.agentId && f.agent_id !== opts.agentId) continue;
      out.push({
        sessionId: String(f.session_id ?? ""),
        agentId: String(f.agent_id ?? ""),
        environment: String(f.environment ?? ""),
        namespaceId: String(f.namespace_id ?? ""),
        timestampMs: BigInt((e.timestampMs as string | undefined) ?? "0"),
      });
      if (out.length >= limit) return out;
    }
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}

function optBig(vec: string[] | undefined): bigint | null {
  if (!vec || vec.length === 0) return null;
  const first = vec[0];
  return first !== undefined ? BigInt(first) : null;
}

function optStr(vec: string[] | undefined): string | null {
  if (!vec || vec.length === 0) return null;
  return vec[0] ?? null;
}

/**
 * Read an optional ID/string that Sui serializes differently by context:
 * a bare string (event payloads), `{ vec: [...] }` (object fields), or null.
 */
function optStrAny(value: string | { vec?: string[] } | null | undefined): string | null {
  if (typeof value === "string") return value.length > 0 ? value : null;
  return optStr(value?.vec);
}
