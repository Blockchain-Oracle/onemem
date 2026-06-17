#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import {
  clearBufferedToolCalls,
  clearSessionState,
  loadTraceConfig,
  readBufferedToolCalls,
  readHookInput,
  readSessionState,
  sessionIdFromInput,
  traceCaptureEnabled,
  tracePayloadPath,
  writeCodexOutput,
} from "./onemem-lib.mjs";

function runTraceCli(payloadPath, env) {
  const override = process.env.ONEMEM_TRACE_CLI;
  if (override) {
    return spawnSync(process.execPath, [override, payloadPath], {
      encoding: "utf8",
      env,
      timeout: 115_000,
    });
  }
  return spawnSync("npx", ["-y", "-p", "@onemem/sdk-ts@0.6.0", "onemem-trace", payloadPath], {
    encoding: "utf8",
    env,
    timeout: 115_000,
  });
}

async function main() {
  const input = await readHookInput();
  const sessionId = sessionIdFromInput(input);
  const config = loadTraceConfig();
  if (!config || !sessionId) return;

  const state = readSessionState(sessionId);
  if (!state) return;
  const calls = readBufferedToolCalls(sessionId);
  if (!(await traceCaptureEnabled("codex"))) {
    clearBufferedToolCalls(sessionId);
    clearSessionState(sessionId);
    return;
  }

  if (calls.length === 0) {
    clearBufferedToolCalls(sessionId);
    clearSessionState(sessionId);
    return;
  }

  const payloadPath = tracePayloadPath(sessionId);
  const payload = {
    agentId: "codex",
    environment: "codex",
    label: "codex",
    network: state.network ?? config.network,
    target: {
      namespaceId: state.namespaceId ?? config.namespaceId,
      rwCapId: state.rwCapId ?? config.rwCapId,
    },
    calls: calls.map((call) => ({
      toolName: call.toolName,
      toolNamespace: call.toolNamespace ?? "codex",
      input: call.toolInput,
      output: {
        response: call.toolResponse,
        error: call.toolError,
      },
    })),
  };
  writeFileSync(payloadPath, JSON.stringify(payload), { mode: 0o600 });

  const result = runTraceCli(payloadPath, {
    ...process.env,
    SUI_NETWORK: payload.network,
    ONEMEM_NAMESPACE_ID: payload.target.namespaceId,
    ONEMEM_RW_CAP_ID: payload.target.rwCapId,
  });
  if (result.status === 0) {
    clearBufferedToolCalls(sessionId);
    clearSessionState(sessionId);
  }
}

main()
  .catch(() => {})
  .finally(() => {
    writeCodexOutput({ continue: true });
    process.exit(0);
  });
