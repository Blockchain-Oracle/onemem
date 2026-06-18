// Trace reads built directly on JSON-RPC: the on-chain TraceSession object +
// its ActionCallEmittedEvent stream. No signer needed — this is the public,
// independently-verifiable view of a session.

import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { ACTION_CALL_EMITTED } from "./sui.js";

export interface SessionMeta {
  sessionId: string;
  packageId: string;
  agentId: string;
  environment: string;
  namespaceId: string;
  status: number;
  callCount: number;
}

export interface DecodedCall {
  readonly sequence: number;
  readonly toolName: string;
  readonly toolNamespace: string;
  readonly capturedAt: number;
  readonly capturedBy: string;
  readonly walrusInputBlob: string | null;
  readonly prevHash: number[];
  readonly contentHash: number[];
  readonly parentCallId: string | null;
}

const STATUS_LABELS: Record<number, string> = {
  0: "Active",
  1: "Completed",
  2: "Failed",
  3: "Aborted",
};

export function statusLabel(status: number): string {
  return STATUS_LABELS[status] ?? `Unknown(${status})`;
}

export async function fetchSessionMeta(
  client: SuiJsonRpcClient,
  sessionId: string,
): Promise<SessionMeta> {
  const obj = await client.getObject({
    id: sessionId,
    options: { showContent: true, showType: true },
  });
  const data = obj.data;
  const content = data?.content;
  if (!content || content.dataType !== "moveObject") {
    throw new Error(`no TraceSession object found at ${sessionId}`);
  }
  const f = content.fields as Record<string, unknown>;
  return {
    sessionId,
    packageId: traceSessionPackageId(String(data.type ?? "")),
    agentId: String(f.agent_id ?? ""),
    environment: String(f.environment ?? ""),
    namespaceId: String(f.namespace_id ?? ""),
    status: Number(f.status ?? 0),
    callCount: Number(f.call_count ?? 0),
  };
}

function traceSessionPackageId(type: string): string {
  const marker = "::trace::TraceSession";
  const index = type.indexOf(marker);
  if (index <= 0) throw new Error(`object is not trace::TraceSession: ${type}`);
  return type.slice(0, index);
}

/**
 * All ActionCalls for a session, ordered by capture time (ascending).
 *
 * Sui `queryEvents` can't filter by event field, so this scans the package's
 * ActionCallEmittedEvent stream and filters by session_id client-side — O(all
 * events). Fine at current scale; revisit (read the session object's call vector)
 * if the package accrues a large global event history.
 */
export async function fetchCalls(
  client: SuiJsonRpcClient,
  packageId: string,
  sessionId: string,
): Promise<DecodedCall[]> {
  const raw: Array<Omit<DecodedCall, "sequence">> = [];
  let cursor: Parameters<SuiJsonRpcClient["queryEvents"]>[0]["cursor"] = null;
  for (;;) {
    const page = await client.queryEvents({
      query: { MoveEventType: `${packageId}::${ACTION_CALL_EMITTED}` },
      cursor,
      limit: 50,
      order: "descending",
    });
    for (const ev of page.data) {
      const j = ev.parsedJson as Record<string, unknown> | undefined;
      if (j?.session_id !== sessionId) continue;
      raw.push({
        toolName: String(j.tool_name ?? ""),
        toolNamespace: String(j.tool_namespace ?? ""),
        capturedAt: Number(j.captured_at ?? 0),
        capturedBy: String(j.captured_by_address ?? ""),
        walrusInputBlob: (j.walrus_input_blob as string) || null,
        prevHash: (j.prev_hash as number[]) ?? [],
        contentHash: (j.content_hash as number[]) ?? [],
        parentCallId: optParentId(j.parent_call_id),
      });
    }
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  // sequence reflects capture order — assign it after sorting, not via mutation.
  return raw.sort((a, b) => a.capturedAt - b.capturedAt).map((c, sequence) => ({ ...c, sequence }));
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
