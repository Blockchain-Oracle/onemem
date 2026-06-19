#!/usr/bin/env node
// OneMem Claude Code plugin — SessionStart hook.
// Registers this Claude session with the local OneMem worker so PostToolUse can
// stream readable observations to the live dashboard. Defensive: any failure
// exits 0 so it never blocks the user's session.
//
// Spec: docs/05-our-architecture/03-runtimes/claude-code-plugin.md

import { captureEnabled, ensureWorker, postWorker, readHookInput } from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  const claudeSessionId = input.session_id;
  if (!claudeSessionId) return;
  if (!(await captureEnabled("claude-code"))) return;

  await ensureWorker();
  await postWorker("/api/sessions/init", {
    id: claudeSessionId,
    runtime: "claude-code",
    projectPath: input.cwd ?? input.workspace_path ?? null,
    startedAt: Date.now(),
  });
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
