// Unit tests for the local SQLite index (SqliteMemoryIndex) — uses an in-memory
// db so there's no network and no disk. Covers put/get/list (scope + metadata
// filters)/softDelete/getByBlobIds and ACCOUNT ISOLATION (one db file,
// two accounts never see each other's rows).

import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { type MemoryIndexRecord, metadataMatches, SqliteMemoryIndex } from "../src/memory-index.js";

const ACCOUNT = "0xacct-a";

function rec(over: Partial<MemoryIndexRecord> & { id: string }): MemoryIndexRecord {
  return {
    blobId: `blob-${over.id}`,
    accountId: ACCOUNT,
    namespace: "default",
    text: `text-${over.id}`,
    createdAt: 1_000,
    deleted: false,
    ...over,
  };
}

let index: SqliteMemoryIndex;

beforeEach(() => {
  index = new SqliteMemoryIndex(ACCOUNT, ":memory:");
});
afterEach(() => index.close());

describe("SqliteMemoryIndex put/get", () => {
  it("round-trips a full record", () => {
    index.put(
      rec({
        id: "m1",
        userId: "alice",
        agentId: "ag1",
        runId: "run1",
        metadata: { topic: "move", n: 3 },
        inputHashHex: "0xabc",
        createdAt: 42,
      }),
    );
    const got = index.get("m1");
    expect(got).toMatchObject({
      id: "m1",
      blobId: "blob-m1",
      accountId: ACCOUNT,
      userId: "alice",
      agentId: "ag1",
      runId: "run1",
      metadata: { topic: "move", n: 3 },
      text: "text-m1",
      inputHashHex: "0xabc",
      createdAt: 42,
      deleted: false,
    });
  });

  it("upserts by id (put again overwrites)", () => {
    index.put(rec({ id: "m1", text: "first" }));
    index.put(rec({ id: "m1", text: "second" }));
    expect(index.get("m1")?.text).toBe("second");
  });

  it("returns null for a missing id", () => {
    expect(index.get("nope")).toBeNull();
  });
});

describe("SqliteMemoryIndex list filters", () => {
  beforeEach(() => {
    index.put(rec({ id: "u1", userId: "alice", createdAt: 1 }));
    index.put(rec({ id: "u2", userId: "alice", agentId: "ag1", createdAt: 2 }));
    index.put(rec({ id: "u3", userId: "bob", runId: "run9", createdAt: 3 }));
    index.put(rec({ id: "u4", userId: "alice", metadata: { topic: "move" }, createdAt: 4 }));
  });

  it("filters by userId", () => {
    const rows = index.list({ userId: "alice" });
    expect(rows.map((r) => r.id).sort()).toEqual(["u1", "u2", "u4"]);
  });

  it("filters by agentId", () => {
    expect(index.list({ agentId: "ag1" }).map((r) => r.id)).toEqual(["u2"]);
  });

  it("filters by runId", () => {
    expect(index.list({ runId: "run9" }).map((r) => r.id)).toEqual(["u3"]);
  });

  it("filters by metadata superset match", () => {
    expect(index.list({ metadata: { topic: "move" } }).map((r) => r.id)).toEqual(["u4"]);
    expect(index.list({ metadata: { topic: "rust" } })).toHaveLength(0);
  });

  it("AND-combines userId + metadata", () => {
    expect(index.list({ userId: "alice", metadata: { topic: "move" } }).map((r) => r.id)).toEqual([
      "u4",
    ]);
    expect(index.list({ userId: "bob", metadata: { topic: "move" } })).toHaveLength(0);
  });

  it("returns newest-first and honours limit", () => {
    const rows = index.list({ userId: "alice", limit: 2 });
    expect(rows.map((r) => r.id)).toEqual(["u4", "u2"]);
  });
});

describe("SqliteMemoryIndex softDelete", () => {
  it("hides a deleted row from get + list but reports it via getByBlobIds", () => {
    index.put(rec({ id: "m1" }));
    expect(index.softDelete("m1")).toBe(true);
    expect(index.get("m1")).toBeNull();
    expect(index.list()).toHaveLength(0);
    const byBlob = index.getByBlobIds(["blob-m1"]);
    expect(byBlob.get("blob-m1")?.deleted).toBe(true);
  });

  it("returns false when nothing was deleted (already gone)", () => {
    expect(index.softDelete("ghost")).toBe(false);
    index.put(rec({ id: "m1" }));
    index.softDelete("m1");
    expect(index.softDelete("m1")).toBe(false);
  });
});

