#!/usr/bin/env node
import { postWorker, readHookInput, sessionIdFromInput, writeCodexOutput } from "./onemem-lib.mjs";

async function main() {
  const input = await readHookInput();
  const sessionId = sessionIdFromInput(input);
  if (sessionId) {
    await postWorker("/api/sessions/end", { id: sessionId, endedAt: Date.now() });
  }
}

main()
  .catch(() => {})
  .finally(() => {
    writeCodexOutput({ continue: true });
    process.exit(0);
  });
