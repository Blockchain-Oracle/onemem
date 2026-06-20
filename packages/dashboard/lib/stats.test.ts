import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalSession } from "./local-worker";

const mocks = vi.hoisted(() => ({
  fetchLocalWorker: vi.fn(),
}));

// stats.ts imports "./local-worker" relatively, so mock that exact specifier.
vi.mock("./local-worker", () => ({
  fetchLocalWorker: mocks.fetchLocalWorker,
}));

import { fetchStats } from "./stats";

function session(runtime: string, startedAt: number): LocalSession {
  return {
    id: `0x${runtime}-${startedAt}`,
    runtime,
    projectPath: null,
    namespaceId: null,
    onememSessionId: null,
    status: "open",
    startedAt,
    endedAt: null,
  };
}

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

// fetchStats fires /api/sessions then /api/observations (Promise.all). Route by path.
function routeWorker(sessions: LocalSession[], observations: unknown[]) {
  mocks.fetchLocalWorker.mockImplementation(async (path: string) => {
    if (path === "/api/observations") return jsonResponse({ observations });
    return jsonResponse({ sessions });
  });
}

beforeEach(() => {
  mocks.fetchLocalWorker.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fetchStats", () => {
  it("groups by runtime, takes the max lastMs, and sorts by count desc", async () => {
    routeWorker(
      [
        session("claude-code", 100),
        session("claude-code", 300),
        session("claude-code", 200),
        session("codex", 500),
      ],
      [{}, {}, {}],
    );

    const stats = await fetchStats();

    expect(stats.sessions).toBe(4);
    expect(stats.runtimes).toBe(2);
    expect(stats.observations).toBe(3);
    // claude-code (3) before codex (1) — sorted by count desc.
    expect(stats.runtimeBreakdown.map((r) => r.name)).toEqual(["claude-code", "codex"]);
    const claude = stats.runtimeBreakdown.find((r) => r.name === "claude-code");
    expect(claude).toMatchObject({ count: 3, lastMs: 300 });
    expect(stats.runtimeBreakdown.find((r) => r.name === "codex")).toMatchObject({
      count: 1,
      lastMs: 500,
    });
  });

  it("falls back to empty stats and warns when the worker read fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.fetchLocalWorker.mockRejectedValue(new Error("worker down"));

    const stats = await fetchStats();

    expect(stats).toEqual({
      sessions: 0,
      runtimes: 0,
      observations: 0,
      runtimeBreakdown: [],
    });
    expect(warn).toHaveBeenCalled();
  });
});
