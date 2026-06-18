import { describe, expect, it } from "vitest";
import {
  buildGroupedSessionExport,
  buildTraceSessionExport,
  GROUPED_EXPORT_PROOF_BOUNDARY,
  normalizeExportSessionIds,
  type SessionExportFetcher,
  TRACE_EXPORT_PROOF_BOUNDARY,
} from "./session-export";

const fakeFetcher: SessionExportFetcher = async (sessionId) => {
  if (sessionId === "0xmissing") return { error: "No TraceSession found" };
  return {
    meta: {
      sessionId,
      packageId: "0xpackage",
      agentId: "agent",
      environment: sessionId === "0x2" ? "hermes" : "claude-code",
      namespaceId: "0xnamespace",
      status: 1,
      callCount: 1,
    },
    verify: {
      ok: sessionId !== "0xbroken",
      brokenAt: sessionId === "0xbroken" ? 0 : null,
      expectedMerkleRoot: Uint8Array.from([1, 2, 3]),
      computedMerkleRoot: Uint8Array.from([1, 2, 3]),
      callCount: 1,
      sessionCallCount: 1,
      rootMatches: true,
      countMatches: true,
      sessionStatus: 1,
    },
    calls: [
      {
        sequence: 0,
        callId: `${sessionId}-call`,
        parentCallId: null,
        toolName: "Read",
        toolNamespace: "fs",
        capturedAt: 10_000,
        endedAt: 10_250,
        status: 1,
        walrusInputBlob: "blob-in",
        walrusOutputBlob: "blob-out",
        contentHash: [1, 2, 3],
        prevHash: [],
        linked: false,
      },
    ],
  };
};

describe("normalizeExportSessionIds", () => {
  it("dedupes, trims, and caps session ids", () => {
    const ids = Array.from({ length: 30 }, (_, i) => `0x${i}`);
    const result = normalizeExportSessionIds([" 0x1 ", "0x1", ...ids]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ids[0]).toBe("0x1");
      expect(result.ids).toHaveLength(25);
    }
  });

  it("rejects invalid input", () => {
    expect(normalizeExportSessionIds(undefined)).toEqual({
      ok: false,
      error: "sessionIds must be an array",
    });
    expect(normalizeExportSessionIds(["0x1", 2])).toEqual({
      ok: false,
      error: "sessionIds must contain only strings",
    });
    expect(normalizeExportSessionIds(["  "])).toEqual({
      ok: false,
      error: "sessionIds must include at least one id",
    });
  });
});

describe("buildGroupedSessionExport", () => {
  it("builds proof-scoped grouped export JSON", async () => {
    const grouped = await buildGroupedSessionExport(["0x1", "0x2"], fakeFetcher);

    expect(grouped.schema).toBe("onemem.grouped-session-export.v1");
    expect(grouped.proofBoundary).toBe(GROUPED_EXPORT_PROOF_BOUNDARY);
    expect(grouped.summary).toMatchObject({
      sessionCount: 2,
      availableSessionCount: 2,
      failedSessionCount: 0,
      callCount: 2,
      verifiedSessionCount: 2,
    });
    const first = grouped.sessions[0];
    expect(first?.available).toBe(true);
    if (first?.available) {
      expect(first.verify.expectedMerkleRoot).toBe("0x010203");
      expect(first.calls[0]).toMatchObject({
        toolName: "Read",
        statusLabel: "Success",
        contentHash: "0x010203",
        durationMs: 250,
      });
    }
  });

  it("keeps failed sessions in the export instead of hiding them", async () => {
    const grouped = await buildGroupedSessionExport(["0x1", "0xmissing"], fakeFetcher);

    expect(grouped.summary.failedSessionCount).toBe(1);
    expect(grouped.sessions[1]).toMatchObject({
      available: false,
      sessionId: "0xmissing",
      error: "No TraceSession found",
    });
  });
});

describe("buildTraceSessionExport", () => {
  it("builds proof-scoped single trace export JSON", async () => {
    const traceExport = await buildTraceSessionExport("0x1", fakeFetcher);

    expect(traceExport.schema).toBe("onemem.trace-session-export.v1");
    expect(traceExport.proofBoundary).toBe(TRACE_EXPORT_PROOF_BOUNDARY);
    expect(traceExport.source).toEqual({ kind: "trace-session", sessionId: "0x1" });
    expect(traceExport.session.sessionId).toBe("0x1");
    expect(traceExport.session.verify.ok).toBe(true);
    expect(traceExport.session.calls[0]).toMatchObject({
      toolName: "Read",
      contentHash: "0x010203",
      walrusInputBlob: "blob-in",
    });
  });

  it("rejects empty and missing trace exports", async () => {
    await expect(buildTraceSessionExport("   ", fakeFetcher)).rejects.toThrow(
      "sessionId must be a non-empty string",
    );
    await expect(buildTraceSessionExport("0xmissing", fakeFetcher)).rejects.toThrow(
      "No TraceSession found",
    );
  });
});
