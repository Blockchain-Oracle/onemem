#!/usr/bin/env node
// onemem-memory — add/search OneMem memories from a non-JS runtime. The bridge
// the Python SDK (and its plugins) shell out to so they get the full MemWal
// round-trip (client-side Seal encryption + Walrus + embeddings + on-chain
// attestation) without reimplementing any of it — mirroring `onemem-trace`.
//
// Reads a JSON payload from argv[2] (a file path) or stdin:
//   { "op": "add",    "text": "...",  "namespace": "..."? }
//   { "op": "search", "query": "...", "topK": 5?, "namespace": "..."? }
//
// Memory config comes from env (ONEMEM_DELEGATE_KEY / ONEMEM_ACCOUNT_ID /
// ONEMEM_EMBEDDING_API_KEY [+ MEMWAL_PACKAGE_ID / MEMWAL_RELAYER_URL]).
// Signer: ONEMEM_PRIVATE_KEY → sui keystore → generated+persisted wallet.
// Prints one JSON line to stdout:
//   add    -> { "memoryId", "walrusBlobId", "attestation": {...} }
//   search -> { "results": [{ "text", "walrusBlobId", "relevance" }, ...] }

import { readFileSync } from "node:fs";

import { memoryConfigFromEnv, OneMem, resolveSigner } from "../dist/runtime.js";

function readPayload() {
  const path = process.argv[2];
  const raw = path ? readFileSync(path, "utf8") : readFileSync(0, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const p = readPayload();
  const network = p.network ?? process.env.SUI_NETWORK ?? "testnet";
  const logger = { info: (m) => console.error(m), warn: (m) => console.error(m) };

  const memory = memoryConfigFromEnv();
  if (!memory) {
    throw new Error(
      "memory not configured — set ONEMEM_DELEGATE_KEY, ONEMEM_ACCOUNT_ID, ONEMEM_EMBEDDING_API_KEY",
    );
  }

  const onemem = await OneMem.create({
    network,
    rpcUrl: process.env.ONEMEM_RPC_URL,
    signer: resolveSigner(process.env.ONEMEM_PRIVATE_KEY, logger),
    memory,
  });

  if (p.op === "add") {
    if (typeof p.text !== "string" || p.text.length === 0) {
      throw new Error("add requires a non-empty 'text'");
    }
    const r = await onemem.requireMemory().add(p.text, { namespace: p.namespace });
    process.stdout.write(
      `${JSON.stringify({ memoryId: r.memoryId, walrusBlobId: r.walrusBlobId, attestation: r.attestation })}\n`,
    );
    return;
  }

  if (p.op === "search") {
    if (typeof p.query !== "string" || p.query.length === 0) {
      throw new Error("search requires a non-empty 'query'");
    }
    const r = await onemem
      .requireMemory()
      .search(p.query, { namespace: p.namespace, topK: p.topK });
    process.stdout.write(`${JSON.stringify({ results: r.results })}\n`);
    return;
  }

  throw new Error(`unknown op "${p.op}" — expected "add" or "search"`);
}

main().catch((err) => {
  console.error(`[onemem-memory] ${err instanceof Error ? err.stack : String(err)}`);
  process.exit(1);
});
