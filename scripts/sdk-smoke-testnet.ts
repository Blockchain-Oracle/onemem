#!/usr/bin/env tsx
/**
 * End-to-end SDK smoke test against the deployed testnet package.
 *
 * Exercises the full Pillar 2 surface:
 *   1. Read deployer keypair from ~/.sui/sui_config/sui.keystore
 *   2. OneMem.create({ network: "testnet", signer })
 *   3. namespaces.create({ name, kind, sealPackageId })
 *   4. namespaces.shareReadWrite — mint myself a RW cap so I can open sessions
 *   5. traces.startSession — start a new session
 *   6. traces.appendCall — 3 calls, chained via parent_call_id
 *   7. traces.endSession — lock the Merkle root
 *   8. traces.verifySession — off-chain Merkle walk; assert ok === true
 *
 * Prints the sessionId at the end so it can be used to seed the
 * /verify/[session_id] demo page in apps/hosted-dashboard.
 *
 * Run: `pnpm exec tsx scripts/sdk-smoke-testnet.ts`
 *
 * Requires:
 *   - Active sui CLI env set to testnet (verify with `sui client active-env`)
 *   - Active sui CLI address has gas (`sui client gas`)
 *   - Deployed testnet package (config/networks.json populated)
 *   - codegen-emitted addresses (scripts/codegen-move-types.ts already ran)
 *
 * NOT runnable in CI without a funded testnet keystore. Treat as a manual
 * acceptance test for the SDK + the deployed package. Integration test
 * gated behind `vitest --include integration` is a follow-up.
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import { CallStatus, NamespaceKind, OneMem, SessionStatus } from "../packages/sdk-ts/src/index.js";

const SEAL_PACKAGE_PLACEHOLDER =
  "0x0000000000000000000000000000000000000000000000000000000000000FEE";

function loadDeployerKeypair(): Ed25519Keypair {
  const path = join(homedir(), ".sui", "sui_config", "sui.keystore");
  const entries = JSON.parse(readFileSync(path, "utf8")) as string[];
  if (entries.length === 0) {
    throw new Error(`${path} is empty — initialize sui CLI first`);
  }
  const firstEntry = entries[0];
  if (!firstEntry) {
    throw new Error(`${path} has an empty first keystore entry`);
  }
  // First byte of the decoded buffer is the scheme flag (0x00 = Ed25519);
  // the remaining 32 bytes are the secret seed.
  const decoded = Buffer.from(firstEntry, "base64");
  if (decoded[0] !== 0) {
    throw new Error(`First key in keystore is not Ed25519 (scheme flag = ${decoded[0]}); aborting`);
  }
  const secret = decoded.subarray(1);
  return Ed25519Keypair.fromSecretKey(secret);
}

function hexEnc(bytes: Uint8Array): string {
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

function sessionStatusLabel(status: SessionStatus): string {
  return Object.entries(SessionStatus).find(([, value]) => value === status)?.[0] ?? String(status);
}

async function main() {
  console.log("==> Loading deployer keypair from sui keystore...");
  const signer = loadDeployerKeypair();
  console.log(`    deployer: ${signer.toSuiAddress()}`);

  console.log("==> Initializing OneMem client (testnet)...");
  const onemem = await OneMem.create({ network: "testnet", signer });
  console.log(`    package:  ${onemem.addresses.packageId}`);
  console.log(`    registry: ${onemem.addresses.registryId}`);

  const me = onemem.senderAddress();
  const uniqueSuffix = Date.now().toString(36);
  const namespaceName = `smoke-${uniqueSuffix}`;

  console.log(`\n==> 1. namespaces.create("${namespaceName}")`);
  const created = await onemem.namespaces.create({
    name: namespaceName,
    kind: NamespaceKind.User,
    sealPackageId: SEAL_PACKAGE_PLACEHOLDER,
  });
  console.log(`    namespaceId: ${created.namespaceId}`);
  console.log(`    adminCapId:  ${created.adminCapId}`);

  console.log("\n==> 2. namespaces.shareReadWrite (mint myself a RW cap)");
  const rw = await onemem.namespaces.shareReadWrite({
    namespaceId: created.namespaceId,
    adminCapId: created.adminCapId,
    recipient: me,
  });
  console.log(`    rwCapId: ${rw.capId}`);

  console.log("\n==> 3. traces.startSession");
  const session = await onemem.traces.startSession({
    namespaceId: created.namespaceId,
    rwCapId: rw.capId,
    agentId: "sdk-smoke-test",
    environment: "testnet-smoke",
    sdkVersion: "0.1.0",
  });
  console.log(`    sessionId: ${session.sessionId}`);

  console.log("\n==> 4. traces.appendCall (3 chained calls)");
  const callIds: string[] = [];
  for (let i = 0; i < 3; i++) {
    const parent = callIds[callIds.length - 1] ?? null;
    const emit = await onemem.traces.appendCall({
      sessionId: session.sessionId,
      namespaceId: created.namespaceId,
      rwCapId: rw.capId,
      parentCallId: parent,
      toolName: `tool-${i}`,
      toolNamespace: "sdk-smoke",
      input: {
        walrusBlob: `walrus:placeholder-${i}`,
        hash: new Uint8Array([i, i + 1, i + 2]),
      },
      label: `step ${i}`,
    });
    console.log(`    call[${i}]: ${emit.callId} (parent=${parent ?? "<root>"})`);
    callIds.push(emit.callId);
  }

  console.log("\n==> 5. traces.closeCall on each (with output_hash + status=SUCCESS)");
  for (const [i, callId] of callIds.entries()) {
    await onemem.traces.closeCall({
      sessionId: session.sessionId,
      namespaceId: created.namespaceId,
      rwCapId: rw.capId,
      callId,
      output: {
        walrusBlob: `walrus:output-${i}`,
        hash: new Uint8Array([0xa0 + i, 0xb0 + i, 0xc0 + i]),
      },
      status: CallStatus.Success,
    });
  }
  console.log("    all calls closed");

  console.log("\n==> 6. traces.endSession (COMPLETED)");
  await onemem.traces.endSession({
    sessionId: session.sessionId,
    namespaceId: created.namespaceId,
    rwCapId: rw.capId,
    status: SessionStatus.Completed,
  });

  console.log("\n==> 7. traces.verifySession (off-chain Merkle walk)");
  const verify = await onemem.traces.verifySession(session.sessionId);
  console.log(`    ok:           ${verify.ok}`);
  console.log(`    callCount:    ${verify.callCount}`);
  console.log(
    `    sessionStatus:${verify.sessionStatus} (${sessionStatusLabel(verify.sessionStatus)})`,
  );
  console.log(`    expectedRoot: ${hexEnc(verify.expectedMerkleRoot)}`);
  console.log(`    computedRoot: ${hexEnc(verify.computedMerkleRoot)}`);
  console.log(`    brokenAt:     ${verify.brokenAt}`);

  if (!verify.ok) {
    console.error("\n✗ VERIFY FAILED");
    process.exit(1);
  }

  console.log("\n✓ SDK SMOKE TESTNET PASSED");
  console.log("");
  console.log("Demo session ready:");
  console.log(`  sessionId:    ${session.sessionId}`);
  console.log(`  suiscan:      ${onemem.addresses.suiscanBase}/object/${session.sessionId}`);
  console.log(`  /verify/<id>: visit /verify/${session.sessionId} once the hosted dashboard is up`);
}

main().catch((err: unknown) => {
  console.error("FATAL:", err);
  process.exit(1);
});
