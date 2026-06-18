import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { describe, expect, it, vi } from "vitest";
import { launchDashboard } from "../src/commands/dashboard.js";

function childProcess() {
  return new EventEmitter() as unknown as ChildProcess;
}

describe("launchDashboard", () => {
  it("spawns the dashboard binary with the requested port", async () => {
    const child = childProcess();
    const spawn = vi.fn(() => child);
    const lines: string[] = [];

    const launched = launchDashboard(
      { port: "5050" },
      {
        env: { PATH: "/usr/bin" },
        spawn,
        write: (line) => lines.push(line),
      },
    );
    queueMicrotask(() => (child as EventEmitter).emit("exit", 0, null));

    await expect(launched).resolves.toBe(0);
    expect(spawn).toHaveBeenCalledWith("onemem-dashboard", [], {
      env: { PATH: "/usr/bin", PORT: "5050", ONEMEM_MODE: "local" },
      stdio: "inherit",
    });
    expect(lines).toEqual(["Launching OneMem dashboard at http://localhost:5050"]);
  });

  it("returns a clear install error when the dashboard binary is missing", async () => {
    const child = childProcess();
    const spawn = vi.fn(() => child);
    const errors: string[] = [];

    const launched = launchDashboard(
      {},
      {
        env: {},
        spawn,
        write: () => undefined,
        writeError: (line) => errors.push(line),
      },
    );
    queueMicrotask(() =>
      (child as EventEmitter).emit("error", Object.assign(new Error(), { code: "ENOENT" })),
    );

    await expect(launched).resolves.toBe(1);
    expect(errors).toEqual([
      "error: could not find `onemem-dashboard`; install `@onemem/dashboard` or put the binary on PATH",
    ]);
  });
});
