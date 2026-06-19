// Namespace-scoped trace reads for the hosted "watch my deployed app" view.
// A deployed framework adapter (Vercel AI, etc.) writes TraceSessions to the
// user's namespace from a server; here we list them by namespace + optional
// environment, straight from on-chain events. There is NO "connected app"
// concept — a deployment shows up only because it actually emitted traces.
//
// Event types retain the ORIGINAL package id after an on-chain upgrade, so we
// query under originalPackageId (BUG-1-immune; mirrors cli-ts/src/util/sui.ts).

import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { addressesFor, type SuiNetwork } from "@onemem/sdk-ts";

export const NS_NETWORK: SuiNetwork = (process.env.ONEMEM_NETWORK as SuiNetwork) || "testnet";
const SESSION_OPENED = "events::TraceSessionOpenedEvent";

export interface NamespaceSession {
  readonly sessionId: string;
  readonly agentId: string;
  readonly environment: string;
  readonly namespaceId: string;
  readonly openedAtMs: number;
}

/** List a namespace's trace sessions (newest first), optionally one environment. */
export async function fetchNamespaceSessions(
  namespaceId: string,
  opts: { environment?: string; limit?: number } = {},
): Promise<NamespaceSession[]> {
  const addr = addressesFor(NS_NETWORK);
  const eventPackageId = addr.originalPackageId || addr.packageId;
  const rpc = new SuiJsonRpcClient({ network: NS_NETWORK, url: addr.rpcUrl });
  const out: NamespaceSession[] = [];
  const limit = opts.limit ?? 100;
  let cursor: Parameters<SuiJsonRpcClient["queryEvents"]>[0]["cursor"] = null;

  for (;;) {
    const page = await rpc.queryEvents({
      query: { MoveEventType: `${eventPackageId}::${SESSION_OPENED}` },
      cursor,
      limit: 50,
      order: "descending",
    });
    for (const ev of page.data) {
      const j = ev.parsedJson as Record<string, unknown> | undefined;
      if (!j || j.namespace_id !== namespaceId) continue;
      const environment = String(j.environment ?? "");
      if (opts.environment && environment !== opts.environment) continue;
      out.push({
        sessionId: String(j.session_id ?? ""),
        agentId: String(j.agent_id ?? ""),
        environment,
        namespaceId: String(j.namespace_id ?? ""),
        openedAtMs: Number(ev.timestampMs ?? 0),
      });
      if (out.length >= limit) return out;
    }
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return out;
}
