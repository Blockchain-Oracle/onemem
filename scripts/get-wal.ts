#!/usr/bin/env tsx
/**
 * Fund the active sui keystore address with testnet WAL by swapping SUI on the
 * Walrus testnet exchange. Walrus blob writes are paid in WAL (separate from
 * SUI gas), so any address that runs the Walrus integration needs some.
 *
 * No walrus CLI required — this calls `wal_exchange::exchange_all_for_wal`
 * directly (discovered via the live exchange object's type).
 *
 * Usage:
 *   pnpm exec tsx scripts/get-wal.ts            # swaps 0.5 SUI -> WAL
 *   pnpm exec tsx scripts/get-wal.ts 1000000000 # swaps 1.0 SUI (MIST) -> WAL
 */

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

// Walrus testnet SUI<->WAL exchange (from @mysten/walrus TESTNET config +
// the exchange object's on-chain type).
const EXCHANGE_PACKAGE = "0x82593828ed3fcb8c6a235eac9abd0adbe9c5f9bbffa9b1e7a45cdd884481ef9f";
const EXCHANGE_ID = "0xf4d164ea2def5fe07dc573992a029e010dba09b1a8dcbc44c5c2e79567f39073";
const TESTNET_RPC = "https://fullnode.testnet.sui.io:443";
const DEFAULT_SUI_MIST = 500_000_000; // 0.5 SUI

function loadKeypair(): Ed25519Keypair {
  const path = join(homedir(), ".sui", "sui_config", "sui.keystore");
  const entries = JSON.parse(readFileSync(path, "utf8")) as string[];
  const decoded = Buffer.from(entries[0]!, "base64");
  if (decoded[0] !== 0) {
    throw new Error(`First keystore key is not Ed25519 (flag=${decoded[0]})`);
  }
  return Ed25519Keypair.fromSecretKey(decoded.subarray(1));
}

async function main() {
  const amount = Number(process.argv[2] ?? DEFAULT_SUI_MIST);
  const signer = loadKeypair();
  const client = new SuiJsonRpcClient({ url: TESTNET_RPC, network: "testnet" });

  console.log(`Swapping ${amount} MIST SUI -> WAL for ${signer.toSuiAddress()}...`);

  const tx = new Transaction();
  const [sui] = tx.splitCoins(tx.gas, [amount]);
  const wal = tx.moveCall({
    target: `${EXCHANGE_PACKAGE}::wal_exchange::exchange_all_for_wal`,
    arguments: [tx.object(EXCHANGE_ID), sui],
  });
  tx.transferObjects([wal], signer.toSuiAddress());

  const result = await client.signAndExecuteTransaction({
    signer,
    transaction: tx,
    options: { showEffects: true, showBalanceChanges: true },
  });

  console.log(`status: ${result.effects?.status?.status}  digest: ${result.digest}`);
  for (const change of result.balanceChanges ?? []) {
    console.log(`  ${change.coinType}: ${change.amount}`);
  }
}

main().catch((err: unknown) => {
  console.error("FATAL:", err);
  process.exit(1);
});
