import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setRuntimePaused } from "../../sdk-ts/src/runtime-controls.ts";

const SCRIPTS = fileURLToPath(new URL("../scripts/", import.meta.url));
const HOOKS = fileURLToPath(new URL("../hooks/hooks.json", import.meta.url));
let dir = "";
let previousPluginData: string | undefined;
let previousRuntimeControlsPath: string | undefined;

function runScript(script: string, payload: unknown, env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [`${SCRIPTS}${script}`], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: {
      ...process.env,
      PLUGIN_DATA: dir,
      ONEMEM_WORKER_AUTOSTART: "0",
      ...env,
    },
  });
}

function scriptEnv(env: Record<string, string> = {}) {
  return {
    ...process.env,
    PLUGIN_DATA: dir,
    ONEMEM_WORKER_AUTOSTART: "0",
    ...env,
  };
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

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "onemem-codex-plugin-"));
  previousPluginData = process.env.PLUGIN_DATA;
  previousRuntimeControlsPath = process.env.ONEMEM_RUNTIME_CONTROLS_PATH;
  process.env.PLUGIN_DATA = dir;
  process.env.ONEMEM_RUNTIME_CONTROLS_PATH = join(dir, "runtime-controls.json");
});

afterEach(() => {
  if (previousPluginData === undefined) {
    delete process.env.PLUGIN_DATA;
  } else {
    process.env.PLUGIN_DATA = previousPluginData;
  }
  if (previousRuntimeControlsPath === undefined) {
    delete process.env.ONEMEM_RUNTIME_CONTROLS_PATH;
  } else {
    process.env.ONEMEM_RUNTIME_CONTROLS_PATH = previousRuntimeControlsPath;
  }
  rmSync(dir, { recursive: true, force: true });
});

describe("Codex plugin hooks", () => {
  it("SessionStart matches every Codex session source when hooks run", () => {
    const hooks = JSON.parse(readFileSync(HOOKS, "utf8")) as {
      hooks?: { SessionStart?: Array<{ matcher?: string }> };
    };

    expect(hooks.hooks?.SessionStart?.[0]?.matcher).toBe("");
  });

  it("SessionStart returns valid Codex JSON context", () => {
    const result = runScript("inject.js", {
      hook_event_name: "SessionStart",
      session_id: "codex-test",
      source: "startup",
    });

    expect(result.status).toBe(0);
    const out = JSON.parse(result.stdout) as {
      continue: boolean;
      hookSpecificOutput?: { additionalContext?: string };
    };
    expect(out.continue).toBe(true);
    expect(out.hookSpecificOutput?.additionalContext).toContain("OneMem is installed");
  });

  it("SessionStart registers the session with the local worker", async () => {
    const { result, requests } = await captureRequests((baseUrl) =>
      runScriptAsync(
        "inject.js",
        { hook_event_name: "SessionStart", session_id: "codex-test", cwd: "/tmp/project" },
        { ONEMEM_WORKER_URL: baseUrl },
      ),
    );

    expect(result.status).toBe(0);
    const init = requests.find((r) => r.url === "/api/sessions/init");
    expect(init?.body).toEqual(
      expect.objectContaining({
        id: "codex-test",
        runtime: "codex",
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
          session_id: "codex-test",
          tool_use_id: "tool-1",
          tool_name: "Bash",
          tool_input: { command: "pwd" },
          tool_output: { exit_code: 0, stdout: "/tmp/project" },
        },
        { ONEMEM_WORKER_URL: baseUrl },
      ),
    );

    expect(result.status).toBe(0);
    expect(requests).toEqual([
      {
        url: "/api/sessions/observations",
        body: {
          sessionId: "codex-test",
          type: "tool_use",
          toolName: "Bash",
          toolNamespace: "codex",
          inputPreview: '{"command":"pwd"}',
          outputPreview: '{"exit_code":0,"stdout":"/tmp/project"}',
        },
      },
    ]);
  });

  it("PostToolUse does not post while codex capture is paused", async () => {
    setRuntimePaused("codex", true);

    const { result, requests } = await captureRequests((baseUrl) =>
      runScriptAsync(
        "observe.js",
        {
          hook_event_name: "PostToolUse",
          session_id: "codex-test",
          tool_use_id: "tool-1",
          tool_name: "Bash",
          tool_input: { command: "pwd" },
          tool_output: { exit_code: 0, stdout: "/tmp/project" },
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
        { session_id: "codex-test", hook_event_name: "Stop", reason: "stop" },
        { ONEMEM_WORKER_URL: baseUrl },
      ),
    );

    expect(result.status).toBe(0);
    expect(requests).toEqual([
      {
        url: "/api/sessions/end",
        body: expect.objectContaining({ id: "codex-test" }),
      },
    ]);
  });
});
