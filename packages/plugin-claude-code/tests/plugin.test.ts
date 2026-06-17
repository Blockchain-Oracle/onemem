import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setRuntimePaused } from "../../sdk-ts/src/runtime-controls.ts";
import {
  bufferToolCall,
  readBufferedToolCalls,
  readSessionState,
  writeSessionState,
} from "../scripts/onemem-lib.mjs";

const SCRIPTS = fileURLToPath(new URL("../scripts/", import.meta.url));
let dir = "";
let previousPluginData: string | undefined;
let previousRuntimeControlsPath: string | undefined;

function runScript(script: string, payload: unknown, env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [`${SCRIPTS}${script}`], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: {
      ...process.env,
      CLAUDE_PLUGIN_DATA: dir,
      ONEMEM_NAMESPACE_ID: "",
      ONEMEM_RW_CAP_ID: "",
      ...env,
    },
  });
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
  it("PostToolUse buffers when trace policy allows capture", () => {
    writeSessionState("claude-test", {
      onememSessionId: "0xsession",
      namespaceId: "0xnamespace",
      rwCapId: "0xrw",
    });

    const result = runScript("observe.js", {
      hook_event_name: "PostToolUse",
      session_id: "claude-test",
      tool_name: "Bash",
      tool_input: { command: "pwd" },
      tool_response: { exit_code: 0, stdout: "/tmp/project" },
    });

    expect(result.status).toBe(0);
    expect(readBufferedToolCalls("claude-test")).toEqual([
      {
        toolName: "Bash",
        toolInput: { command: "pwd" },
        toolResponse: { exit_code: 0, stdout: "/tmp/project" },
      },
    ]);
  });

  it("PostToolUse does not buffer while claude-code tracing is disabled", () => {
    writeSessionState("claude-test", {
      onememSessionId: "0xsession",
      namespaceId: "0xnamespace",
      rwCapId: "0xrw",
    });
    setRuntimePaused("claude-code", true);

    const result = runScript("observe.js", {
      hook_event_name: "PostToolUse",
      session_id: "claude-test",
      tool_name: "Bash",
      tool_input: { command: "pwd" },
      tool_response: { exit_code: 0, stdout: "/tmp/project" },
    });

    expect(result.status).toBe(0);
    expect(readBufferedToolCalls("claude-test")).toHaveLength(0);
  });

  it("SessionEnd preserves buffered calls when trace client setup fails", () => {
    writeSessionState("claude-test", {
      onememSessionId: "0xsession",
      namespaceId: "0xnamespace",
      rwCapId: "0xrw",
    });
    bufferToolCall("claude-test", {
      toolName: "Bash",
      toolInput: { command: "pwd" },
      toolResponse: { exit_code: 0, stdout: "/tmp/project" },
    });

    const result = runScript(
      "summarize.js",
      { session_id: "claude-test", reason: "exit" },
      {
        ONEMEM_NAMESPACE_ID: "0xnamespace",
        ONEMEM_RW_CAP_ID: "0xrw",
        ONEMEM_PRIVATE_KEY: "not-a-valid-sui-private-key",
      },
    );

    expect(result.status).toBe(0);
    expect(readBufferedToolCalls("claude-test")).toHaveLength(1);
    expect(readSessionState("claude-test")).not.toBeNull();
  });

  it("SessionEnd clears local state and buffers while claude-code tracing is disabled", () => {
    writeSessionState("claude-test", {
      onememSessionId: "0xsession",
      namespaceId: "0xnamespace",
      rwCapId: "0xrw",
    });
    bufferToolCall("claude-test", {
      toolName: "Bash",
      toolInput: { command: "pwd" },
      toolResponse: { exit_code: 0, stdout: "/tmp/project" },
    });
    setRuntimePaused("claude-code", true);

    const result = runScript(
      "summarize.js",
      { session_id: "claude-test", reason: "exit" },
      {
        ONEMEM_NAMESPACE_ID: "0xnamespace",
        ONEMEM_RW_CAP_ID: "0xrw",
        ONEMEM_PRIVATE_KEY: "not-a-valid-sui-private-key",
      },
    );

    expect(result.status).toBe(0);
    expect(readBufferedToolCalls("claude-test")).toHaveLength(0);
    expect(readSessionState("claude-test")).toBeNull();
  });
});
