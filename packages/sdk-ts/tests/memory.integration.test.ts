// Real-system test for the Memory layer (Mem0-mirror wrapping MemWal /manual).
//
// The headline flow: add() stores a Seal-encrypted memory on Walrus via MemWal
// AND emits an on-chain OneMem ActionCall; search() recalls it; verifySession()
// proves the memory write is on-chain + tamper-evident.
//
// Gated behind ONEMEM_INTEGRATION=1 + the MemWal creds in .env. Needs a funded
// testnet keystore, a testnet MemWal account (scripts/setup-memwal.mts), and an
// embedding API key. Run:
//   set -a && . ./.env && set +a && ONEMEM_INTEGRATION=1 \
//     pnpm --filter @onemem/sdk-ts test memory.integration

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { describe, expect, it } from "vitest";

import { NamespaceKind, OneMem, SessionStatus } from "../src/index.js";

const env = process.env;
const memoryEnv = {
  delegateKey: env.ONEMEM_DELEGATE_KEY,
  accountId: env.ONEMEM_ACCOUNT_ID,
  embeddingApiKey: env.ONEMEM_EMBEDDING_API_KEY,
  memwalPackageId: env.MEMWAL_PACKAGE_ID,
  relayerUrl: env.MEMWAL_RELAYER_URL,
};
const RUN =
  env.ONEMEM_INTEGRATION === "1" &&
  Object.values(memoryEnv).every((value) => typeof value === "string" && value.length > 0);

const SEAL_PLACEHOLDER = "0x0000000000000000000000000000000000000000000000000000000000000FEE";

function deployer(): Ed25519Keypair {
  const path = join(homedir(), ".sui", "sui_config", "sui.keystore");
  const entries = JSON.parse(readFileSync(path, "utf8")) as string[];
  const firstEntry = entries[0];
  if (!firstEntry) {
    throw new Error("Sui keystore has no deployer key");
  }
  return Ed25519Keypair.fromSecretKey(Buffer.from(firstEntry, "base64").subarray(1));
}

function requireMemoryEnv(): {
  delegateKey: string;
  accountId: string;
  embeddingApiKey: string;
  memwalPackageId: string;
  relayerUrl: string;
} {
  const { delegateKey, accountId, embeddingApiKey, memwalPackageId, relayerUrl } = memoryEnv;
  if (!delegateKey || !accountId || !embeddingApiKey || !memwalPackageId || !relayerUrl) {
    throw new Error("Missing live MemWal integration environment");
  }
  return { delegateKey, accountId, embeddingApiKey, memwalPackageId, relayerUrl };
}

describe.skipIf(!RUN)("memory layer (live testnet, MemWal /manual)", () => {
  it("add() stores an encrypted memory + emits a verifiable on-chain ActionCall, search() recalls it", async () => {
    const signer = deployer();
    const onemem = await OneMem.create({
      network: "testnet",
      signer,
      memory: requireMemoryEnv(),
    });
    expect(onemem.memory).toBeDefined();

    // OneMem trace context so the memory write also becomes a verifiable ActionCall.
    const ns = await onemem.namespaces.create({
      name: `mem-${Date.now().toString(36)}`,
      kind: NamespaceKind.User,
      sealPackageId: SEAL_PLACEHOLDER,
    });
    await onemem.client.waitForTransaction({ digest: ns.txDigest });
    const rw = await onemem.namespaces.shareReadWrite({
      namespaceId: ns.namespaceId,
      adminCapId: ns.adminCapId,
      recipient: onemem.senderAddress(),
    });
    const session = await onemem.traces.startSession({
      namespaceId: ns.namespaceId,
      rwCapId: rw.capId,
      agentId: "memory-it",
      environment: "testnet-it",
      sdkVersion: "0.1.0",
    });

    const fact = `OneMem integration: my favorite language is Move and I deploy on Sui (${Date.now()})`;
    const added = await onemem.requireMemory().add(fact, {
      sessionId: session.sessionId,
      onememNamespaceId: ns.namespaceId,
      rwCapId: rw.capId,
    });
    expect(added.walrusBlobId).toBeTruthy();
    expect(added.callId).toBeTruthy(); // the verifiable on-chain ActionCall
    expect(added.attestation.inputHashHex.startsWith("0x")).toBe(true);

    // Recall it via vector search (relayer never saw plaintext).
    const found = await onemem.requireMemory().search("what language do I like to build with");
    expect(found.results.some((m) => m.text.includes("favorite language is Move"))).toBe(true);
    const topResult = found.results[0];
    expect(topResult).toBeDefined();
    expect(topResult?.relevance).toBeGreaterThan(0);

    // The memory write is now provable on-chain.
    await onemem.traces.endSession({
      sessionId: session.sessionId,
      namespaceId: ns.namespaceId,
      rwCapId: rw.capId,
      status: SessionStatus.Completed,
    });
    const verify = await onemem.traces.verifySession(session.sessionId);
    expect(verify.ok).toBe(true);
    expect(verify.callCount).toBe(1);
  }, 180_000);
});
