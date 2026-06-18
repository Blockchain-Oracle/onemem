import { verifyTraceChain } from "@onemem/sdk-ts";
import { type GlobalOpts, printJson, printLine, runCommand, shortHex } from "../util/output.js";
import { readContext } from "../util/sui.js";
import { fetchSessionMeta, statusLabel } from "../util/trace.js";

/**
 * `onemem verify <session-id>` — independently re-verify a TraceSession's Merkle
 * chain from chain data alone. The headline command: zero setup, no signer.
 */
export function verifyCommand(
  sessionId: string,
  _opts: unknown,
  command: { optsWithGlobals(): GlobalOpts },
) {
  const g = command.optsWithGlobals();
  return runCommand(g, async () => {
    const { client, packageId } = readContext(g.network);
    // Prove the session exists FIRST. An empty/absent session has a vacuously
    // valid (empty) Merkle chain, so without this guard `verify <garbage-id>`
    // would print ✓ VERIFIED. fetchSessionMeta throws if the object is absent.
    const meta = await fetchSessionMeta(client, sessionId);
    const result = await verifyTraceChain(client, packageId, sessionId);

    if (g.json) {
      printJson({
        ok: result.ok,
        sessionId,
        callCount: result.callCount,
        sessionCallCount: result.sessionCallCount,
        sessionStatus: result.sessionStatus,
        brokenAt: result.brokenAt,
        rootMatches: result.rootMatches,
        countMatches: result.countMatches,
        expectedMerkleRoot: shortHex(result.expectedMerkleRoot, 64),
        computedMerkleRoot: shortHex(result.computedMerkleRoot, 64),
        agentId: meta.agentId,
      });
      if (!result.ok) process.exitCode = 1;
      return;
    }

    printLine(result.ok ? "✓ VERIFIED" : "✗ VERIFICATION FAILED");
    printLine(`  session    ${sessionId}`);
    printLine(`  agent      ${meta.agentId} (${meta.environment})`);
    printLine(`  status     ${statusLabel(result.sessionStatus ?? meta.status)}`);
    printLine(`  calls      ${result.callCount}/${result.sessionCallCount}`);
    printLine(`  merkleRoot ${shortHex(result.computedMerkleRoot, 64)}`);
    if (!result.ok) {
      printLine(`  brokenAt   ${result.brokenAt ?? "merkle-root mismatch"}`);
      process.exitCode = 1;
    }
  });
}
