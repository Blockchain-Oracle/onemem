// Memory reads for the dashboard. MemWal 0.0.5 exposes only remember(add) +
// recall(search) + restore — there is NO list/update/delete/history endpoint.
// So the memory LIST is derived from the on-chain truth: every `memory.add`
// emits an ActionCall with tool_name="memwal_write" carrying the Walrus blob id.
// That gives a real, verifiable inventory of memories (metadata). Plaintext is
// Seal-encrypted on Walrus and decrypts client-side with a SessionKey.

import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { addressesFor, type SuiNetwork } from "@onemem/sdk-ts";

const NETWORK: SuiNetwork = (process.env.ONEMEM_NETWORK as SuiNetwork) || "testnet";
const ACTION_CALL_EMITTED = "events::ActionCallEmittedEvent";
const MEMORY_TOOL = "memwal_write";

export interface MemoryRef {
  callId: string;
  sessionId: string;
  namespaceId: string;
  parentCallId: string | null;
  toolName: string;
  toolNamespace: string;
  walrusBlobId: string | null;
  inputHash: string;
  contentHash: string;
  prevHash: string;
  sessionMerkleRoot: string;
  capturedByAddress: string;
  capturedAt: number;
  eventTimestampMs: number;
  txDigest: string;
  label: string | null;
}

function hex(bytes: number[] | undefined): string {
  return bytes ? `0x${Buffer.from(bytes).toString("hex")}` : "";
}

function optionalString(value: unknown): string | null {
  if (typeof value === "string") return value.length > 0 ? value : null;
  if (value && typeof value === "object" && "vec" in value) {
    const first = (value as { vec?: unknown[] }).vec?.[0];
    return typeof first === "string" && first.length > 0 ? first : null;
  }
  return null;
}

function eventTxDigest(eventId: unknown): string {
  if (!eventId || typeof eventId !== "object" || !("txDigest" in eventId)) return "";
  const digest = (eventId as { txDigest?: unknown }).txDigest;
  return typeof digest === "string" ? digest : "";
}

/**
 * List memories for a namespace (or all) from on-chain memwal_write ActionCalls.
 * Pass namespaceId to scope; omit to list across all readable namespaces.
 */
export async function fetchMemories(namespaceId?: string, limit = 100): Promise<MemoryRef[]> {
  const addr = addressesFor(NETWORK);
  const rpc = new SuiJsonRpcClient({ network: NETWORK, url: addr.rpcUrl });
  const out: MemoryRef[] = [];
  let cursor: Parameters<SuiJsonRpcClient["queryEvents"]>[0]["cursor"] = null;
  for (;;) {
    const page = await rpc.queryEvents({
      query: { MoveEventType: `${addr.packageId}::${ACTION_CALL_EMITTED}` },
      cursor,
      limit: 50,
      order: "descending",
    });
    for (const ev of page.data) {
      const j = ev.parsedJson as Record<string, unknown> | undefined;
      if (!j || j.tool_name !== MEMORY_TOOL) continue;
      if (namespaceId && j.namespace_id !== namespaceId) continue;
      out.push({
        callId: String(j.call_id ?? ""),
        sessionId: String(j.session_id ?? ""),
        namespaceId: String(j.namespace_id ?? ""),
        parentCallId: optionalString(j.parent_call_id),
        toolName: String(j.tool_name ?? ""),
        toolNamespace: String(j.tool_namespace ?? ""),
        walrusBlobId: (j.walrus_input_blob as string) || null,
        inputHash: hex(j.input_hash as number[]),
        contentHash: hex(j.content_hash as number[]),
        prevHash: hex(j.prev_hash as number[]),
        sessionMerkleRoot: hex(j.new_session_merkle_root as number[]),
        capturedByAddress: String(j.captured_by_address ?? ""),
        capturedAt: Number(j.captured_at ?? 0),
        eventTimestampMs: Number(ev.timestampMs ?? 0),
        txDigest: eventTxDigest(ev.id),
        label: optionalString(j.label),
      });
      if (out.length >= limit) return out;
    }
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}
