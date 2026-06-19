import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalSession } from "./local-worker";

const mocks = vi.hoisted(() => ({
  fetchLocalWorker: vi.fn(),
}));

vi.mock("@/lib/local-worker", () => ({
  fetchLocalWorker: mocks.fetchLocalWorker,
}));

import { fetchRuntimeInventory, updateRuntimeControl } from "./runtimes";

let dir = "";

function session(runtime: string, startedAt: number): LocalSession {
  return {
    id: `0x${runtime}`,
    runtime,
    projectPath: null,
    namespaceId: null,
    onememSessionId: null,
    status: "open",
    startedAt,
    endedAt: null,
  };
}

function sessionsResponse(sessions: LocalSession[]): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ sessions }),
  } as unknown as Response;
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "onemem-dashboard-runtimes-"));
  process.env.ONEMEM_RUNTIME_CONTROLS_PATH = join(dir, "runtime-controls.json");
  mocks.fetchLocalWorker.mockReset();
});

afterEach(() => {
  delete process.env.ONEMEM_RUNTIME_CONTROLS_PATH;
  rmSync(dir, { recursive: true, force: true });
});

describe("fetchRuntimeInventory", () => {
  it("groups by execution location: location-A is controllable, deployed adapters are read-only", async () => {
    mocks.fetchLocalWorker.mockResolvedValue(
      sessionsResponse([
        session("vercel-ai", Date.now()),
        session("vercel-ai-2", Date.now() - 1_000),
        session("openclaw", Date.now() - 2_000),
      ]),
    );
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

    // Deployed adapter: seen in the feed, read-only, never controllable/paused here.
    expect(vercel).toMatchObject({
      sessions: 1,
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

  it("still returns known runtimes when the worker read fails", async () => {
    mocks.fetchLocalWorker.mockRejectedValue(new Error("worker down"));

    const inventory = await fetchRuntimeInventory();

    expect(inventory.traceError).toBe("worker down");
    expect(inventory.runtimes.some((row) => row.id === "codex")).toBe(true);
  });
});
