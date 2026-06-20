// Unit tests for the CLI memory commands — no network. Mocks the SDK client
// (OneMem.create → requireMemory()) plus the runtime/memory-config resolvers, so
// we can assert: scope flags (userId/agentId/runId/metadata) are threaded to the
// SDK; the --json vs table output branches; and get/delete missing-id messages.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Spies for the memory surface the commands call.
const add = vi.fn(async () => ({ memoryId: "m1", walrusBlobId: "blob1" }));
const search = vi.fn(async () => ({ results: [] as unknown[] }));
const getAll = vi.fn(async () => [] as unknown[]);
const get = vi.fn(async () => null as unknown);
const del = vi.fn(async () => false);

const requireMemory = vi.fn(() => ({ add, search, getAll, delete: del, get }));
const create = vi.fn(async () => ({ requireMemory }));

vi.mock("@onemem/sdk-ts", () => ({
  OneMem: { create: (...args: unknown[]) => create(...args) },
}));
vi.mock("@onemem/sdk-ts/runtime", () => ({
  resolveNetwork: (n?: string) => n ?? "testnet",
  resolveSigner: () => ({ toSuiAddress: () => "0xself" }),
}));
vi.mock("../src/util/memory-config.js", () => ({
  memoryConfigFromEnv: () => ({ accountId: "0xacct" }),
}));

import {
  addCommand,
  deleteCommand,
  getCommand,
  listCommand,
  searchCommand,
} from "../src/commands/memory.js";

/** Build a fake commander Command whose optsWithGlobals returns `g`. */
function cmd(g: { json?: boolean; network?: string } = {}) {
  return { optsWithGlobals: () => g };
}

let out: string[];
let err: string[];

beforeEach(() => {
  vi.clearAllMocks();
  out = [];
  err = [];
  vi.spyOn(process.stdout, "write").mockImplementation((chunk: unknown) => {
    out.push(String(chunk));
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk: unknown) => {
    err.push(String(chunk));
    return true;
  });
  process.exitCode = undefined;
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe("scope flag passthrough to the SDK", () => {
  it("add threads userId/agentId/runId/metadata (parsed) to the SDK", async () => {
    await addCommand(
      "remember this",
      {
        userId: "alice",
        agentId: "ag1",
        runId: "run1",
        namespace: "ns",
        metadata: '{"topic":"prefs"}',
      },
      cmd(),
    );
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith("remember this", {
      namespace: "ns",
      userId: "alice",
      agentId: "ag1",
      runId: "run1",
      metadata: { topic: "prefs" },
    });
  });

  it("search threads the same scope args plus a parsed topK", async () => {
    await searchCommand("q", { userId: "alice", agentId: "ag1", runId: "run1", topK: "5" }, cmd());
    expect(search).toHaveBeenCalledWith("q", {
      namespace: undefined,
      userId: "alice",
      agentId: "ag1",
      runId: "run1",
      metadata: undefined,
      topK: 5,
    });
  });

  it("list threads scope args plus a parsed limit to getAll", async () => {
    await listCommand({ userId: "bob", limit: "3" }, cmd());
    expect(getAll).toHaveBeenCalledWith({
      namespace: undefined,
      userId: "bob",
      agentId: undefined,
      runId: undefined,
      metadata: undefined,
      limit: 3,
    });
  });
});

describe("json vs table output branches", () => {
  it("add --json prints the raw result; default prints a human summary", async () => {
    await addCommand("x", {}, cmd({ json: true }));
    expect(JSON.parse(out.join(""))).toEqual({ memoryId: "m1", walrusBlobId: "blob1" });

    out.length = 0;
    await addCommand("x", {}, cmd());
    const text = out.join("");
    expect(text).toContain("✓ memory stored");
    expect(text).toContain("m1");
    expect(text).toContain("blob1");
  });

  it("search --json prints { results }; default prints a table with an id column", async () => {
    search.mockResolvedValueOnce({
      results: [{ id: "m1", text: "hi", walrusBlobId: "0xblobblobblob", relevance: 0.9 }],
    });
    await searchCommand("q", {}, cmd({ json: true }));
    expect(JSON.parse(out.join("")).results).toHaveLength(1);

    out.length = 0;
    search.mockResolvedValueOnce({
      results: [{ id: "m1", text: "hi", walrusBlobId: "0xblobblobblob", relevance: 0.9 }],
    });
    await searchCommand("q", {}, cmd());
    const text = out.join("");
    expect(text).toContain("id");
    expect(text).toContain("relevance");
    expect(text).toContain("m1");
  });

  it("search default shows '—' for a null-id (unindexed) hit", async () => {
    search.mockResolvedValueOnce({
      results: [{ id: null, text: "fresh", walrusBlobId: "0xblobblobblob", relevance: 0.5 }],
    });
    await searchCommand("q", {}, cmd());
    expect(out.join("")).toContain("—");
  });
});

describe("get/delete missing-id messages", () => {
  it("get prints a clear not-found line when the id is missing (default output)", async () => {
    get.mockResolvedValueOnce(null);
    await getCommand("nope", {}, cmd());
    expect(out.join("")).toContain("(no memory with id nope)");
  });

  it("get --json returns { memory: null } for a missing id", async () => {
    get.mockResolvedValueOnce(null);
    await getCommand("nope", {}, cmd({ json: true }));
    expect(JSON.parse(out.join(""))).toEqual({ memory: null });
  });

  it("delete prints the no-active-memory message when nothing was deleted", async () => {
    del.mockResolvedValueOnce(false);
    await deleteCommand("nope", {}, cmd());
    expect(out.join("")).toContain("(no active memory with id nope)");
  });

  it("delete --json returns { id, deleted:false } for a missing id", async () => {
    del.mockResolvedValueOnce(false);
    await deleteCommand("nope", {}, cmd({ json: true }));
    expect(JSON.parse(out.join(""))).toEqual({ id: "nope", deleted: false });
  });

  it("delete success prints the soft-delete note", async () => {
    del.mockResolvedValueOnce(true);
    await deleteCommand("m1", {}, cmd());
    const text = out.join("");
    expect(text).toContain("removed from local index");
    expect(text).toContain("persists on Walrus");
  });
});
