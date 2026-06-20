#!/usr/bin/env node
// OneMem Claude Code plugin — UserPromptSubmit hook.
// Records the user's prompt (a prompt card on the dashboard) and injects
// semantic recall: durable MemWal memories relevant to what the user just asked.
// Defensive: any failure exits 0 so it never blocks the user's prompt.

import {
  captureEnabled,
  emitContext,
  getWorker,
  postWorker,
  projectBasename,
  readHookInput,
} from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  if (input.hook_event_name && input.hook_event_name !== "UserPromptSubmit") return;
  const claudeSessionId = input.session_id;
  const text = input.prompt ?? input.user_prompt ?? "";
  if (!claudeSessionId || !text) return;
  if (!(await captureEnabled("claude-code"))) return;

  await postWorker("/api/prompts", { sessionId: claudeSessionId, text });

  // Semantic recall scoped to this project (durable MemWal memories).
  const project = projectBasename(input.cwd ?? input.workspace_path ?? null);
  if (project) {
    const recall = await getWorker(
      `/api/recall?q=${encodeURIComponent(text)}&project=${encodeURIComponent(project)}&limit=5`,
    );
    emitContext("UserPromptSubmit", recall?.context);
  }
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
