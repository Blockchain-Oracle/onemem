#!/usr/bin/env node
// OneMem Claude Code plugin — SessionStart hook.
// Opens a verifiable OneMem TraceSession for this Claude session and persists
// the mapping so PostToolUse can buffer calls into it. Defensive: any failure
// exits 0 so it never blocks the user's session.
//
// Spec: docs/05-our-architecture/03-runtimes/claude-code-plugin.md

import {
  ensureWorker,
  loadClient,
  loadConfig,
  postWorker,
  readHookInput,
  traceCaptureEnabled,
  writeSessionState,
} from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  const claudeSessionId = input.session_id;
  if (!claudeSessionId) return;
  if (!(await traceCaptureEnabled("claude-code"))) return;

  await ensureWorker();
  await postWorker("/api/sessions/init", {
    id: claudeSessionId,
    runtime: "claude-code",
    projectPath: input.cwd ?? input.workspace_path ?? null,
    startedAt: Date.now(),
  });

  const config = loadConfig();
  if (!config) return;

  const onemem = await loadClient(config);
  if (!onemem) return;

  const session = await onemem.traces.startSession({
    namespaceId: config.namespaceId,
    rwCapId: config.rwCapId,
    agentId: "claude-code",
    environment: "claude-code",
    sdkVersion: "0.1.1",
  });
  writeSessionState(claudeSessionId, {
    onememSessionId: session.sessionId,
    namespaceId: config.namespaceId,
    rwCapId: config.rwCapId,
  });
  await postWorker("/api/sessions/init", {
    id: claudeSessionId,
    runtime: "claude-code",
    projectPath: input.cwd ?? input.workspace_path ?? null,
    namespaceId: config.namespaceId,
    onememSessionId: session.sessionId,
    startedAt: Date.now(),
  });
  process.stderr.write(`[onemem] trace session ${session.sessionId} started\n`);
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
