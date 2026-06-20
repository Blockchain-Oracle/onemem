#!/usr/bin/env node
import {
  captureEnabled,
  codexOutput,
  ensureWorker,
  postWorker,
  readHookInput,
  sessionIdFromInput,
  writeCodexOutput,
} from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  const sessionId = sessionIdFromInput(input);
  const context =
    "OneMem is installed for Codex. Use the bundled onemem MCP tools for durable memory search and memory writes.";

  if (sessionId && captureEnabled("codex")) {
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
