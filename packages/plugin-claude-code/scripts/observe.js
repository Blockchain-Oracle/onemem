#!/usr/bin/env node
// OneMem Claude Code plugin — PostToolUse hook.
// Buffers each tool call to a local file INSTANTLY (no network) so Claude Code
// stays responsive; the buffer is flushed on-chain in one batch at SessionEnd
// (per the "hooks must be fast" rule). Defensive: always exits 0.

import {
  bufferToolCall,
  readHookInput,
  readSessionState,
  traceCaptureEnabled,
} from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  if (input.hook_event_name && input.hook_event_name !== "PostToolUse") return;
  const claudeSessionId = input.session_id;
  if (!claudeSessionId || !input.tool_name) return;
  // Only buffer if a OneMem session was opened at SessionStart.
  if (!readSessionState(claudeSessionId)) return;
  if (!(await traceCaptureEnabled("claude-code"))) return;

  bufferToolCall(claudeSessionId, {
    toolName: input.tool_name,
    toolInput: input.tool_input ?? null,
    toolResponse: input.tool_response ?? null,
  });
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
