import { spawn, spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setRuntimePaused } from "../../sdk-ts/src/runtime-controls.ts";
import {
  bufferPath,
  bufferToolCall,
  readBufferedToolCalls,
  readSessionState,
  statePath,
  writeSessionState,
} from "../scripts/onemem-lib.mjs";

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
      ONEMEM_NAMESPACE_ID: "",
      ONEMEM_RW_CAP_ID: "",
      ONEMEM_WORKER_AUTOSTART: "0",
      ...env,
    },
  });
}

function scriptEnv(env: Record<string, string> = {}) {
  return {
    ...process.env,
    PLUGIN_DATA: dir,
    ONEMEM_NAMESPACE_ID: "",
    ONEMEM_RW_CAP_ID: "",
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

function fakeTraceCli(status: number) {
  const path = join(dir, `fake-trace-${status}.mjs`);
  const output = join(dir, `fake-trace-${status}.json`);
  writeFileSync(
    path,
    `import { readFileSync, writeFileSync } from "node:fs";
const payload = JSON.parse(readFileSync(process.argv[2], "utf8"));
writeFileSync(${JSON.stringify(output)}, JSON.stringify(payload));
process.exit(${status});
`,
  );
  chmodSync(path, 0o755);
  return { path, output };
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

  it("SessionStart returns valid Codex JSON context without trace config", () => {
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

  it("SessionStart arms trace capture without opening a network session", () => {
    const result = runScript(
      "inject.js",
      {
        hook_event_name: "SessionStart",
        session_id: "codex-test",
        source: "startup",
      },
      {
        ONEMEM_NAMESPACE_ID: "0xnamespace",
        ONEMEM_RW_CAP_ID: "0xrw",
        SUI_NETWORK: "testnet",
      },
    );

    expect(result.status).toBe(0);
    const out = JSON.parse(result.stdout) as {
      hookSpecificOutput?: { additionalContext?: string };
    };
    expect(out.hookSpecificOutput?.additionalContext).toContain("trace capture is armed");
    expect(readSessionState("codex-test")).toEqual({
      namespaceId: "0xnamespace",
      rwCapId: "0xrw",
      network: "testnet",
    });
  });

  it("PostToolUse buffers Codex-shaped tool_output without network work", () => {
    writeSessionState("codex-test", {
      onememSessionId: "0xsession",
      namespaceId: "0xnamespace",
      rwCapId: "0xrw",
    });

    const result = runScript("observe.js", {
      hook_event_name: "PostToolUse",
      session_id: "codex-test",
      tool_use_id: "tool-1",
      tool_name: "Bash",
      tool_input: { command: "pwd" },
      tool_output: { exit_code: 0, stdout: "/tmp/project" },
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ continue: true });
    expect(bufferPath("codex-test")).toContain(dir);
    expect(readBufferedToolCalls("codex-test")).toEqual([
      {
        toolUseId: "tool-1",
        toolName: "Bash",
        toolNamespace: "codex",
        toolInput: { command: "pwd" },
        toolResponse: { exit_code: 0, stdout: "/tmp/project" },
        toolError: null,
      },
    ]);
  });

  it("PostToolUse posts readable previews to the local worker before Stop", async () => {
    writeSessionState("codex-test", {
      namespaceId: "0xnamespace",
      rwCapId: "0xrw",
      network: "testnet",
    });

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

  it("PostToolUse does not buffer while codex tracing is disabled", () => {
    writeSessionState("codex-test", {
      onememSessionId: "0xsession",
      namespaceId: "0xnamespace",
      rwCapId: "0xrw",
    });
    setRuntimePaused("codex", true);

    const result = runScript("observe.js", {
      hook_event_name: "PostToolUse",
      session_id: "codex-test",
      tool_use_id: "tool-1",
      tool_name: "Bash",
      tool_input: { command: "pwd" },
      tool_output: { exit_code: 0, stdout: "/tmp/project" },
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ continue: true });
    expect(readBufferedToolCalls("codex-test")).toHaveLength(0);
  });

  it("Stop exits successfully and writes valid JSON when trace config is absent", () => {
    const result = runScript("summarize.js", {
      hook_event_name: "Stop",
      session_id: "codex-test",
    });

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ continue: true });
  });

  it("Stop preserves buffered calls when the trace CLI fails", () => {
    writeSessionState("codex-test", {
      namespaceId: "0xnamespace",
      rwCapId: "0xrw",
      network: "testnet",
    });
    bufferToolCall("codex-test", {
      toolUseId: "tool-1",
      toolName: "Bash",
      toolNamespace: "codex",
      toolInput: { command: "pwd" },
      toolResponse: { exit_code: 0, stdout: "/tmp/project" },
      toolError: null,
    });

    const result = runScript(
      "summarize.js",
      {
        hook_event_name: "Stop",
        session_id: "codex-test",
      },
      {
        ONEMEM_NAMESPACE_ID: "0xnamespace",
        ONEMEM_RW_CAP_ID: "0xrw",
        ONEMEM_TRACE_CLI: fakeTraceCli(1).path,
      },
    );

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ continue: true });
    expect(readBufferedToolCalls("codex-test")).toHaveLength(1);
  });

  it("Stop flushes buffered calls through the trace CLI and clears local state", () => {
    writeSessionState("codex-test", {
      namespaceId: "0xnamespace",
      rwCapId: "0xrw",
      network: "testnet",
    });
    bufferToolCall("codex-test", {
      toolUseId: "tool-1",
      toolName: "Bash",
      toolNamespace: "codex",
      toolInput: { command: "pwd" },
      toolResponse: { exit_code: 0, stdout: "/tmp/project" },
      toolError: null,
    });
    const fake = fakeTraceCli(0);

    const result = runScript(
      "summarize.js",
      {
        hook_event_name: "Stop",
        session_id: "codex-test",
      },
      {
        ONEMEM_NAMESPACE_ID: "0xnamespace",
        ONEMEM_RW_CAP_ID: "0xrw",
        ONEMEM_TRACE_CLI: fake.path,
      },
    );

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ continue: true });
    expect(readBufferedToolCalls("codex-test")).toHaveLength(0);
    expect(readSessionState("codex-test")).toBeNull();
    expect(readFileSync(fake.output, "utf8")).toContain('"environment":"codex"');
    expect(readFileSync(fake.output, "utf8")).toContain('"toolName":"Bash"');
  });

  it("Stop clears local state and buffers while codex tracing is disabled", () => {
    writeSessionState("codex-test", {
      namespaceId: "0xnamespace",
      rwCapId: "0xrw",
    });
    bufferToolCall("codex-test", {
      toolUseId: "tool-1",
      toolName: "Bash",
      toolNamespace: "codex",
      toolInput: { command: "pwd" },
      toolResponse: { exit_code: 0, stdout: "/tmp/project" },
      toolError: null,
    });
    setRuntimePaused("codex", true);

    const result = runScript(
      "summarize.js",
      {
        hook_event_name: "Stop",
        session_id: "codex-test",
      },
      {
        ONEMEM_NAMESPACE_ID: "0xnamespace",
        ONEMEM_RW_CAP_ID: "0xrw",
        ONEMEM_PRIVATE_KEY: "not-a-valid-sui-private-key",
      },
    );

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ continue: true });
    expect(readBufferedToolCalls("codex-test")).toHaveLength(0);
    expect(readSessionState("codex-test")).toBeNull();
    expect(statePath("codex-test")).toContain(dir);
  });
});
