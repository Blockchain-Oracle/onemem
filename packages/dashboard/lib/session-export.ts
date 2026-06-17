import { fetchSession, hex, NETWORK, statusLabel } from "./trace";

export const MAX_GROUPED_EXPORT_IDS = 25;
export const GROUPED_EXPORT_SCHEMA = "onemem.grouped-session-export.v1";
export const TRACE_EXPORT_SCHEMA = "onemem.trace-session-export.v1";
export const GROUPED_EXPORT_PROOF_BOUNDARY =
  "This grouped export is reconstructed from on-chain TraceSession objects and events. It proves Merkle-chain integrity for each included TraceSession when verification succeeds. It does not prove plaintext content, model intent, or real-world correctness.";
export const TRACE_EXPORT_PROOF_BOUNDARY =
  "This trace export is reconstructed from one on-chain TraceSession object and its ActionCall events. It proves Merkle-chain integrity when verification succeeds. It does not include plaintext content, decrypt Walrus blobs, prove model intent, or prove real-world correctness.";

export type SessionExportInput = { ok: true; ids: string[] } | { ok: false; error: string };

export interface GroupedSessionExport {
  schema: typeof GROUPED_EXPORT_SCHEMA;
  generatedAt: string;
  network: string;
  proofBoundary: string;
  source: {
    kind: "dashboard-derived-group";
    sessionIds: string[];
    maxSessionIds: number;
  };
  summary: {
    sessionCount: number;
    availableSessionCount: number;
    failedSessionCount: number;
    callCount: number;
    verifiedSessionCount: number;
  };
  sessions: GroupedSessionExportSession[];
}

export interface TraceSessionExport {
  schema: typeof TRACE_EXPORT_SCHEMA;
  generatedAt: string;
  network: string;
  proofBoundary: string;
  source: {
    kind: "trace-session";
    sessionId: string;
  };
  session: GroupedSessionExportAvailableSession;
}

export type GroupedSessionExportSession =
  | GroupedSessionExportAvailableSession
  | GroupedSessionExportUnavailableSession;

export interface GroupedSessionExportAvailableSession {
  available: true;
  sessionId: string;
  shortId: string;
  agentId: string;
  runtime: string;
  namespaceId: string;
  status: number;
  statusLabel: string;
  callCount: number;
  verify: {
    ok: boolean;
    brokenAt: number | null;
    callCount: number;
    sessionStatus: number;
    expectedMerkleRoot: string;
    computedMerkleRoot: string;
  };
  calls: GroupedSessionExportCall[];
}

export interface GroupedSessionExportUnavailableSession {
  available: false;
  sessionId: string;
  shortId: string;
  error: string;
}

export interface GroupedSessionExportCall {
  sequence: number;
  callId: string;
  parentCallId: string | null;
  toolName: string;
  toolNamespace: string;
  capturedAt: number;
  endedAt: number | null;
  startMs: number;
  durationMs: number;
  status: number | null;
  statusLabel: string;
  linked: boolean;
  contentHash: string;
  prevHash: string;
  walrusInputBlob: string | null;
  walrusOutputBlob: string | null;
}

type FetchSessionResult = Awaited<ReturnType<typeof fetchSession>>;
export type SessionExportFetcher = (sessionId: string) => Promise<FetchSessionResult>;

export function normalizeExportSessionIds(value: unknown): SessionExportInput {
  if (!Array.isArray(value)) {
    return { ok: false, error: "sessionIds must be an array" };
  }
  if (!value.every((id) => typeof id === "string")) {
    return { ok: false, error: "sessionIds must contain only strings" };
  }
  const ids = [...new Set(value.map((id) => id.trim()).filter(Boolean))].slice(
    0,
    MAX_GROUPED_EXPORT_IDS,
  );
  if (ids.length === 0) {
    return { ok: false, error: "sessionIds must include at least one id" };
  }
  return { ok: true, ids };
}

