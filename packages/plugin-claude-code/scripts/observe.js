#!/usr/bin/env node
// OneMem Claude Code plugin — PostToolUse hook.
// Posts each tool call to the local OneMem worker INSTANTLY so the dashboard
// fills up live. Defensive: always exits 0.

import { captureEnabled, postWorker, preview, readHookInput } from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  if (input.hook_event_name && input.hook_event_name !== "PostToolUse") return;
  const claudeSessionId = input.session_id;
  if (!claudeSessionId || !input.tool_name) return;
  if (!(await captureEnabled("claude-code"))) return;

  // Raw tool call → the worker's event queue (hot path). The observer compresses
  // it into a readable observation card in the background.
  await postWorker("/api/events", {
    sessionId: claudeSessionId,
    toolName: input.tool_name,
    toolNamespace: "claude-code",
    inputPreview: preview(input.tool_input),
    outputPreview: preview(input.tool_response),
  });
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
