import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setRuntimePaused } from "../../sdk-ts/src/runtime-controls.ts";

const SCRIPTS = fileURLToPath(new URL("../scripts/", import.meta.url));
let dir = "";
let previousPluginData: string | undefined;
let previousRuntimeControlsPath: string | undefined;

function scriptEnv(env: Record<string, string> = {}) {
  return {
    ...process.env,
    CLAUDE_PLUGIN_DATA: dir,
    ONEMEM_WORKER_AUTOSTART: "0",
    ...env,
  };
}

function runScriptAsync(script: string, payload: unknown, env: Record<string, string> = {}) {
  return new Promise<{ status: number | null; stdout: string; stderr: string }>(
    (resolve, reject) => {
      const child = spawn(process.execPath, [`${SCRIPTS}${script}`], {
        env: scriptEnv(env),
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk;
      });
      child.on("error", reject);
      child.on("close", (status) => resolve({ status, stdout, stderr }));
      child.stdin.end(JSON.stringify(payload));
    },
  );
}

async function captureRequests<T>(
  run: (baseUrl: string) => T | Promise<T>,
): Promise<{ result: T; requests: Array<{ url: string; body: unknown }> }> {
  const requests: Array<{ url: string; body: unknown }> = [];
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      requests.push({ url: req.url ?? "", body: raw ? JSON.parse(raw) : null });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, id: "ok", status: "closed", endedAt: 1234 }));
    });
  });
  const address = await new Promise<{ port: number }>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr !== "object") throw new Error("missing test server address");
      resolve({ port: addr.port });
    });
  });
  try {
    const result = await run(`http://127.0.0.1:${address.port}`);
    return { result, requests };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "onemem-claude-plugin-"));
  previousPluginData = process.env.CLAUDE_PLUGIN_DATA;
  previousRuntimeControlsPath = process.env.ONEMEM_RUNTIME_CONTROLS_PATH;
  process.env.CLAUDE_PLUGIN_DATA = dir;
  process.env.ONEMEM_RUNTIME_CONTROLS_PATH = join(dir, "runtime-controls.json");
});

afterEach(() => {
  if (previousPluginData === undefined) {
    delete process.env.CLAUDE_PLUGIN_DATA;
  } else {
    process.env.CLAUDE_PLUGIN_DATA = previousPluginData;
  }
  if (previousRuntimeControlsPath === undefined) {
    delete process.env.ONEMEM_RUNTIME_CONTROLS_PATH;
  } else {
    process.env.ONEMEM_RUNTIME_CONTROLS_PATH = previousRuntimeControlsPath;
  }
  rmSync(dir, { recursive: true, force: true });
});

describe("Claude Code plugin hooks", () => {
  it("SessionStart registers the session with the local worker", async () => {
    const { result, requests } = await captureRequests((baseUrl) =>
      runScriptAsync(
        "inject.js",
        { session_id: "claude-test", cwd: "/tmp/project" },
        { ONEMEM_WORKER_URL: baseUrl },
      ),
    );

    expect(result.status).toBe(0);
    const init = requests.find((r) => r.url === "/api/sessions/init");
    expect(init?.body).toEqual(
      expect.objectContaining({
        id: "claude-test",
        runtime: "claude-code",
        projectPath: "/tmp/project",
      }),
    );
  });

  it("PostToolUse posts readable previews to the local worker", async () => {
    const { result, requests } = await captureRequests((baseUrl) =>
      runScriptAsync(
        "observe.js",
        {
          hook_event_name: "PostToolUse",
          session_id: "claude-test",
          tool_name: "Bash",
          tool_input: { command: "pwd" },
          tool_response: { exit_code: 0, stdout: "/tmp/project" },
        },
        { ONEMEM_WORKER_URL: baseUrl },
      ),
    );

    expect(result.status).toBe(0);
    expect(requests).toEqual([
      {
        url: "/api/sessions/observations",
        body: {
          sessionId: "claude-test",
          type: "tool_use",
          toolName: "Bash",
          toolNamespace: "claude-code",
          inputPreview: '{"command":"pwd"}',
          outputPreview: '{"exit_code":0,"stdout":"/tmp/project"}',
        },
      },
    ]);
  });

  it("PostToolUse does not post while claude-code capture is paused", async () => {
    setRuntimePaused("claude-code", true);

    const { result, requests } = await captureRequests((baseUrl) =>
      runScriptAsync(
        "observe.js",
        {
          hook_event_name: "PostToolUse",
          session_id: "claude-test",
          tool_name: "Bash",
          tool_input: { command: "pwd" },
          tool_response: { exit_code: 0, stdout: "/tmp/project" },
        },
        { ONEMEM_WORKER_URL: baseUrl },
      ),
    );

    expect(result.status).toBe(0);
    expect(requests).toHaveLength(0);
  });

  it("Stop marks the session ended on the local worker", async () => {
    const { result, requests } = await captureRequests((baseUrl) =>
      runScriptAsync(
        "summarize.js",
        { session_id: "claude-test", hook_event_name: "Stop", reason: "stop" },
        { ONEMEM_WORKER_URL: baseUrl },
      ),
    );

    expect(result.status).toBe(0);
    expect(requests).toEqual([
      {
        url: "/api/sessions/end",
        body: expect.objectContaining({ id: "claude-test" }),
      },
    ]);
  });
});
