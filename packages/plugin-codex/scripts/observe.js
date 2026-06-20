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

  // Raw tool call → the worker's event queue (hot path). The observer compresses
  // it into a readable observation card in the background.
  await postWorker("/api/events", {
    sessionId,
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
