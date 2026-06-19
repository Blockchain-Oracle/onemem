#!/usr/bin/env node
import {
  bufferToolCall,
  postWorker,
  preview,
  readHookInput,
  readSessionState,
  sessionIdFromInput,
  toolOutputFromInput,
  traceCaptureEnabled,
  writeCodexOutput,
} from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  if (input.hook_event_name && input.hook_event_name !== "PostToolUse") return;

  const sessionId = sessionIdFromInput(input);
  const toolName = input.tool_name;
  if (!sessionId || !toolName) return;
  if (!traceCaptureEnabled("codex")) return;

  await postWorker("/api/sessions/observations", {
    sessionId,
    type: "tool_use",
    toolName,
    toolNamespace: "codex",
    inputPreview: preview(input.tool_input),
    outputPreview: preview(toolOutputFromInput(input)),
  });

  if (!readSessionState(sessionId)) return;

  bufferToolCall(sessionId, {
    toolUseId: input.tool_use_id ?? null,
    toolName,
    toolNamespace: "codex",
    toolInput: input.tool_input ?? null,
    toolResponse: toolOutputFromInput(input),
    toolError: input.tool_error ?? null,
  });
}

main()
  .catch(() => {})
  .finally(() => {
    writeCodexOutput({ continue: true });
    process.exit(0);
  });
