// Unit tests for the shared memory recorder — no network. Mocks the OneMem
// client + signer/network resolution so recall/capture wiring + the
// never-break-the-host contract run in CI.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const search = vi.fn(async () => ({
  results: [{ text: "prior", walrusBlobId: "b", relevance: 0.9 }],
}));
const add = vi.fn(async () => ({ memoryId: "m", walrusBlobId: "b", attestation: {} }));
const create = vi.fn(async () => ({ requireMemory: () => ({ search, add }) }));

vi.mock("../src/client.js", () => ({ OneMem: { create: (...a: unknown[]) => create(...a) } }));
vi.mock("../src/runtime.js", () => ({
  resolveSigner: () => ({ toSuiAddress: () => "0xtest" }),
  resolveNetwork: () => "testnet",
}));

import {
  createMemoryRecorder,
  DEFAULT_RECALL_TOP_K,
  injectMemories,
  memoryConfigFromEnv,
} from "../src/runtime-memory.js";

const MEM = {
  delegateKey: "k",
  accountId: "a",
  embeddingApiKey: "e",
  memwalPackageId: "p",
  relayerUrl: "https://relayer",
};

beforeEach(() => vi.clearAllMocks());

describe("createMemoryRecorder", () => {
  it("is disabled (no client) when no memory config is present", async () => {
    const r = createMemoryRecorder({ memory: undefined, logger: {} });
    expect(r.enabled).toBe(false);
    expect(await r.recall("q")).toEqual([]);
    await r.capture("x");
    expect(create).not.toHaveBeenCalled();
  });

  it("stays disabled when enableMemory is false even with config present", async () => {
    const r = createMemoryRecorder({ memory: MEM, enableMemory: false, logger: {} });
    expect(r.enabled).toBe(false);
    expect(await r.recall("q")).toEqual([]);
    expect(await r.capture("x")).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("recall defaults topK to DEFAULT_RECALL_TOP_K", async () => {
    const r = createMemoryRecorder({ memory: MEM, logger: {} });
    await r.recall("hi");
    expect(search).toHaveBeenCalledWith("hi", { namespace: undefined, topK: DEFAULT_RECALL_TOP_K });
  });

  it("capture reports success/failure so callers can detect loss", async () => {
    const r = createMemoryRecorder({ memory: MEM, logger: {} });
    expect(await r.capture("ok")).toBe(true);
    add.mockRejectedValueOnce(new Error("relayer down"));
    expect(await r.capture("fails")).toBe(false);
  });

  it("rebuilds the client after a failed build (no poisoned-forever trap)", async () => {
    create.mockRejectedValueOnce(new Error("create failed"));
    const r = createMemoryRecorder({ memory: MEM, logger: { warn: vi.fn() } });
    expect(await r.recall("a")).toEqual([]); // first build rejects
    const out = await r.recall("b"); // second call rebuilds + succeeds
    expect(out.length).toBe(1);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it("recall vector-searches and returns the memories", async () => {
    const r = createMemoryRecorder({ memory: MEM, namespace: "ns", logger: {} });
    expect(r.enabled).toBe(true);
    const out = await r.recall("hello", 3);
    expect(out).toEqual([{ text: "prior", walrusBlobId: "b", relevance: 0.9 }]);
    expect(search).toHaveBeenCalledWith("hello", { namespace: "ns", topK: 3 });
  });

  it("capture stores the memory via add", async () => {
    const r = createMemoryRecorder({ memory: MEM, namespace: "ns", logger: {} });
    await r.capture("remember this");
    expect(add).toHaveBeenCalledWith("remember this", { namespace: "ns" });
  });

  it("recall returns [] and capture swallows on a OneMem failure (never breaks host)", async () => {
    search.mockRejectedValueOnce(new Error("relayer down"));
    add.mockRejectedValueOnce(new Error("relayer down"));
    const warn = vi.fn();
    const r = createMemoryRecorder({ memory: MEM, logger: { warn } });
    expect(await r.recall("q")).toEqual([]);
    await r.capture("x"); // must not throw
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("reuses one lazily-built client across calls", async () => {
    const r = createMemoryRecorder({ memory: MEM, logger: {} });
    await r.recall("a");
    await r.capture("b");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("skips empty query/text without touching the client", async () => {
    const r = createMemoryRecorder({ memory: MEM, logger: {} });
    expect(await r.recall("")).toEqual([]);
    await r.capture("");
    expect(create).not.toHaveBeenCalled();
  });
});

describe("memoryConfigFromEnv", () => {
  const KEYS = [
    "ONEMEM_ACCOUNT_ID",
    "ONEMEM_DELEGATE_KEY",
    "ONEMEM_EMBEDDING_API_KEY",
    "MEMWAL_PACKAGE_ID",
    "MEMWAL_RELAYER_URL",
    "ONEMEM_MEMWAL_NAMESPACE",
    "ONEMEM_CREDENTIALS_PATH",
  ];
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    process.env.ONEMEM_CREDENTIALS_PATH = `/tmp/onemem-runtime-memory-test-missing-${process.pid}`;
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("returns undefined unless all three required secrets are present", () => {
    expect(memoryConfigFromEnv()).toBeUndefined();
    process.env.ONEMEM_ACCOUNT_ID = "a";
    process.env.ONEMEM_DELEGATE_KEY = "k";
    expect(memoryConfigFromEnv()).toBeUndefined(); // embedding key still missing
  });

  it("builds config from env with sensible defaults when the three secrets are set", () => {
    process.env.ONEMEM_ACCOUNT_ID = "a";
    process.env.ONEMEM_DELEGATE_KEY = "k";
    process.env.ONEMEM_EMBEDDING_API_KEY = "e";
    const cfg = memoryConfigFromEnv();
    expect(cfg).toMatchObject({ accountId: "a", delegateKey: "k", embeddingApiKey: "e" });
    expect(cfg?.memwalPackageId).toBe(""); // unset → empty (caller/SDK supplies)
    expect(cfg?.relayerUrl).toContain("memory.walrus.xyz"); // defaulted
  });
});

describe("injectMemories", () => {
  it("returns the input unchanged when there are no memories", () => {
    expect(injectMemories("do X", [])).toBe("do X");
  });
  it("prepends a context block listing each memory", () => {
    const out = injectMemories("do X", [
      { text: "user likes dark mode", walrusBlobId: "b1", relevance: 0.9 },
      { text: "deadline is Friday", walrusBlobId: "b2", relevance: 0.7 },
    ]);
    expect(out).toContain("user likes dark mode");
    expect(out).toContain("deadline is Friday");
    expect(out.endsWith("do X")).toBe(true);
  });
});
