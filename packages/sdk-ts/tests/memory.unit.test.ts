// Unit tests for the kept memory path (MemoryAPI) — no network. Mocks
// MemWalManual.create with a canned rememberManual/recallManual so the
// relevance mapping + clamp, the vector-only-hit filter, the flattened add
// result, and the error wrapping all run in CI.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rememberManual = vi.fn(async () => ({ id: "mem-1", blob_id: "blob-1" }));
const recallManual = vi.fn(async () => ({ results: [] as unknown[] }));
const destroy = vi.fn();
const create = vi.fn(() => ({ rememberManual, recallManual, destroy }));

vi.mock("@mysten-incubation/memwal/manual", () => ({
  MemWalManual: { create: (...args: unknown[]) => create(...args) },
}));

import { OneMem } from "../src/client.js";
import { MemoryReadError, MemoryWriteError } from "../src/memory.js";

const PRIVATE_KEY = "suiprivkey1q" + "a".repeat(60);

const MEMORY_CONFIG = {
  delegateKey: "delegate",
  accountId: "0xacct",
  embeddingApiKey: "sk-embed",
  memwalPackageId: "0xpkg",
  relayerUrl: "https://relayer.example",
  suiPrivateKey: PRIVATE_KEY,
  // Ephemeral in-process index so unit tests never touch disk.
  indexPath: ":memory:",
};

async function makeMemory(configOverride: Record<string, unknown> = {}) {
  const onemem = await OneMem.create({
    network: "testnet",
    // Minimal signer stub — the memory path uses memory.suiPrivateKey for MemWal.
    signer: { toSuiAddress: () => "0xself" } as never,
    memory: { ...MEMORY_CONFIG, ...configOverride },
  });
  return onemem.requireMemory();
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.clearAllMocks());

describe("MemoryAPI.add", () => {
  it("returns the flattened result with a flat inputHashHex (no attestation object)", async () => {
    const memory = await makeMemory();
    const result = await memory.add("remember this");

    expect(result.memoryId).toBe("mem-1");
    expect(result.walrusBlobId).toBe("blob-1");
    expect(result.inputHashHex).toMatch(/^0x[0-9a-f]{64}$/);
    expect("attestation" in result).toBe(false);
    // With no namespace/userId/config namespace, effectiveNamespace = "default".
    expect(rememberManual).toHaveBeenCalledWith("remember this", "default");
  });

  it("wraps an underlying failure in MemoryWriteError (preserving the cause)", async () => {
    rememberManual.mockRejectedValueOnce(new Error("relayer down"));
    const memory = await makeMemory();

    await expect(memory.add("x")).rejects.toBeInstanceOf(MemoryWriteError);
    try {
      rememberManual.mockRejectedValueOnce(new Error("relayer down"));
      await memory.add("x");
    } catch (error) {
      expect((error as MemoryWriteError).cause).toBeInstanceOf(Error);
      expect(((error as MemoryWriteError).cause as Error).message).toBe("relayer down");
    }
  });
});

describe("MemoryAPI.search", () => {
  it("maps 1 - distance into relevance", async () => {
    recallManual.mockResolvedValueOnce({
      results: [{ blob_id: "b1", distance: 0.25, text: "hit" }],
    });
    const memory = await makeMemory();

    const { results } = await memory.search("q");
    expect(results).toEqual([{ text: "hit", walrusBlobId: "b1", relevance: 0.75 }]);
  });

  it("clamps relevance into [0, 1] for out-of-range distances", async () => {
    recallManual.mockResolvedValueOnce({
      results: [
        { blob_id: "neg", distance: 2, text: "far" }, // 1 - 2 = -1 → 0
        { blob_id: "big", distance: -0.5, text: "near" }, // 1 - (-0.5) = 1.5 → 1
      ],
    });
    const memory = await makeMemory();

    const { results } = await memory.search("q");
    expect(results.map((r) => r.relevance)).toEqual([0, 1]);
  });

  it('excludes vector-only hits (no "text" field)', async () => {
    recallManual.mockResolvedValueOnce({
      results: [
        { blob_id: "with-text", distance: 0.1, text: "kept" },
        { blob_id: "vector-only", distance: 0.2 }, // no text → dropped
      ],
    });
    const memory = await makeMemory();

    const { results } = await memory.search("q");
    expect(results).toHaveLength(1);
    expect(results[0]?.walrusBlobId).toBe("with-text");
  });

  it("wraps an underlying failure in MemoryReadError (preserving the cause)", async () => {
    recallManual.mockRejectedValueOnce(new Error("recall failed"));
    const memory = await makeMemory();

    await expect(memory.search("q")).rejects.toBeInstanceOf(MemoryReadError);
    try {
      recallManual.mockRejectedValueOnce(new Error("recall failed"));
      await memory.search("q");
    } catch (error) {
      expect(((error as MemoryReadError).cause as Error).message).toBe("recall failed");
    }
  });
});

