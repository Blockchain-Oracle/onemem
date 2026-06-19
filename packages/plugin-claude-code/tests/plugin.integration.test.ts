// Real-system test for the Claude Code plugin hooks.
//
// Simulates EXACTLY what Claude Code does: pipes real hook-event JSON to each
// hook script over stdin (SessionStart -> PostToolUse×2 -> Stop), then
// verifies the resulting OneMem TraceSession is real + tamper-evident on-chain.
//
// Gated behind ONEMEM_INTEGRATION=1 + a funded testnet keystore. Run:
//   ONEMEM_INTEGRATION=1 pnpm --filter @onemem/claude-code-plugin test

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { NamespaceKind, OneMem } from "@onemem/sdk-ts";
import { describe, expect, it } from "vitest";

const RUN = process.env.ONEMEM_INTEGRATION === "1";
const SCRIPTS = fileURLToPath(new URL("../scripts/", import.meta.url));
const SEAL_PLACEHOLDER = "0x0000000000000000000000000000000000000000000000000000000000000FEE";

function deployer(): Ed25519Keypair {
  const path = `${homedir()}/.sui/sui_config/sui.keystore`;
  const entries = JSON.parse(readFileSync(path, "utf8")) as string[];
  const first = entries[0];
  if (!first) throw new Error("Sui keystore is empty");
  return Ed25519Keypair.fromSecretKey(Buffer.from(first, "base64").subarray(1));
}

/** Run a hook script the way Claude Code does: pipe event JSON to stdin. */
function runHook(script: string, event: unknown, env: NodeJS.ProcessEnv): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [`${SCRIPTS}${script}`], {
      env,
      stdio: ["pipe", "inherit", "inherit"],
    });
    child.stdin.write(JSON.stringify(event));
    child.stdin.end();
    child.on("close", (code) => resolve(code ?? 0));
  });
}

describe.skipIf(!RUN)("claude-code plugin hooks (live testnet)", () => {
  it("SessionStart->PostToolUse×2->Stop produces a verifiable on-chain trace", async () => {
    const signer = deployer();
    const onemem = await OneMem.create({ network: "testnet", signer });

    // The plugin needs a OneMem namespace + RW cap (normally configured once).
    const ns = await onemem.namespaces.create({
      name: `cc-${Date.now().toString(36)}`,
      kind: NamespaceKind.User,
      sealPackageId: SEAL_PLACEHOLDER,
    });
    await onemem.client.waitForTransaction({ digest: ns.txDigest });
    const rw = await onemem.namespaces.shareReadWrite({
      namespaceId: ns.namespaceId,
      adminCapId: ns.adminCapId,
      recipient: onemem.senderAddress(),
    });

    const claudeSessionId = `cc-test-${Date.now()}`;
    const env = {
      ...process.env,
      SUI_NETWORK: "testnet",
      ONEMEM_NAMESPACE_ID: ns.namespaceId,
      ONEMEM_RW_CAP_ID: rw.capId,
    } as NodeJS.ProcessEnv;

    // 1. SessionStart → opens a OneMem TraceSession + writes state.
    expect(
      await runHook("inject.js", { session_id: claudeSessionId, source: "startup" }, env),
    ).toBe(0);

    // 2. PostToolUse ×2 → buffer instantly (no chain).
    for (const tool of [
      {
        tool_name: "Read",
        tool_input: { file_path: "/etc/hosts" },
        tool_response: "127.0.0.1 localhost",
      },
      { tool_name: "Bash", tool_input: { command: "ls -la" }, tool_response: "total 0" },
    ]) {
      expect(
        await runHook(
          "observe.js",
          { session_id: claudeSessionId, hook_event_name: "PostToolUse", ...tool },
          env,
        ),
      ).toBe(0);
    }

    // 3. Stop -> flush buffered calls on-chain + close.
    expect(
      await runHook(
        "summarize.js",
        { session_id: claudeSessionId, hook_event_name: "Stop", reason: "stop" },
        env,
      ),
    ).toBe(0);

    // The state file holds the OneMem session id the hooks created.
    const state = JSON.parse(
      readFileSync(`${homedir()}/.onemem/cc-sessions/${claudeSessionId}.json`, "utf8"),
    ) as { onememSessionId: string };
    expect(state.onememSessionId).toBeTruthy();

    const verify = await onemem.traces.verifySession(state.onememSessionId);
    expect(verify.ok).toBe(true);
    expect(verify.callCount).toBe(2); // the two buffered tool calls
  }, 240_000);
});
