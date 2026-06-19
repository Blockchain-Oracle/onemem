import {
  type GlobalOpts,
  printJson,
  printLine,
  printTable,
  runCommand,
  shortHex,
  shortId,
} from "../util/output.js";
import { readContext } from "../util/sui.js";
import { fetchCalls, fetchSessionMeta, statusLabel } from "../util/trace.js";

type Cmd = { optsWithGlobals(): GlobalOpts };

/** `onemem trace get <session-id>` — on-chain session metadata. */
export function traceGet(sessionId: string, _o: unknown, command: Cmd) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const { client } = readContext(g.network);
    const meta = await fetchSessionMeta(client, sessionId);
    if (g.json) {
      printJson({ ...meta, statusLabel: statusLabel(meta.status) });
      return;
    }
    printLine(`session     ${meta.sessionId}`);
    printLine(`agent       ${meta.agentId}`);
    printLine(`environment ${meta.environment}`);
    printLine(`namespace   ${meta.namespaceId}`);
    printLine(`status      ${statusLabel(meta.status)}`);
    printLine(`calls       ${meta.callCount}`);
  });
}

/** `onemem trace events <session-id>` — the decoded ActionCall chain. */
export function traceEvents(sessionId: string, _o: unknown, command: Cmd) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const { client } = readContext(g.network);
    const meta = await fetchSessionMeta(client, sessionId);
    const calls = await fetchCalls(client, meta.packageId, sessionId);
    if (g.json) {
      printJson(
        calls.map((c) => ({
          sequence: c.sequence,
          toolName: c.toolName,
          toolNamespace: c.toolNamespace,
          walrusInputBlob: c.walrusInputBlob,
          contentHash: shortHex(c.contentHash, 64),
          prevHash: shortHex(c.prevHash, 64),
          linked: c.parentCallId != null,
        })),
      );
      return;
    }
    printTable(
      calls.map((c) => ({
        "#": String(c.sequence),
        tool: `${c.toolNamespace}/${c.toolName}`,
        chain: c.parentCallId ? "linked" : "root",
        content: shortHex(c.contentHash),
        blob: c.walrusInputBlob ? `${c.walrusInputBlob.slice(0, 14)}…` : "(empty)",
      })),
      ["#", "tool", "chain", "content", "blob"],
    );
  });
}

/**
 * `onemem trace list` — the 25 most recent TraceSessions opened on this package
 * (newest first), across all agents. Reads TraceSessionOpenedEvent.
 */
export function traceList(_o: unknown, command: Cmd) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const { client, eventPackageId } = readContext(g.network);
    const page = await client.queryEvents({
      query: { MoveEventType: `${eventPackageId}::events::TraceSessionOpenedEvent` },
      limit: 25,
      order: "descending",
    });
    const rows = page.data.map((ev) => {
      const j = (ev.parsedJson as Record<string, unknown>) ?? {};
      return {
        session: shortId(String(j.session_id ?? "")),
        agent: String(j.agent_id ?? ""),
        environment: String(j.environment ?? ""),
      };
    });
    if (g.json) {
      printJson(rows);
      return;
    }
    printTable(rows, ["session", "agent", "environment"]);
  });
}
