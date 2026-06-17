// Server-side trace reads for the dashboard. Reuses the SDK's read-only verifier
// + raw event decode (no signer, no Walrus, no Seal) — the same independently
// verifiable view the CLI and public /verify page use.

import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { addressesFor, type SuiNetwork, type VerifyResult, verifyTraceChain } from "@onemem/sdk-ts";

export const NETWORK: SuiNetwork = (process.env.ONEMEM_NETWORK as SuiNetwork) || "testnet";
const ACTION_CALL_EMITTED = "events::ActionCallEmittedEvent";
const SESSION_OPENED = "events::TraceSessionOpenedEvent";

const STATUS_LABELS: Record<number, string> = {
  0: "Active",
  1: "Completed",
  2: "Failed",
  3: "Aborted",
};

export function statusLabel(status: number): string {
  return STATUS_LABELS[status] ?? `Unknown(${status})`;
}

export function hex(bytes: number[] | Uint8Array | undefined, len = 0): string {
  if (!bytes) return "";
  const full = `0x${Buffer.from(bytes).toString("hex")}`;
  return len > 0 ? full.slice(0, len + 2) : full;
}

function client(): { rpc: SuiJsonRpcClient; packageId: string } {
  const addr = addressesFor(NETWORK);
  return {
    rpc: new SuiJsonRpcClient({ network: NETWORK, url: addr.rpcUrl }),
    packageId: addr.packageId,
  };
}

export interface SessionMeta {
  sessionId: string;
  agentId: string;
  environment: string;
  namespaceId: string;
  status: number;
  callCount: number;
}

export interface DecodedCall {
  sequence: number;
  callId: string;
  parentCallId: string | null;
  toolName: string;
  toolNamespace: string;
  capturedAt: number;
  /** Closed-event end timestamp (ms); null while the call is still open. */
  endedAt: number | null;
  /** CallStatus: 0 open, 1 success, 2 failed (from the closed event). */
  status: number | null;
  walrusInputBlob: string | null;
  walrusOutputBlob: string | null;
  contentHash: number[];
  prevHash: number[];
  linked: boolean;
}

export interface SessionListItem {
  sessionId: string;
  agentId: string;
  environment: string;
  namespaceId: string;
  sdkVersion: string;
  capturedByAddress: string;
  startedAtMs: number;
  /** Session-opened event timestamp (ms). 0 if the node didn't report one. */
  openedAtMs: number;
}

export async function fetchSession(
  sessionId: string,
): Promise<{ meta: SessionMeta; calls: DecodedCall[]; verify: VerifyResult } | { error: string }> {
  try {
    const { rpc, packageId } = client();
    const obj = await rpc.getObject({ id: sessionId, options: { showContent: true } });
    const content = obj.data?.content;
    if (!content || content.dataType !== "moveObject") {
      return { error: `No TraceSession found at ${sessionId}` };
    }
    const f = content.fields as Record<string, unknown>;
    const meta: SessionMeta = {
      sessionId,
      agentId: String(f.agent_id ?? ""),
      environment: String(f.environment ?? ""),
      namespaceId: String(f.namespace_id ?? ""),
      status: Number(f.status ?? 0),
      callCount: Number(f.call_count ?? 0),
    };
    const [calls, verify] = await Promise.all([
      fetchCalls(rpc, packageId, sessionId),
      verifyTraceChain(rpc, packageId, sessionId),
    ]);
    return { meta, calls, verify };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

const ACTION_CALL_CLOSED = "events::ActionCallClosedEvent";

async function queryAllByType(rpc: SuiJsonRpcClient, type: string, sessionId: string) {
  const out: Array<{ j: Record<string, unknown>; ts: number }> = [];
  let cursor: Parameters<SuiJsonRpcClient["queryEvents"]>[0]["cursor"] = null;
  for (;;) {
    const page = await rpc.queryEvents({
      query: { MoveEventType: type },
      cursor,
      limit: 50,
      order: "descending",
    });
    for (const ev of page.data) {
      const j = ev.parsedJson as Record<string, unknown> | undefined;
      if (j?.session_id !== sessionId) continue;
      out.push({ j, ts: Number(ev.timestampMs ?? 0) });
    }
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}

async function fetchCalls(
  rpc: SuiJsonRpcClient,
  packageId: string,
  sessionId: string,
): Promise<DecodedCall[]> {
  const [emitted, closed] = await Promise.all([
    queryAllByType(rpc, `${packageId}::${ACTION_CALL_EMITTED}`, sessionId),
    queryAllByType(rpc, `${packageId}::${ACTION_CALL_CLOSED}`, sessionId),
  ]);
  // Index closed events by call_id (real end time / status / output blob).
  const closedById = new Map<string, { endedAt: number; status: number; outBlob: string | null }>();
  for (const { j } of closed) {
    closedById.set(String(j.call_id), {
      endedAt: Number(j.ended_at ?? 0),
      status: Number(j.status ?? 0),
      outBlob: (j.walrus_output_blob as string) || null,
    });
  }
  return emitted
    .sort((a, b) => a.ts - b.ts)
    .map(({ j }, sequence) => {
      const callId = String(j.call_id ?? "");
      const c = closedById.get(callId);
      return {
        sequence,
        callId,
        parentCallId: optParentId(j.parent_call_id),
        toolName: String(j.tool_name ?? ""),
        toolNamespace: String(j.tool_namespace ?? ""),
        capturedAt: Number(j.captured_at ?? 0),
        endedAt: c ? c.endedAt : null,
        status: c ? c.status : null,
        walrusInputBlob: (j.walrus_input_blob as string) || null,
        walrusOutputBlob: c?.outBlob ?? null,
        contentHash: (j.content_hash as number[]) ?? [],
        prevHash: (j.prev_hash as number[]) ?? [],
        linked: optParentId(j.parent_call_id) !== null,
      };
    });
}

/**
 * Read an ActionCall's `parent_call_id`. Sui serializes the Move `Option<ID>`
 * as a bare string in event payloads, or `{ vec: [...] }` in object fields —
 * normalize both (and null/absent) to a string-or-null.
 */
function optParentId(value: unknown): string | null {
  if (typeof value === "string") return value.length > 0 ? value : null;
  if (value && typeof value === "object" && "vec" in value) {
    const vec = (value as { vec?: unknown[] }).vec;
    const first = Array.isArray(vec) ? vec[0] : undefined;
    return typeof first === "string" ? first : null;
  }
  return null;
}

export async function fetchRecentSessions(limit = 25): Promise<SessionListItem[]> {
  const { rpc, packageId } = client();
  const page = await rpc.queryEvents({
    query: { MoveEventType: `${packageId}::${SESSION_OPENED}` },
    limit,
    order: "descending",
  });
  return page.data.map((ev) => {
    const j = (ev.parsedJson as Record<string, unknown>) ?? {};
    return {
      sessionId: String(j.session_id ?? ""),
      agentId: String(j.agent_id ?? ""),
      environment: String(j.environment ?? ""),
      namespaceId: String(j.namespace_id ?? ""),
      sdkVersion: String(j.sdk_version ?? ""),
      capturedByAddress: String(j.captured_by_address ?? ""),
      startedAtMs: Number(j.started_at ?? ev.timestampMs ?? 0),
      openedAtMs: Number(ev.timestampMs ?? 0),
    };
  });
}

export function suiscanObject(id: string): string {
  return `https://suiscan.xyz/${NETWORK}/object/${id}`;
}
