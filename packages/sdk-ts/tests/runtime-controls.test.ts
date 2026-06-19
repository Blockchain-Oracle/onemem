import { chmodSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  getRuntimeControl,
  listRuntimeControls,
  setRuntimePaused,
  setRuntimePermission,
  shouldCaptureRuntime,
} from "../src/runtime-controls.js";

let dir = "";
let file = "";

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "onemem-runtime-controls-"));
  file = join(dir, "controls.json");
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("runtime controls", () => {
  it("defaults missing runtimes to capture on", () => {
    expect(getRuntimeControl("Vercel-AI", file)).toMatchObject({
      runtime: "vercel-ai",
      paused: false,
      permissions: { captureEnabled: true },
      updatedAt: null,
    });
    expect(shouldCaptureRuntime("vercel-ai", file)).toBe(true);
  });

  it("persists pause state and capture permission in an owner-only file", () => {
    setRuntimePaused("vercel-ai", true, file);
    setRuntimePermission("vercel-ai", "captureEnabled", false, file);

    expect(getRuntimeControl("vercel-ai", file)).toMatchObject({
      runtime: "vercel-ai",
      paused: true,
      permissions: { captureEnabled: false },
    });
    expect(shouldCaptureRuntime("vercel-ai", file)).toBe(false);
    expect(statSync(file).mode & 0o777).toBe(0o600);
  });

  it("normalizes and lists persisted runtimes", () => {
    setRuntimePaused("OpenAI-Agents", true, file);
    setRuntimePermission("codex", "captureEnabled", false, file);

    expect(listRuntimeControls(file).map((entry) => entry.runtime)).toEqual([
      "codex",
      "openai-agents",
    ]);
  });

  it("rewrites a permissive existing file with private permissions on update", () => {
    setRuntimePaused("codex", true, file);
    chmodSync(file, 0o644);
    setRuntimePaused("codex", false, file);

    expect(statSync(file).mode & 0o777).toBe(0o600);
    expect(shouldCaptureRuntime("codex", file)).toBe(true);
  });
});
