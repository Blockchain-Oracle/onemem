import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks: keep the unit tests off-chain ---------------------------------
const ensureTarget = vi.fn();
vi.mock("../src/provision.js", () => ({
  ensureTarget: (...a: unknown[]) => ensureTarget(...a),
  resolveSigner: () => ({ toSuiAddress: () => "0xtest" }),
}));

// The recorder delegates provisioning to ../src/provision.js (mocked above) and
// the flush to recordSession from @onemem/sdk-ts/runtime (mocked here); the
// Merkle-chain internals are covered in sdk-ts's own runtime.test.ts.
const recordSession = vi.fn(async () => ({ sessionId: "0xsession", callIds: ["0xcall1"] }));
const shouldTraceRuntime = vi.fn(() => true);
const createClient = vi.fn(async () => ({}));
vi.mock("@onemem/sdk-ts/runtime", () => ({
  OneMem: { create: (...a: unknown[]) => createClient(...a) },
  recordSession: (...a: unknown[]) => recordSession(...a),
  shouldTraceRuntime: (...a: unknown[]) => shouldTraceRuntime(...a),
}));

import { sessionKeyOf } from "../src/index.js";
import { loadConfig, TraceRecorder } from "../src/onemem-trace.js";

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of [
    "ONEMEM_NAMESPACE_ID",
    "ONEMEM_RW_CAP_ID",
    "SUI_NETWORK",
    "ONEMEM_PRIVATE_KEY",
  ]) {
    delete process.env[k];
  }
  ensureTarget.mockResolvedValue({ namespaceId: "0xns", rwCapId: "0xcap" });
  shouldTraceRuntime.mockReturnValue(true);
});

describe("loadConfig", () => {
  it("pluginConfig wins over env", () => {
    process.env.ONEMEM_NAMESPACE_ID = "0xenv";
    process.env.ONEMEM_RW_CAP_ID = "0xenvcap";
    const c = loadConfig({ namespaceId: "0xcfg", rwCapId: "0xcfgcap" });
    expect(c.target).toEqual({ namespaceId: "0xcfg", rwCapId: "0xcfgcap" });
  });

  it("falls back to env when override absent", () => {
    process.env.ONEMEM_NAMESPACE_ID = "0xenv";
    process.env.ONEMEM_RW_CAP_ID = "0xenvcap";
    expect(loadConfig().target).toEqual({ namespaceId: "0xenv", rwCapId: "0xenvcap" });
  });

  it("empty-string override falls through to env", () => {
    process.env.ONEMEM_NAMESPACE_ID = "0xenv";
    process.env.ONEMEM_RW_CAP_ID = "0xenvcap";
    expect(loadConfig({ namespaceId: "" }).target?.namespaceId).toBe("0xenv");
  });

  it("half-configured target (only namespace) is treated as unconfigured", () => {
    expect(loadConfig({ namespaceId: "0xonly" }).target).toBeUndefined();
  });

  it("no config + no env → no target (auto-provision)", () => {
    expect(loadConfig().target).toBeUndefined();
  });

  it("invalid network falls back to testnet; valid passes through", () => {
    expect(loadConfig({ network: "foonet" }).network).toBe("testnet");
    expect(loadConfig({ network: "mainnet" }).network).toBe("mainnet");
  });
});

describe("sessionKeyOf", () => {
  it("prefers ctx.sessionKey, then ctx.sessionId, then event fields", () => {
    expect(sessionKeyOf({}, { sessionKey: "a", sessionId: "b" })).toBe("a");
    expect(sessionKeyOf({}, { sessionId: "b" })).toBe("b");
    expect(sessionKeyOf({ sessionKey: "e" }, {})).toBe("e");
    expect(sessionKeyOf({ sessionId: "f" }, {})).toBe("f");
  });

  it("falls back to 'default' when nothing is present", () => {
    expect(sessionKeyOf({}, {})).toBe("default");
  });
});

describe("TraceRecorder", () => {
  const cfg = { network: "testnet" as const };

  it("buffers per session and isolates distinct keys; empty flush is a no-op", async () => {
    const r = new TraceRecorder(cfg);
    r.record("s1", { toolName: "t", input: 1, output: 2 });
    r.record("s2", { toolName: "u", input: 3, output: 4 });
    expect(await r.end("unknown")).toBeNull();
    expect(recordSession).not.toHaveBeenCalled();
    await r.end("s1");
    expect(recordSession).toHaveBeenCalledTimes(1);
    expect(recordSession.mock.calls[0][1].calls).toHaveLength(1);
  });

  it("does not buffer calls while runtime controls disable tracing", async () => {
    shouldTraceRuntime.mockReturnValue(false);
    const r = new TraceRecorder(cfg);
    r.record("s", { toolName: "a", input: 1, output: 2 });

    expect(await r.end("s")).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
    expect(recordSession).not.toHaveBeenCalled();
  });

  it("drops buffered calls at flush without client/network work when policy is disabled", async () => {
    const r = new TraceRecorder(cfg);
    r.record("s", { toolName: "a", input: 1, output: 2 });
    shouldTraceRuntime.mockReturnValue(false);

    expect(await r.end("s")).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
    expect(ensureTarget).not.toHaveBeenCalled();
    expect(recordSession).not.toHaveBeenCalled();
  });

  it("flushes the buffered calls as one session via recordSession", async () => {
    const r = new TraceRecorder(cfg);
    r.record("s", { toolName: "a", input: 1, output: 2 });
    r.record("s", { toolName: "b", input: 3, output: 4 });
    const id = await r.end("s");
    expect(id).toBe("0xsession");
    expect(recordSession).toHaveBeenCalledTimes(1);
    const args = recordSession.mock.calls[0][1];
    expect(args.target).toEqual({ namespaceId: "0xns", rwCapId: "0xcap" });
    expect(args.calls.map((c: { toolName: string }) => c.toolName)).toEqual(["a", "b"]);
  });

  it("a second end() for the same key is a no-op (buffer deleted on first flush)", async () => {
    const r = new TraceRecorder(cfg);
    r.record("s", { toolName: "a", input: 1, output: 2 });
    await r.end("s");
    recordSession.mockClear();
    expect(await r.end("s")).toBeNull();
    expect(recordSession).not.toHaveBeenCalled();
  });

  it("memoizes provisioning: concurrent flushes call ensureTarget once", async () => {
    const r = new TraceRecorder(cfg);
    r.record("s1", { toolName: "a", input: 1, output: 2 });
    r.record("s2", { toolName: "b", input: 3, output: 4 });
    await Promise.all([r.end("s1"), r.end("s2")]);
    expect(ensureTarget).toHaveBeenCalledTimes(1);
  });

  it("on no target, drops the session and warns; later flush retries provisioning", async () => {
    ensureTarget.mockResolvedValueOnce(null);
    const warn = vi.fn();
    const r = new TraceRecorder(cfg, { warn });
    r.record("s", { toolName: "a", input: 1, output: 2 });
    expect(await r.end("s")).toBeNull();
    expect(warn).toHaveBeenCalled();
    // memo cleared → a fresh session re-attempts provisioning
    r.record("s2", { toolName: "b", input: 3, output: 4 });
    await r.end("s2");
    expect(ensureTarget).toHaveBeenCalledTimes(2);
  });

  it("flush failure returns null and warns (never throws)", async () => {
    recordSession.mockRejectedValueOnce(new Error("rpc down"));
    const warn = vi.fn();
    const r = new TraceRecorder(cfg, { warn });
    r.record("s", { toolName: "a", input: 1, output: 2 });
    expect(await r.end("s")).toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("trace flush failed"));
  });
});
