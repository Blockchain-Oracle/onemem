#!/usr/bin/env node
// OneMem Claude Code plugin — SessionStart hook.
// Registers the session with the local OneMem worker AND injects recall: the
// recent local timeline for this project, so a new session picks up where the
// last one left off. Defensive: any failure exits 0 so it never blocks the user.

import {
  captureEnabled,
  emitContext,
  ensureWorker,
  getWorker,
  postWorker,
  projectBasename,
  readHookInput,
} from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  const claudeSessionId = input.session_id;
  if (!claudeSessionId) return;
  if (!(await captureEnabled("claude-code"))) return;

  const projectPath = input.cwd ?? input.workspace_path ?? null;
  await ensureWorker();
  await postWorker("/api/sessions/init", {
    id: claudeSessionId,
    runtime: "claude-code",
    projectPath,
    startedAt: Date.now(),
  });

  // Recall: inject the recent local timeline for this project.
  const project = projectBasename(projectPath);
  if (project) {
    const ctx = await getWorker(`/api/context?project=${encodeURIComponent(project)}`);
    emitContext("SessionStart", ctx?.context);
  }
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
