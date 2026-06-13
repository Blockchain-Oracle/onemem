// Real-system integration tests for @onemem/sdk-ts against LIVE Sui testnet.
//
// Gated behind ONEMEM_INTEGRATION=1 — these hit the network and (for the
// round-trip) spend testnet gas from the active sui keystore, so they are NOT
// part of default CI. They are the repeatable capture of the manual
// real-system check described in docs/.../TESTING_STRATEGY.md.
//
// Run: ONEMEM_INTEGRATION=1 pnpm --filter @onemem/sdk-ts test

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { describe, expect, it } from "vitest";

import { CallStatus, NamespaceKind, OneMem, SessionStatus } from "../src/index.js";

const RUN_INTEGRATION = process.env.ONEMEM_INTEGRATION === "1";

// The canonical verified demo session (see docs/.../DEMO_SESSIONS.md).
const DEMO_SESSION_ID = "0x08f4ef5b53c768eb446a18659ecc0775ac1a58763890ae51d6658c301a3f33e8";
const DEMO_MERKLE_ROOT = "0x82fb3f4cd63059e4172938178d1a8b4dd59bf66a1575c1c4002727df5aae806e";
const SEAL_PACKAGE_PLACEHOLDER =
  "0x0000000000000000000000000000000000000000000000000000000000000FEE";

function hex(bytes: Uint8Array): string {
  return `0x${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`;
}

function loadDeployerKeypair(): Ed25519Keypair {
  const path = join(homedir(), ".sui", "sui_config", "sui.keystore");
  const entries = JSON.parse(readFileSync(path, "utf8")) as string[];
  const decoded = Buffer.from(entries[0]!, "base64");
  if (decoded[0] !== 0) {
    throw new Error(`First keystore key is not Ed25519 (flag=${decoded[0]})`);
  }
  return Ed25519Keypair.fromSecretKey(decoded.subarray(1));
}

