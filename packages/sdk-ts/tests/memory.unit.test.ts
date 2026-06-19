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
};

async function makeMemory() {
  const onemem = await OneMem.create({
    network: "testnet",
    // Minimal signer stub — the memory path uses memory.suiPrivateKey for MemWal.
    signer: { toSuiAddress: () => "0xself" } as never,
    memory: MEMORY_CONFIG,
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
    expect(rememberManual).toHaveBeenCalledWith("remember this", undefined);
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
