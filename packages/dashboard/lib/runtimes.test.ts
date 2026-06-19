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
  it("groups by execution location: location-A is controllable, deployed adapters are read-only", async () => {
    mocks.fetchRecentSessions.mockResolvedValue([
      session("vercel-ai", Date.now()),
      session("vercel-ai", Date.now() - 1_000),
      session("openclaw", Date.now() - 2_000),
    ]);
    // openclaw is a location-A runtime → controllable; pausing it must stick.
    updateRuntimeControl("openclaw", { paused: true });
    // vercel-ai is a deployed adapter (location B) → NOT controllable; even a
    // stray control entry must be ignored, never rendered as a paused local app.
    updateRuntimeControl("vercel-ai", { paused: true });

    const inventory = await fetchRuntimeInventory();
    const vercel = inventory.runtimes.find((row) => row.id === "vercel-ai");
    const openclaw = inventory.runtimes.find((row) => row.id === "openclaw");
    const codex = inventory.runtimes.find((row) => row.id === "codex");
    const hermes = inventory.runtimes.find((row) => row.id === "hermes");
    const cursor = inventory.runtimes.find((row) => row.id === "cursor");
    const windsurf = inventory.runtimes.find((row) => row.id === "windsurf");

    expect(inventory.controlsFile).toBe(process.env.ONEMEM_RUNTIME_CONTROLS_PATH);

    // Location-A runtime: real control honored.
    expect(openclaw).toMatchObject({
      sessions: 1,
      controllable: true,
      tier: "runtime-provider",
      section: "local-runtimes",
      paused: true,
      statusLabel: "paused",
    });

    // Deployed adapter: seen on-chain, read-only, never controllable/paused here.
    expect(vercel).toMatchObject({
      sessions: 2,
      controllable: false,
      tier: "deployed-adapter",
      section: "environments",
      paused: false,
    });

    expect(codex).toMatchObject({
      tier: "trusted-hooks-required",
      section: "local-runtimes",
      installCommand: expect.stringContaining("codex plugin add"),
    });
    expect(hermes?.tier).toBe("runtime-provider");
    expect(cursor).toMatchObject({
      tier: "hook-port-pending",
      section: "local-runtimes",
      controllable: false,
      installCommand: expect.stringContaining("cursor-hooks"),
    });
    expect(windsurf).toMatchObject({
      tier: "hook-port-pending",
      section: "local-runtimes",
      controllable: false,
      installCommand: expect.stringContaining("WindsurfHooksInstaller"),
    });
  });

  it("still returns known runtimes when chain reads fail", async () => {
    mocks.fetchRecentSessions.mockRejectedValue(new Error("rpc down"));

    const inventory = await fetchRuntimeInventory();

    expect(inventory.traceError).toBe("rpc down");
    expect(inventory.runtimes.some((row) => row.id === "codex")).toBe(true);
  });
});
