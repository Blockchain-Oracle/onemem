#!/usr/bin/env node
// OneMem Codex plugin — UserPromptSubmit hook.
// Records the user's prompt (a prompt card) and injects semantic recall: durable
// MemWal memories relevant to what the user just asked. Defensive: always exits 0.

import {
  captureEnabled,
  codexOutput,
  getWorker,
  postWorker,
  projectBasename,
  readHookInput,
  sessionIdFromInput,
  writeCodexOutput,
} from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  if (input.hook_event_name && input.hook_event_name !== "UserPromptSubmit") return;
  const sessionId = sessionIdFromInput(input);
  const text = input.prompt ?? input.user_prompt ?? input.message ?? "";
  if (!sessionId || !text) return;
  if (!captureEnabled("codex")) return;

  await postWorker("/api/prompts", { sessionId, text });

  const project = projectBasename(input.cwd ?? input.workspace_path ?? null);
  if (project) {
    const recall = await getWorker(
      `/api/recall?q=${encodeURIComponent(text)}&project=${encodeURIComponent(project)}&limit=5`,
    );
    if (recall?.context) {
      writeCodexOutput(codexOutput(recall.context, "UserPromptSubmit"));
      return;
    }
  }
  writeCodexOutput({ continue: true });
}

main()
  .catch(() => writeCodexOutput({ continue: true }))
  .finally(() => process.exit(0));
