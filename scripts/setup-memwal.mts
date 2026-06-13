#!/usr/bin/env tsx
/**
 * Provision a TESTNET MemWal (Walrus Memory) account + register a delegate key,
 * so OneMem's memory layer runs entirely on testnet (same network as the
 * OneMem trace contract).
 *
 * Why: the Walrus Memory Playground (memory.walrus.xyz) creates MAINNET
 * accounts. For a consistent, cheap testnet build we create the account
 * programmatically with the funded sui keystore as owner, and register the
 * delegate key whose private key lives in .env (ONEMEM_DELEGATE_KEY).
 *
 * Reads from env (.env): MEMWAL_PACKAGE_ID, MEMWAL_REGISTRY_ID,
 * ONEMEM_DELEGATE_PUBKEY. Owner = first key in ~/.sui/sui_config/sui.keystore
 * (must be on testnet + funded).
 *
 * Run: `set -a && . ./.env && set +a && pnpm exec tsx scripts/setup-memwal.ts`
 * Prints the new ONEMEM_ACCOUNT_ID to paste into .env.
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { addDelegateKey, createAccount } from "@mysten-incubation/memwal/account";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

const TESTNET_RPC = "https://fullnode.testnet.sui.io:443";

function ownerKeypair(): Ed25519Keypair {
  const path = join(homedir(), ".sui", "sui_config", "sui.keystore");
  const entries = JSON.parse(readFileSync(path, "utf8")) as string[];
  const decoded = Buffer.from(entries[0]!, "base64");
  if (decoded[0] !== 0) throw new Error(`First keystore key is not Ed25519 (flag ${decoded[0]})`);
  return Ed25519Keypair.fromSecretKey(decoded.subarray(1));
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name} (did you 'set -a && . ./.env'?)`);
  return v;
}

async function main() {
  const packageId = requireEnv("MEMWAL_PACKAGE_ID");
  const registryId = requireEnv("MEMWAL_REGISTRY_ID");
  const delegatePubkey = requireEnv("ONEMEM_DELEGATE_PUBKEY");

  const owner = ownerKeypair();
  const suiPrivateKey = owner.getSecretKey(); // suiprivkey1...
  // biome-ignore lint/suspicious/noExplicitAny: pass our client to the memwal account helpers
  const suiClient = new SuiJsonRpcClient({ url: TESTNET_RPC, network: "testnet" }) as any;

  console.log(`Owner (testnet): ${owner.toSuiAddress()}`);
  console.log(`MemWal package:  ${packageId}`);

  let accountId: string;
  try {
    console.log("Creating MemWalAccount on testnet...");
    const created = await createAccount({ packageId, registryId, suiPrivateKey, suiClient });
    accountId = created.accountId;
    console.log(`  created account: ${accountId} (digest ${created.digest})`);
  } catch (error) {
    // The contract allows ONE account per address — if it already exists, the
    // owner must reuse it. Surface a clear message to look it up.
    console.error(
      `createAccount failed (likely this address already owns one): ${(error as Error).message}`,
    );
    throw error;
  }

  console.log("Registering delegate key...");
  const added = await addDelegateKey({
    packageId,
    accountId,
    publicKey: delegatePubkey,
    label: "onemem-agent",
    suiPrivateKey,
    suiClient,
  });
  console.log(`  delegate registered: ${added.suiAddress} (digest ${added.digest})`);

  console.log("\n✓ Done. Update .env:");
  console.log(`  ONEMEM_ACCOUNT_ID=${accountId}`);
}

main().catch((err: unknown) => {
  console.error("FATAL:", err instanceof Error ? err.message : err);
  process.exit(1);
});
