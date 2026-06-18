#!/usr/bin/env node
// OneMem Claude Code plugin — SessionEnd hook.
// Flushes the buffered tool calls into the OneMem TraceSession (each as a
// Seal-encrypted, Walrus-stored, Merkle-chained ActionCall) and closes the
// session — producing one verifiable on-chain trace per Claude session.
// Defensive: always exits 0.

import {
  clearBufferedToolCalls,
  clearSessionState,
  drainToolCalls,
  loadClient,
  loadConfig,
  readBufferedToolCalls,
  readHookInput,
  readSessionState,
  traceCaptureEnabled,
} from "./onemem-lib.mjs";

const enc = (v) => new TextEncoder().encode(typeof v === "string" ? v : JSON.stringify(v ?? ""));

async function main() {
  const input = await readHookInput();
  const claudeSessionId = input.session_id;
  const config = loadConfig();
  if (!config || !claudeSessionId) return;

  const state = readSessionState(claudeSessionId);
  if (!state) return;
  const calls = readBufferedToolCalls(claudeSessionId);
  if (!(await traceCaptureEnabled("claude-code"))) {
    clearBufferedToolCalls(claudeSessionId);
    clearSessionState(claudeSessionId);
    return;
  }

  const onemem = await loadClient(config);
  if (!onemem) return;
  drainToolCalls(claudeSessionId);

  // Flush each buffered tool call as a verifiable ActionCall.
  const { CallStatus, SessionStatus } = await import("@onemem/sdk-ts");
  let parentCallId = null;
  for (const call of calls) {
    const emitted = await onemem.traces.appendCall({
      sessionId: state.onememSessionId,
      namespaceId: state.namespaceId,
      rwCapId: state.rwCapId,
      parentCallId,
      toolName: call.toolName,
      toolNamespace: "claude-code",
      input: { content: enc(call.toolInput), encrypt: true },
    });
    await onemem.traces.closeCall({
      sessionId: state.onememSessionId,
      rwCapId: state.rwCapId,
      namespaceId: state.namespaceId,
      callId: emitted.callId,
      output: { content: enc(call.toolResponse), encrypt: true },
      status: CallStatus.Success,
    });
    parentCallId = emitted.callId;
  }

  await onemem.traces.endSession({
    sessionId: state.onememSessionId,
    namespaceId: state.namespaceId,
    rwCapId: state.rwCapId,
    status: SessionStatus.Completed,
  });
  process.stderr.write(
    `[onemem] flushed ${calls.length} call(s) → verifiable session ${state.onememSessionId}\n`,
  );
}

main()
  .catch(() => {})
  .finally(() => process.exit(0));
