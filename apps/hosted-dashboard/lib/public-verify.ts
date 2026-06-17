import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { addressesFor, type SuiNetwork, type VerifyResult, verifyTraceChain } from "@onemem/sdk-ts";

export const PUBLIC_VERIFY_NETWORK: SuiNetwork =
  (process.env.ONEMEM_NETWORK as SuiNetwork) || "testnet";

const ACTION_CALL_EMITTED = "events::ActionCallEmittedEvent";
type EventCursor = Parameters<SuiJsonRpcClient["queryEvents"]>[0]["cursor"];

interface PublicVerifyRpc {
  getObject(input: {
    readonly id: string;
    readonly options: { readonly showContent: true };
  }): Promise<{ readonly data?: { readonly content?: unknown } | null }>;
  queryEvents(input: {
    readonly query: { readonly MoveEventType: string };
    readonly cursor: EventCursor;
    readonly order: "ascending";
    readonly limit: number;
  }): Promise<{
    readonly data: readonly PublicVerifyEvent[];
    readonly hasNextPage: boolean;
    readonly nextCursor?: EventCursor;
  }>;
}

interface PublicVerifyDeps {
  readonly rpc?: PublicVerifyRpc;
  readonly packageId?: string;
  readonly network?: SuiNetwork;
  readonly verifier?: typeof verifyTraceChain;
}

interface PublicVerifyEvent {
  readonly id?: { readonly txDigest?: string; readonly eventSeq?: string };
  readonly timestampMs?: string | number;
  readonly parsedJson?: unknown;
}

interface TraceSessionFields {
  readonly agent_id?: unknown;
  readonly environment?: unknown;
  readonly status?: unknown;
}

export interface PublicVerifyCall {
  readonly sequence: number;
  readonly callId: string;
  readonly toolNamespace: string;
  readonly toolName: string;
  readonly label: string;
  readonly txDigest: string | null;
  readonly timestampMs: number;
}

export interface PublicVerifyData {
  readonly sessionId: string;
  readonly agentId: string;
  readonly environment: string;
  readonly statusLabel: string;
  readonly verify: VerifyResult;
  readonly calls: readonly PublicVerifyCall[];
  readonly expectedRoot: string;
  readonly computedRoot: string;
  readonly callEvidenceMatchesVerifier: boolean;
  readonly suiscan: string;
}

export function hexOf(bytes: number[] | Uint8Array | undefined): string {
  return bytes ? `0x${Buffer.from(bytes).toString("hex")}` : "";
}

export function shortId(value: string | null | undefined, head = 12, tail = 8): string {
  if (!value) return "none";
  return value.length > head + tail + 3 ? `${value.slice(0, head)}...${value.slice(-tail)}` : value;
}

export function rootPreview(value: string): string {
  return value ? `${value.slice(0, 26)}...${value.slice(-8)}` : "none";
}

function statusLabel(status: number): string {
  if (status === 0) return "Active";
  if (status === 1) return "Completed";
  if (status === 2) return "Failed";
  if (status === 3) return "Aborted";
  return `Unknown(${status})`;
}

function parseSessionFields(content: unknown): TraceSessionFields {
  const object = content as { readonly dataType?: string; readonly fields?: TraceSessionFields };
  if (object?.dataType !== "moveObject" || !object.fields) {
    throw new Error("No TraceSession at this id");
  }
  return object.fields;
}

export async function fetchPublicVerifyCalls(
  rpc: PublicVerifyRpc,
  packageId: string,
  sessionId: string,
): Promise<PublicVerifyCall[]> {
  const eventType = `${packageId}::${ACTION_CALL_EMITTED}`;
  const calls: PublicVerifyCall[] = [];
  let cursor: EventCursor = null;

  for (;;) {
    const page = await rpc.queryEvents({
      query: { MoveEventType: eventType },
      cursor,
      order: "ascending",
      limit: 100,
    });

    for (const event of page.data) {
      const fields = event.parsedJson as Record<string, unknown> | undefined;
      if (!fields || fields.session_id !== sessionId) continue;
      const toolNamespace = String(fields.tool_namespace ?? "");
      const toolName = String(fields.tool_name ?? "");
      calls.push({
        sequence: calls.length + 1,
        callId: String(fields.call_id ?? ""),
        toolNamespace,
        toolName,
        label: [toolNamespace, toolName].filter(Boolean).join("/") || "unknown call",
        txDigest: event.id?.txDigest ?? null,
        timestampMs: Number(event.timestampMs ?? 0),
      });
    }

    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }

  return calls;
}

export async function loadPublicVerifySession(
  sessionId: string,
  deps: PublicVerifyDeps = {},
): Promise<PublicVerifyData> {
  const network = deps.network ?? PUBLIC_VERIFY_NETWORK;
  const addr = addressesFor(network);
  const packageId = deps.packageId ?? addr.packageId;
  const rpc = deps.rpc ?? new SuiJsonRpcClient({ network, url: addr.rpcUrl });
  const verifier = deps.verifier ?? verifyTraceChain;

  const obj = await rpc.getObject({ id: sessionId, options: { showContent: true } });
  const fields = parseSessionFields(obj.data?.content);
  const [verify, calls] = await Promise.all([
    verifier(rpc as SuiJsonRpcClient, packageId, sessionId),
    fetchPublicVerifyCalls(rpc as PublicVerifyRpc, packageId, sessionId),
  ]);
  const expectedRoot = hexOf(verify.expectedMerkleRoot);
  const computedRoot = hexOf(verify.computedMerkleRoot);

  return {
    sessionId,
    agentId: String(fields.agent_id ?? ""),
    environment: String(fields.environment ?? ""),
    statusLabel: statusLabel(Number(fields.status ?? verify.sessionStatus)),
    verify,
    calls,
    expectedRoot,
    computedRoot,
    callEvidenceMatchesVerifier: calls.length === verify.callCount,
    suiscan: `https://suiscan.xyz/${network}/object/${sessionId}`,
  };
}
