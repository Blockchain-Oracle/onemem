import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionListItem } from "./trace";

const mocks = vi.hoisted(() => ({
  fetchRecentSessions: vi.fn(),
}));

vi.mock("@/lib/trace", () => ({
  fetchRecentSessions: mocks.fetchRecentSessions,
}));

import { fetchRuntimeInventory, updateRuntimeControl } from "./runtimes";

let dir = "";

function session(environment: string, openedAtMs: number): SessionListItem {
  return {
    sessionId: `0x${environment}`,
    agentId: environment,
    environment,
    namespaceId: "0xnamespace",
    sdkVersion: "0.1.0",
    capturedByAddress: "0xabc",
    startedAtMs: openedAtMs,
    openedAtMs,
  };
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "onemem-dashboard-runtimes-"));
  process.env.ONEMEM_RUNTIME_CONTROLS_PATH = join(dir, "runtime-controls.json");
  mocks.fetchRecentSessions.mockReset();
});

afterEach(() => {
  delete process.env.ONEMEM_RUNTIME_CONTROLS_PATH;
  rmSync(dir, { recursive: true, force: true });
});

describe("fetchRuntimeInventory", () => {
  it("merges known runtimes, real session recency, and local policy", async () => {
    mocks.fetchRecentSessions.mockResolvedValue([
      session("vercel-ai", Date.now()),
      session("vercel-ai", Date.now() - 1_000),
      session("openclaw", Date.now() - 2_000),
    ]);
    updateRuntimeControl("vercel-ai", { paused: true });

    const inventory = await fetchRuntimeInventory();
    const vercel = inventory.runtimes.find((row) => row.id === "vercel-ai");
    const codex = inventory.runtimes.find((row) => row.id === "codex");
    const hermes = inventory.runtimes.find((row) => row.id === "hermes");

    expect(inventory.controlsFile).toBe(process.env.ONEMEM_RUNTIME_CONTROLS_PATH);
    expect(vercel).toMatchObject({
      sessions: 2,
      paused: true,
      statusLabel: "paused",
      coverage: "enforced",
    });
    expect(codex).toMatchObject({
      coverage: "enforced",
      installCommand: expect.stringContaining("codex plugin add"),
    });
    expect(hermes?.coverage).toBe("enforced");
  });

  it("still returns known runtimes when chain reads fail", async () => {
    mocks.fetchRecentSessions.mockRejectedValue(new Error("rpc down"));

    const inventory = await fetchRuntimeInventory();

    expect(inventory.traceError).toBe("rpc down");
    expect(inventory.runtimes.some((row) => row.id === "codex")).toBe(true);
  });
});