describe("metadataMatches (order-insensitive subset)", () => {
  it("matches regardless of key order ({a:1,b:2} vs {b:2,a:1})", () => {
    expect(metadataMatches({ b: 2, a: 1 }, { a: 1, b: 2 })).toBe(true);
    expect(metadataMatches({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it("is a subset match (stored may carry extra keys)", () => {
    expect(metadataMatches({ a: 1, b: 2, c: 3 }, { a: 1 })).toBe(true);
    expect(metadataMatches({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("deep-compares nested values order-insensitively", () => {
    expect(metadataMatches({ k: { x: 1, y: 2 } }, { k: { y: 2, x: 1 } })).toBe(true);
    expect(metadataMatches({ k: { x: 1 } }, { k: { x: 2 } })).toBe(false);
    expect(metadataMatches({ k: [1, 2] }, { k: [1, 2] })).toBe(true);
    expect(metadataMatches({ k: [1, 2] }, { k: [2, 1] })).toBe(false);
  });

  it("returns false for missing metadata or missing key", () => {
    expect(metadataMatches(undefined, { a: 1 })).toBe(false);
    expect(metadataMatches({ b: 2 }, { a: 1 })).toBe(false);
  });
});

describe("SqliteMemoryIndex list metadata filter is order-insensitive", () => {
  it("matches a row whose stored metadata has the filter keys in a different order", () => {
    index.put(rec({ id: "m1", metadata: { a: 1, b: 2 } }));
    expect(index.list({ metadata: { b: 2, a: 1 } }).map((r) => r.id)).toEqual(["m1"]);
  });
});

describe("SqliteMemoryIndex getByBlobIds deleted-row tie-break", () => {
  it("prefers a LIVE row over a deleted one for the same blob_id (delete-then-re-add)", () => {
    // Identical plaintext deduped to one blob_id: first row added then deleted,
    // a later re-add reuses the same blob_id under a new id.
    index.put(rec({ id: "old", blobId: "dup-blob", createdAt: 100 }));
    expect(index.softDelete("old")).toBe(true);
    index.put(rec({ id: "new", blobId: "dup-blob", createdAt: 200, deleted: false }));

    const byBlob = index.getByBlobIds(["dup-blob"]);
    const hit = byBlob.get("dup-blob");
    expect(hit?.id).toBe("new");
    expect(hit?.deleted).toBe(false);
  });

  it("prefers a live row even when the deleted row is NEWER", () => {
    // Live row is older; a deleted row for the same blob is newer. Live still wins.
    index.put(rec({ id: "live", blobId: "dup2", createdAt: 100, deleted: false }));
    index.put(rec({ id: "dead", blobId: "dup2", createdAt: 999, deleted: true }));
    expect(index.getByBlobIds(["dup2"]).get("dup2")?.id).toBe("live");
  });

  it("returns a deleted row only when NO live row references the blob", () => {
    index.put(rec({ id: "d1", blobId: "dup3", createdAt: 100, deleted: true }));
    index.put(rec({ id: "d2", blobId: "dup3", createdAt: 200, deleted: true }));
    const hit = index.getByBlobIds(["dup3"]).get("dup3");
    // Both deleted → newest deleted row.
    expect(hit?.id).toBe("d2");
    expect(hit?.deleted).toBe(true);
  });
});

describe("SqliteMemoryIndex getByBlobIds namespace scoping", () => {
  it("resolves a blob deduped across namespaces to the record for the given namespace", () => {
    // Same blob_id referenced under two namespaces (dedup of identical plaintext).
    index.put(rec({ id: "n1", blobId: "shared-blob", namespace: "ns-a", userId: "alice" }));
    index.put(rec({ id: "n2", blobId: "shared-blob", namespace: "ns-b", userId: "bob" }));

    const inA = index.getByBlobIds(["shared-blob"], "ns-a");
    expect(inA.get("shared-blob")?.userId).toBe("alice");
    const inB = index.getByBlobIds(["shared-blob"], "ns-b");
    expect(inB.get("shared-blob")?.userId).toBe("bob");
    // Without a namespace, the lookup is namespace-blind (newest wins) — both rows considered.
    expect(index.getByBlobIds(["shared-blob"]).has("shared-blob")).toBe(true);
  });
});

describe("SqliteMemoryIndex account isolation", () => {
  it("scopes get/list/getByBlobIds to the constructed account (same db file)", () => {
    // Two accounts on the same physical db file must not see each other's rows.
    const file = join(mkdtempSync(join(tmpdir(), "onemem-idx-")), "shared.db");

    const a = new SqliteMemoryIndex("0xacct-a", file);
    const b = new SqliteMemoryIndex("0xacct-b", file);
    try {
      a.put({
        id: "ma",
        blobId: "blob-ma",
        accountId: "0xacct-a",
        namespace: "default",
        text: "from a",
        createdAt: 1,
        deleted: false,
      });
      b.put({
        id: "mb",
        blobId: "blob-mb",
        accountId: "0xacct-b",
        namespace: "default",
        text: "from b",
        createdAt: 2,
        deleted: false,
      });

      // Each account only sees its own rows.
      expect(a.get("mb")).toBeNull();
      expect(b.get("ma")).toBeNull();
      expect(a.list().map((r) => r.id)).toEqual(["ma"]);
      expect(b.list().map((r) => r.id)).toEqual(["mb"]);
      expect(a.getByBlobIds(["blob-ma", "blob-mb"]).has("blob-mb")).toBe(false);
      expect(b.getByBlobIds(["blob-ma", "blob-mb"]).has("blob-ma")).toBe(false);
    } finally {
      a.close();
      b.close();
    }
  });
});

describe("SqliteMemoryIndex construction failure", () => {
  it("throws MemoryIndexError when the path is unwritable", () => {
    // A path under a file (not a dir) is unwritable — mkdirSync fails.
    const dir = mkdtempSync(join(tmpdir(), "onemem-idx-fail-"));
    const fileAsDir = join(dir, "afile");
    writeFileSync(fileAsDir, "x");
    expect(() => new SqliteMemoryIndex(ACCOUNT, join(fileAsDir, "nested", "db.sqlite"))).toThrow(
      /memory index/i,
    );
  });
});
