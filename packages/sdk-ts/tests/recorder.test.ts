import { afterEach, describe, expect, it, vi } from "vitest";

// Mock the client so the recorder needs no chain/network. recordSession +
// ensureNamespace (same module as createTraceRecorder) operate on this fake.
const startSession = vi.fn(async () => ({ sessionId: "0xsess" }));
const appendCall = vi.fn(async () => ({ callId: "0xc" }));
const closeCall = vi.fn(async () => ({}));
const endSession = vi.fn(async () => ({}));
const nsCreate = vi.fn(async () => ({ namespaceId: "0xprov", adminCapId: "0xadmin" }));
const shareRW = vi.fn(async () => ({ capId: "0xprovcap" }));
const create = vi.fn(async () => ({
  signer: { toSuiAddress: () => "0xme" },
  addresses: { packageId: "0xpkg" },
  client: { getBalance: async () => ({ totalBalance: "1" }) },
  traces: { startSession, appendCall, closeCall, endSession },
  namespaces: { create: nsCreate, shareReadWrite: shareRW },
}));
vi.mock("../src/client.js", () => ({ OneMem: { create: (...a: unknown[]) => create(...a) } }));

import { createTraceRecorder } from "../src/runtime.js";

const SILENT = {};
const TARGET = { namespaceId: "0xns", rwCapId: "0xcap" };
const tick = () => new Promise((r) => setTimeout(r, 15));

afterEach(() => {
  for (const f of [startSession, appendCall, closeCall, endSession, nsCreate, shareRW, create])
    f.mockClear();
  for (const k of [
    "ONEMEM_NAMESPACE_ID",
    "ONEMEM_RW_CAP_ID",
    "ONEMEM_RUNTIME_CONTROLS_PATH",
    "SUI_NETWORK",
  ])
    delete process.env[k];
});

describe("createTraceRecorder", () => {
  it("records a session for the buffered calls (fire-and-forget) with the explicit target", async () => {
    let id = "";
    const rec = createTraceRecorder({
      target: TARGET,
      agentId: "x",
      onTrace: (s) => (id = s),
      logger: SILENT,
    });
    rec.record([{ toolName: "t", input: 1, output: 2 }]);
    await tick();
    expect(startSession).toHaveBeenCalledTimes(1);
    expect(startSession.mock.calls[0][0]).toMatchObject({ namespaceId: "0xns", agentId: "x" });
    expect(appendCall).toHaveBeenCalledTimes(1);
    expect(endSession).toHaveBeenCalledTimes(1);
    expect(id).toBe("0xsess");
    expect(nsCreate).not.toHaveBeenCalled(); // explicit target → no provisioning
  });

  it("memoizes the client across many records", async () => {
    const rec = createTraceRecorder({ target: TARGET, logger: SILENT });
    rec.record([{ toolName: "a", input: 1, output: 2 }]);
    rec.record([{ toolName: "b", input: 3, output: 4 }]);
    await tick();
    expect(create).toHaveBeenCalledTimes(1);
    expect(startSession).toHaveBeenCalledTimes(2);
  });

  it("uses env target when no explicit target (no provisioning)", async () => {
    process.env.ONEMEM_NAMESPACE_ID = "0xenvns";
    process.env.ONEMEM_RW_CAP_ID = "0xenvcap";
    const rec = createTraceRecorder({ logger: SILENT });
    rec.record([{ toolName: "t", input: 1, output: 2 }]);
    await tick();
    expect(startSession.mock.calls[0][0]).toMatchObject({ namespaceId: "0xenvns" });
    expect(nsCreate).not.toHaveBeenCalled();
  });

  it("enableTrace:false records nothing", async () => {
    const rec = createTraceRecorder({ target: TARGET, enableTrace: false, logger: SILENT });
    rec.record([{ toolName: "t", input: 1, output: 2 }]);
    await tick();
    expect(startSession).not.toHaveBeenCalled();
  });

  it("runtime controls can skip recording before client creation", async () => {
    process.env.ONEMEM_RUNTIME_CONTROLS_PATH = `/tmp/onemem-controls-missing-${process.pid}`;
    const { setRuntimePaused } = await import("../src/runtime-controls.js");
    setRuntimePaused("vercel-ai", true);
    const rec = createTraceRecorder({ target: TARGET, environment: "vercel-ai", logger: SILENT });

    rec.record([{ toolName: "t", input: 1, output: 2 }]);
    await tick();

    expect(create).not.toHaveBeenCalled();
    expect(startSession).not.toHaveBeenCalled();
  });

  it("empty calls is a no-op", async () => {
    const rec = createTraceRecorder({ target: TARGET, logger: SILENT });
    rec.record([]);
    await tick();
    expect(startSession).not.toHaveBeenCalled();
  });

  it("resets the memoized client on failure so the next record retries", async () => {
    create.mockRejectedValueOnce(new Error("transient"));
    const rec = createTraceRecorder({ target: TARGET, logger: SILENT });
    rec.record([{ toolName: "a", input: 1, output: 2 }]); // first attempt: client.create rejects
    await tick();
    rec.record([{ toolName: "b", input: 3, output: 4 }]); // second attempt: should retry create
    await tick();
    expect(create).toHaveBeenCalledTimes(2); // memo was reset on rejection
    expect(startSession).toHaveBeenCalledTimes(1); // only the 2nd (recovered) attempt records
  });

  it("a recording failure never throws (swallowed + warned)", async () => {
    startSession.mockRejectedValueOnce(new Error("rpc down"));
    const warn = vi.fn();
    const rec = createTraceRecorder({ target: TARGET, logger: { warn } });
    expect(() => rec.record([{ toolName: "t", input: 1, output: 2 }])).not.toThrow();
    await tick();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("trace failed"));
  });
});
