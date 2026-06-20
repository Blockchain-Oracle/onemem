#!/usr/bin/env node
// OneMem Claude Code plugin — Stop hook.
// Marks the session ended on the local OneMem worker so the dashboard shows it
// closed. Defensive: always exits 0.

import { postWorker, readHookInput } from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  const claudeSessionId = input.session_id;
  if (!claudeSessionId) return;
  await postWorker("/api/sessions/end", { id: claudeSessionId, endedAt: Date.now() });
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
