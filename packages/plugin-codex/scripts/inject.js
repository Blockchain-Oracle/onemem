#!/usr/bin/env node
import {
  codexOutput,
  ensureWorker,
  loadTraceConfig,
  postWorker,
  readHookInput,
  sessionIdFromInput,
  traceCaptureEnabled,
  writeCodexOutput,
  writeSessionState,
} from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  const sessionId = sessionIdFromInput(input);
  const config = loadTraceConfig();
  let context =
    "OneMem is installed for Codex. Use the bundled onemem MCP tools for durable memory search, memory writes, and trace verification.";

  if (sessionId && traceCaptureEnabled("codex")) {
    await ensureWorker();
    await postWorker("/api/sessions/init", {
      id: sessionId,
      runtime: "codex",
      projectPath: input.cwd ?? input.workspace_path ?? null,
      startedAt: Date.now(),
    });
  }

  if (config && sessionId && traceCaptureEnabled("codex")) {
    writeSessionState(sessionId, {
      namespaceId: config.namespaceId,
      rwCapId: config.rwCapId,
      network: config.network,
    });
    await postWorker("/api/sessions/init", {
      id: sessionId,
      runtime: "codex",
      projectPath: input.cwd ?? input.workspace_path ?? null,
      namespaceId: config.namespaceId,
      startedAt: Date.now(),
    });
    context = `${context} OneMem trace capture is armed; trusted hooks will flush buffered Codex tool calls at Stop.`;
  }

  writeCodexOutput(codexOutput(context));
}

main()
  .catch(() => writeCodexOutput({ continue: true }))
  .finally(() => process.exit(0));