describe("MemoryAPI effectiveNamespace derivation", () => {
  it("derives user:<id> when a userId but no explicit namespace is given", async () => {
    rememberManual.mockResolvedValueOnce({ id: "m-u", blob_id: "b-u" });
    const memory = await makeMemory();
    await memory.add("hi", { userId: "alice" });
    expect(rememberManual).toHaveBeenLastCalledWith("hi", "user:alice");
  });

  it("prefers an explicit namespace over the userId derivation", async () => {
    rememberManual.mockResolvedValueOnce({ id: "m-ns", blob_id: "b-ns" });
    const memory = await makeMemory();
    await memory.add("hi", { userId: "alice", namespace: "team:x" });
    expect(rememberManual).toHaveBeenLastCalledWith("hi", "team:x");
  });

  it("falls back to config.namespace, then 'default'", async () => {
    rememberManual.mockResolvedValueOnce({ id: "m-c", blob_id: "b-c" });
    const withConfigNs = await makeMemory({ namespace: "cfg" });
    await withConfigNs.add("hi");
    expect(rememberManual).toHaveBeenLastCalledWith("hi", "cfg");
  });
});

describe("MemoryAPI CRUD via the local index", () => {
  it("add mirrors a row that get/getAll return with scope + metadata", async () => {
    rememberManual.mockResolvedValueOnce({ id: "m1", blob_id: "b1" });
    const memory = await makeMemory();
    const added = await memory.add("alice likes dark mode", {
      userId: "alice",
      agentId: "ag1",
      runId: "run1",
      metadata: { topic: "prefs" },
    });
    expect(added.memoryId).toBe("m1");

    const got = await memory.get("m1");
    expect(got).toMatchObject({
      id: "m1",
      text: "alice likes dark mode",
      walrusBlobId: "b1",
      namespace: "user:alice",
      userId: "alice",
      agentId: "ag1",
      runId: "run1",
      metadata: { topic: "prefs" },
    });

    const all = await memory.getAll({ userId: "alice" });
    expect(all.map((m) => m.id)).toEqual(["m1"]);
    expect(await memory.getAll({ userId: "bob" })).toHaveLength(0);
  });

  it("getAll returns newest-first across multiple adds", async () => {
    const memory = await makeMemory();
    rememberManual.mockResolvedValueOnce({ id: "a", blob_id: "ba" });
    await memory.add("first", { userId: "u" });
    rememberManual.mockResolvedValueOnce({ id: "b", blob_id: "bb" });
    await memory.add("second", { userId: "u" });
    const all = await memory.getAll({ userId: "u" });
    expect(all[0]?.id).toBe("b");
    expect(all[1]?.id).toBe("a");
  });

  it("delete soft-deletes: get/getAll stop returning it (returns true once)", async () => {
    rememberManual.mockResolvedValueOnce({ id: "m1", blob_id: "b1" });
    const memory = await makeMemory();
    await memory.add("delete me", { userId: "alice" });

    expect(await memory.delete("m1")).toBe(true);
    expect(await memory.get("m1")).toBeNull();
    expect(await memory.getAll({ userId: "alice" })).toHaveLength(0);
    // Second delete is a no-op (already gone).
    expect(await memory.delete("m1")).toBe(false);
  });
});

