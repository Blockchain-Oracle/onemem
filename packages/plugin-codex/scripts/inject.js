#!/usr/bin/env node
// OneMem Codex plugin — SessionStart hook.
// Registers the session with the local OneMem worker AND injects recall: the
// recent local timeline for this project. The observer that compresses Codex
// sessions runs zero-key via `codex exec`. Defensive: always exits 0.

import {
  captureEnabled,
  codexOutput,
  ensureWorker,
  getWorker,
  postWorker,
  projectBasename,
  readHookInput,
  sessionIdFromInput,
  writeCodexOutput,
} from "./onemem-lib.mjs";

const FALLBACK_CONTEXT =
  "OneMem is installed for Codex. Use the bundled onemem MCP tools for durable memory search and writes.";

async function main() {
  const input = await readHookInput();
  const sessionId = sessionIdFromInput(input);
  const projectPath = input.cwd ?? input.workspace_path ?? null;
  let context = null;

  if (sessionId && captureEnabled("codex")) {
    await ensureWorker();
    await postWorker("/api/sessions/init", {
      id: sessionId,
      runtime: "codex",
      projectPath,
      startedAt: Date.now(),
    });
    const project = projectBasename(projectPath);
    if (project) {
      const ctx = await getWorker(`/api/context?project=${encodeURIComponent(project)}`);
      context = ctx?.context || null;
    }
  }

  writeCodexOutput(codexOutput(context ?? FALLBACK_CONTEXT));
}

main()
  .catch(() => writeCodexOutput({ continue: true }))
  .finally(() => process.exit(0));