export async function buildGroupedSessionExport(
  sessionIds: string[],
  fetcher: SessionExportFetcher = fetchSession,
): Promise<GroupedSessionExport> {
  const normalized = normalizeExportSessionIds(sessionIds);
  if (!normalized.ok) {
    throw new Error(normalized.error);
  }

  const sessions = await Promise.all(normalized.ids.map((id) => exportOneSession(id, fetcher)));
  const available = sessions.filter(
    (session): session is GroupedSessionExportAvailableSession => session.available,
  );
  const verifiedSessionCount = available.filter((session) => session.verify.ok).length;
  const callCount = available.reduce((sum, session) => sum + session.calls.length, 0);

  return {
    schema: GROUPED_EXPORT_SCHEMA,
    generatedAt: new Date().toISOString(),
    network: NETWORK,
    proofBoundary: GROUPED_EXPORT_PROOF_BOUNDARY,
    source: {
      kind: "dashboard-derived-group",
      sessionIds: normalized.ids,
      maxSessionIds: MAX_GROUPED_EXPORT_IDS,
    },
    summary: {
      sessionCount: sessions.length,
      availableSessionCount: available.length,
      failedSessionCount: sessions.length - available.length,
      callCount,
      verifiedSessionCount,
    },
    sessions,
  };
}

export async function buildTraceSessionExport(
  sessionId: string,
  fetcher: SessionExportFetcher = fetchSession,
): Promise<TraceSessionExport> {
  const normalized = sessionId.trim();
  if (!normalized) {
    throw new Error("sessionId must be a non-empty string");
  }
  const session = await exportOneSession(normalized, fetcher);
  if (!session.available) {
    throw new Error(session.error);
  }
  return {
    schema: TRACE_EXPORT_SCHEMA,
    generatedAt: new Date().toISOString(),
    network: NETWORK,
    proofBoundary: TRACE_EXPORT_PROOF_BOUNDARY,
    source: {
      kind: "trace-session",
      sessionId: normalized,
    },
    session,
  };
}

async function exportOneSession(
  sessionId: string,
  fetcher: SessionExportFetcher,
): Promise<GroupedSessionExportSession> {
  const result = await fetcher(sessionId);
  if ("error" in result) {
    return {
      available: false,
      sessionId,
      shortId: shortId(sessionId),
      error: result.error,
    };
  }

  const firstCapture = result.calls[0]?.capturedAt ?? 0;
  return {
    available: true,
    sessionId,
    shortId: shortId(sessionId),
    agentId: result.meta.agentId,
    runtime: result.meta.environment,
    namespaceId: result.meta.namespaceId,
    status: result.meta.status,
    statusLabel: statusLabel(result.meta.status),
    callCount: result.meta.callCount,
    verify: {
      ok: result.verify.ok,
      brokenAt: result.verify.brokenAt,
      callCount: result.verify.callCount,
      sessionStatus: Number(result.verify.sessionStatus),
      expectedMerkleRoot: hex(result.verify.expectedMerkleRoot),
      computedMerkleRoot: hex(result.verify.computedMerkleRoot),
    },
    calls: result.calls.map((call) => ({
      sequence: call.sequence,
      callId: call.callId,
      parentCallId: call.parentCallId,
      toolName: call.toolName,
      toolNamespace: call.toolNamespace,
      capturedAt: call.capturedAt,
      endedAt: call.endedAt,
      startMs: firstCapture ? Math.max(0, call.capturedAt - firstCapture) : 0,
      durationMs: call.endedAt ? Math.max(0, call.endedAt - call.capturedAt) : 0,
      status: call.status,
      statusLabel: callStatusLabel(call.status),
      linked: call.linked,
      contentHash: hex(call.contentHash),
      prevHash: hex(call.prevHash),
      walrusInputBlob: call.walrusInputBlob,
      walrusOutputBlob: call.walrusOutputBlob,
    })),
  };
}

function callStatusLabel(status: number | null): string {
  if (status === 1) return "Success";
  if (status === 2) return "Failed";
  return "Open";
}

function shortId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}
