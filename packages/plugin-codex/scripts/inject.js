#!/usr/bin/env node
import {
  codexOutput,
  ensureWorker,
  postWorker,
  readHookInput,
  sessionIdFromInput,
  traceCaptureEnabled,
  writeCodexOutput,
} from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  const sessionId = sessionIdFromInput(input);
  const context =
    "OneMem is installed for Codex. Use the bundled onemem MCP tools for durable memory search and memory writes.";

  if (sessionId && traceCaptureEnabled("codex")) {
    await ensureWorker();
    await postWorker("/api/sessions/init", {
      id: sessionId,
      runtime: "codex",
      projectPath: input.cwd ?? input.workspace_path ?? null,
      startedAt: Date.now(),
    });
  }

  writeCodexOutput(codexOutput(context));
}

main()
  .catch(() => writeCodexOutput({ continue: true }))
  .finally(() => process.exit(0));
