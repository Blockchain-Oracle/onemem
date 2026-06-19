#!/usr/bin/env node
// OneMem Claude Code plugin — PostToolUse hook.
// Buffers each tool call to a local file INSTANTLY (no network) so Claude Code
// stays responsive; the buffer is flushed on-chain in one batch at Stop
// (per the "hooks must be fast" rule). Defensive: always exits 0.

import {
  bufferToolCall,
  postWorker,
  preview,
  readHookInput,
  readSessionState,
  traceCaptureEnabled,
} from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  if (input.hook_event_name && input.hook_event_name !== "PostToolUse") return;
  const claudeSessionId = input.session_id;
  if (!claudeSessionId || !input.tool_name) return;
  if (!(await traceCaptureEnabled("claude-code"))) return;

  await postWorker("/api/sessions/observations", {
    sessionId: claudeSessionId,
    type: "tool_use",
    toolName: input.tool_name,
    toolNamespace: "claude-code",
    inputPreview: preview(input.tool_input),
    outputPreview: preview(input.tool_response),
  });

  // Only buffer for on-chain flush if a OneMem session was opened at SessionStart.
  if (!readSessionState(claudeSessionId)) return;

  bufferToolCall(claudeSessionId, {
    toolName: input.tool_name,
    toolInput: input.tool_input ?? null,
    toolResponse: input.tool_response ?? null,
  });
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
