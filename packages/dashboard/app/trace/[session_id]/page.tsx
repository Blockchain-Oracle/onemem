import Link from "next/link";
import { fetchSession, hex, statusLabel, suiscanObject } from "@/lib/trace";
import { TraceView } from "./TraceView";

export const dynamic = "force-dynamic";

type Params = Promise<{ session_id: string }>;

export default async function TracePage({ params }: { params: Params }) {
  const { session_id } = await params;
  const result = await fetchSession(session_id);

  if ("error" in result) {
    return (
      <div className="card" style={{ padding: 28, margin: "24px 0" }}>
        <Link href="/" className="muted" style={{ fontSize: 14 }}>
          ← all sessions
        </Link>
        <h1 style={{ fontSize: 22, marginTop: 14 }}>Session not found</h1>
        <p style={{ color: "var(--danger)" }}>{result.error}</p>
      </div>
    );
  }

  const { meta, calls, verify } = result;
  const minTs = calls.length ? Math.min(...calls.map((c) => c.capturedAt)) : 0;
  const maxTs = calls.length ? Math.max(...calls.map((c) => c.endedAt ?? c.capturedAt)) : 0;

  return (
    <TraceView
      meta={{ ...meta, statusLabel: statusLabel(meta.status) }}
      verify={{
        ok: verify.ok,
        brokenAt: verify.brokenAt,
        callCount: verify.callCount,
        merkleRoot: hex(verify.computedMerkleRoot),
      }}
      totalMs={Math.max(maxTs - minTs, 1)}
      calls={calls.map((c) => ({
        sequence: c.sequence,
        callId: c.callId,
        toolName: c.toolName,
        toolNamespace: c.toolNamespace,
        startMs: c.capturedAt - minTs,
        durationMs: c.endedAt ? Math.max(c.endedAt - c.capturedAt, 0) : 0,
        status: c.status,
        linked: c.linked,
        parentCallId: c.parentCallId,
        contentHash: hex(c.contentHash),
        prevHash: hex(c.prevHash),
        walrusInputBlob: c.walrusInputBlob,
        walrusOutputBlob: c.walrusOutputBlob,
      }))}
      suiscanHref={suiscanObject(meta.sessionId)}
    />
  );
}