describe.skipIf(!RUN_INTEGRATION)("sdk-ts integration (live testnet)", () => {
  it("re-verifies the canonical demo session (read-only, no gas)", async () => {
    // verifySession is read-only, so any keypair works as the signer.
    const onemem = await OneMem.create({
      network: "testnet",
      signer: Ed25519Keypair.generate(),
    });

    const result = await onemem.traces.verifySession(DEMO_SESSION_ID);

    expect(result.ok).toBe(true);
    expect(result.brokenAt).toBeNull();
    expect(hex(result.computedMerkleRoot)).toBe(DEMO_MERKLE_ROOT);
    expect(hex(result.expectedMerkleRoot)).toBe(DEMO_MERKLE_ROOT);
  });

  it("completes a full namespace → session → calls → verify round-trip", async () => {
    const onemem = await OneMem.create({
      network: "testnet",
      signer: loadDeployerKeypair(),
    });
    const me = onemem.senderAddress();
    const name = `it-${Date.now().toString(36)}`;

    const ns = await onemem.namespaces.create({
      name,
      kind: NamespaceKind.User,
      sealPackageId: SEAL_PACKAGE_PLACEHOLDER,
    });
    const rw = await onemem.namespaces.shareReadWrite({
      namespaceId: ns.namespaceId,
      adminCapId: ns.adminCapId,
      recipient: me,
    });
    const session = await onemem.traces.openSession({
      namespaceId: ns.namespaceId,
      rwCapId: rw.capId,
      agentId: "vitest-integration",
      environment: "testnet-it",
      sdkVersion: "0.1.0",
    });

    const callIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const { callId } = await onemem.traces.emitCall({
        sessionId: session.sessionId,
        namespaceId: ns.namespaceId,
        rwCapId: rw.capId,
        parentCallId: callIds[callIds.length - 1] ?? null,
        toolName: `tool-${i}`,
        toolNamespace: "vitest-it",
        walrusInputBlob: `walrus:placeholder-${i}`,
        inputHash: new Uint8Array([i, i + 1, i + 2]),
      });
      callIds.push(callId);
    }
    for (const [i, callId] of callIds.entries()) {
      await onemem.traces.closeCall({
        sessionId: session.sessionId,
        rwCapId: rw.capId,
        callId,
        walrusOutputBlob: `walrus:output-${i}`,
        outputHash: new Uint8Array([0xa0 + i, 0xb0 + i, 0xc0 + i]),
        status: CallStatus.Success,
      });
    }
    await onemem.traces.closeSession({
      sessionId: session.sessionId,
      rwCapId: rw.capId,
      status: SessionStatus.Completed,
    });

    const verify = await onemem.traces.verifySession(session.sessionId);
    expect(verify.ok).toBe(true);
    expect(verify.callCount).toBe(3);
    expect(verify.brokenAt).toBeNull();
    expect(hex(verify.computedMerkleRoot)).toBe(hex(verify.expectedMerkleRoot));
  }, 120_000);

  it("stores real tool I/O on Walrus and the trace stays verifiable", async () => {
    const onemem = await OneMem.create({
      network: "testnet",
      signer: loadDeployerKeypair(),
    });
    // testnet has a default upload relay, so the Walrus store is wired up.
    expect(onemem.walrus).toBeDefined();

    // (a) direct Walrus round-trip: bytes survive upload → read.
    const payload = new TextEncoder().encode(`onemem walrus content ${Date.now()}`);
    const blobId = await onemem.requireWalrus().uploadBlob(payload);
    expect(blobId).toBeTruthy();
    expect(blobId.startsWith("walrus:")).toBe(false); // real id, not a placeholder
    const fetched = await onemem.requireWalrus().readBlob(blobId);
    expect(new TextDecoder().decode(fetched)).toBe(new TextDecoder().decode(payload));

    // (b) the emit/close path uploads content to Walrus + auto-derives the
    // on-chain hash from the bytes, and the Merkle chain still verifies.
    const me = onemem.senderAddress();
    const ns = await onemem.namespaces.create({
      name: `wal-${Date.now().toString(36)}`,
      kind: NamespaceKind.User,
      sealPackageId: SEAL_PACKAGE_PLACEHOLDER,
    });
    const rw = await onemem.namespaces.shareReadWrite({
      namespaceId: ns.namespaceId,
      adminCapId: ns.adminCapId,
      recipient: me,
    });
    const session = await onemem.traces.openSession({
      namespaceId: ns.namespaceId,
      rwCapId: rw.capId,
      agentId: "vitest-walrus",
      environment: "testnet-it",
      sdkVersion: "0.1.0",
    });
    const { callId } = await onemem.traces.emitCall({
      sessionId: session.sessionId,
      namespaceId: ns.namespaceId,
      rwCapId: rw.capId,
      toolName: "Read",
      toolNamespace: "walrus-it",
      inputContent: new TextEncoder().encode("real tool input bytes"),
    });
    await onemem.traces.closeCall({
      sessionId: session.sessionId,
      rwCapId: rw.capId,
      callId,
      outputContent: new TextEncoder().encode("real tool output bytes"),
      status: CallStatus.Success,
    });
    await onemem.traces.closeSession({
      sessionId: session.sessionId,
      rwCapId: rw.capId,
      status: SessionStatus.Completed,
    });

    const verify = await onemem.traces.verifySession(session.sessionId);
    expect(verify.ok).toBe(true);
    expect(verify.callCount).toBe(1);
  }, 180_000);

  it("Seal-encrypts content, stores on Walrus, and a cap holder decrypts it", async () => {
    const onemem = await OneMem.create({
      network: "testnet",
      signer: loadDeployerKeypair(),
    });
    expect(onemem.seal).toBeDefined();
    const me = onemem.senderAddress();

    // Namespace whose Seal policy package is our deployed onemem package.
    const ns = await onemem.namespaces.create({
      name: `seal-${Date.now().toString(36)}`,
      kind: NamespaceKind.User,
      sealPackageId: onemem.addresses.packageId,
    });
    await onemem.client.waitForTransaction({ digest: ns.txDigest });
    const rw = await onemem.namespaces.shareReadWrite({
      namespaceId: ns.namespaceId,
      adminCapId: ns.adminCapId,
      recipient: me,
    });

    const secret = new TextEncoder().encode(`private agent memory ${Date.now()}`);
    const ciphertext = await onemem.requireSeal().encrypt(secret, ns.namespaceId);
    // Ciphertext must NOT contain the plaintext.
    expect(new TextDecoder().decode(ciphertext)).not.toContain("private agent memory");

    const blobId = await onemem.requireWalrus().uploadBlob(ciphertext);
    const fetched = await onemem.requireWalrus().readBlob(blobId);

    const decrypted = await onemem.requireSeal().decrypt(fetched, {
      namespaceId: ns.namespaceId,
      capId: rw.capId,
      capKind: "ReadWrite",
    });
    expect(new TextDecoder().decode(decrypted)).toBe(new TextDecoder().decode(secret));
  }, 180_000);
});
