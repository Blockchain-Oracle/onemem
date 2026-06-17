import { describe, expect, it } from "vitest";
import type { MemoryRef } from "./memory";
import { filterMemories, relatedMemories, shortId } from "./memory-view";

const base: MemoryRef = {
  callId: "0xcall-a",
  sessionId: "0xsession-a",
  namespaceId: "0xnamespace-a",
  parentCallId: null,
  toolName: "memwal_write",
  toolNamespace: "hermes",
  walrusBlobId: "blob-a",
  inputHash: "0xinput-a",
  contentHash: "0xcontent-a",
  prevHash: "0xprev-a",
  sessionMerkleRoot: "0xroot-a",
  capturedByAddress: "0xowner-a",
  capturedAt: 1_000,
  eventTimestampMs: 1_000,
  txDigest: "tx-a",
  label: "treasury note",
};

describe("memory view helpers", () => {
  it("searches across real provenance fields", () => {
    const memories = [
      base,
      {
        ...base,
        callId: "0xcall-b",
        sessionId: "0xsession-b",
        namespaceId: "0xnamespace-b",
        toolNamespace: "openclaw",
        walrusBlobId: null,
        label: null,
      },
    ];

    expect(filterMemories(memories, "openclaw", "all")).toHaveLength(1);
    expect(filterMemories(memories, "tx-a", "all")[0]?.callId).toBe("0xcall-a");
    expect(filterMemories(memories, "missing", "all")).toHaveLength(0);
  });

  it("filters by honest metadata states", () => {
    const memories = [
      base,
      {
        ...base,
        callId: "0xcall-b",
        walrusBlobId: null,
        namespaceId: "0xnamespace-b",
        capturedAt: 1,
      },
    ];

    expect(filterMemories(memories, "", "with_blob")).toHaveLength(1);
    expect(filterMemories(memories, "", "without_blob")).toHaveLength(1);
    expect(filterMemories(memories, "", "active_namespace", "0xnamespace-a")).toHaveLength(1);
    expect(filterMemories(memories, "", "recent", null, 2_000)).toHaveLength(2);
    expect(filterMemories(memories, "", "recent", null, 86_402_000)).toHaveLength(0);
  });

  it("prefers same-session related memories before same-namespace", () => {
    const memories = [
      base,
      { ...base, callId: "0xcall-b", sessionId: "0xsession-a", namespaceId: "0xnamespace-a" },
      { ...base, callId: "0xcall-c", sessionId: "0xsession-c", namespaceId: "0xnamespace-a" },
    ];

    expect(relatedMemories(base, memories)).toEqual([
      { memory: memories[1], reason: "same session" },
      { memory: memories[2], reason: "same namespace" },
    ]);
  });

  it("shortens long ids without changing short values", () => {
    expect(shortId("0xabcdef", 4, 2)).toBe("0xabcdef");
    expect(shortId("0x1234567890abcdef", 6, 4)).toBe("0x1234...cdef");
  });
});