describe("MemoryAPI search post-filtering against the index", () => {
  it("excludes soft-deleted blobs from search results", async () => {
    rememberManual.mockResolvedValueOnce({ id: "m1", blob_id: "b1" });
    rememberManual.mockResolvedValueOnce({ id: "m2", blob_id: "b2" });
    const memory = await makeMemory();
    await memory.add("kept", { userId: "alice" });
    await memory.add("gone", { userId: "alice" });
    await memory.delete("m2");

    recallManual.mockResolvedValueOnce({
      results: [
        { blob_id: "b1", distance: 0.1, text: "kept" },
        { blob_id: "b2", distance: 0.2, text: "gone" },
      ],
    });
    const { results } = await memory.search("q", { userId: "alice" });
    expect(results.map((r) => r.walrusBlobId)).toEqual(["b1"]);
  });

  it("applies agentId/metadata scope filters the namespace did not capture", async () => {
    const memory = await makeMemory();
    rememberManual.mockResolvedValueOnce({ id: "m1", blob_id: "b1" });
    await memory.add("for ag1", { namespace: "shared", agentId: "ag1", metadata: { k: "v" } });
    rememberManual.mockResolvedValueOnce({ id: "m2", blob_id: "b2" });
    await memory.add("for ag2", { namespace: "shared", agentId: "ag2", metadata: { k: "x" } });

    recallManual.mockResolvedValueOnce({
      results: [
        { blob_id: "b1", distance: 0.1, text: "for ag1" },
        { blob_id: "b2", distance: 0.2, text: "for ag2" },
      ],
    });
    const { results } = await memory.search("q", {
      namespace: "shared",
      agentId: "ag1",
      metadata: { k: "v" },
    });
    expect(results.map((r) => r.walrusBlobId)).toEqual(["b1"]);
  });

  it("keeps unindexed hits when NO filter is requested (fresh/cross-device writes surface)", async () => {
    const memory = await makeMemory();
    // No add() at all — the index is empty, so this blob is "fresh/unindexed".
    recallManual.mockResolvedValueOnce({
      results: [{ blob_id: "fresh", distance: 0.3, text: "just written" }],
    });
    const { results } = await memory.search("q");
    expect(results.map((r) => r.walrusBlobId)).toEqual(["fresh"]);
  });

  it("EXCLUDES unindexed hits when ANY filter is requested (can't verify the scope)", async () => {
    const memory = await makeMemory();
    // Index is empty — the hit has no record, so a scoped search can't verify it.
    recallManual.mockResolvedValueOnce({
      results: [{ blob_id: "fresh", distance: 0.3, text: "unverifiable" }],
    });
    expect((await memory.search("q", { userId: "alice" })).results).toHaveLength(0);
    recallManual.mockResolvedValueOnce({
      results: [{ blob_id: "fresh", distance: 0.3, text: "unverifiable" }],
    });
    expect((await memory.search("q", { metadata: { k: "v" } })).results).toHaveLength(0);
  });

  it("does not leak another user's memory under a shared namespace (userId post-filter)", async () => {
    const memory = await makeMemory();
    rememberManual.mockResolvedValueOnce({ id: "ma", blob_id: "ba" });
    await memory.add("alice secret", { namespace: "shared", userId: "alice" });
    rememberManual.mockResolvedValueOnce({ id: "mb", blob_id: "bb" });
    await memory.add("bob secret", { namespace: "shared", userId: "bob" });

    // Recall (namespace-wide) surfaces BOTH blobs; the userId post-filter must
    // keep only alice's.
    recallManual.mockResolvedValueOnce({
      results: [
        { blob_id: "ba", distance: 0.1, text: "alice secret" },
        { blob_id: "bb", distance: 0.2, text: "bob secret" },
      ],
    });
    const { results } = await memory.search("secret", { namespace: "shared", userId: "alice" });
    expect(results.map((r) => r.text)).toEqual(["alice secret"]);

    // getAll agrees: only alice's row under the shared namespace.
    expect((await memory.getAll({ userId: "alice" })).map((m) => m.text)).toEqual(["alice secret"]);
    expect((await memory.getAll({ userId: "bob" })).map((m) => m.text)).toEqual(["bob secret"]);
  });
});
