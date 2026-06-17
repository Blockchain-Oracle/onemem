export interface ViewCall {
  sequence: number;
  callId: string;
  toolName: string;
  toolNamespace: string;
  startMs: number;
  durationMs: number;
  status: number | null; // 1 success, 2 failed, null open
  linked: boolean;
  parentCallId: string | null;
  contentHash: string;
  prevHash: string;
  walrusInputBlob: string | null;
  walrusOutputBlob: string | null;
}

export interface ViewMeta {
  sessionId: string;
  agentId: string;
  environment: string;
  namespaceId: string;
  status: number;
  statusLabel: string;
  callCount: number;
}

export interface ViewVerify {
  ok: boolean;
  brokenAt: number | null;
  callCount: number;
  merkleRoot: string;
}

export interface TraceViewProps {
  meta: ViewMeta;
  verify: ViewVerify;
  totalMs: number;
  calls: ViewCall[];
  suiscanHref: string;
}

// Runtime/namespace → Gantt bar colour class (mirrors trace.css rt-* classes).
export function rtClass(ns: string): string {
  if (ns.includes("hermes")) return "rt-hermes";
  if (ns.includes("mcp")) return "rt-mcp";
  return "rt-claude";
}
