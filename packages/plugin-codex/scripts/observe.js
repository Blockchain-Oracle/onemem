#!/usr/bin/env node
import {
  captureEnabled,
  postWorker,
  preview,
  readHookInput,
  sessionIdFromInput,
  toolOutputFromInput,
  writeCodexOutput,
} from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  if (input.hook_event_name && input.hook_event_name !== "PostToolUse") return;

  const sessionId = sessionIdFromInput(input);
  const toolName = input.tool_name;
  if (!sessionId || !toolName) return;
  if (!captureEnabled("codex")) return;

  await postWorker("/api/sessions/observations", {
    sessionId,
    type: "tool_use",
    toolName,
    toolNamespace: "codex",
    inputPreview: preview(input.tool_input),
    outputPreview: preview(toolOutputFromInput(input)),
  });
}

main()
  .catch(() => {})
  .finally(() => {
    writeCodexOutput({ continue: true });
    process.exit(0);
  });
