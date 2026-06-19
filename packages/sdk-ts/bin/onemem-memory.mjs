#!/usr/bin/env node
// onemem-memory — add/search OneMem memories from a non-JS runtime. The bridge
// the Python SDK (and its plugins) shell out to so they get the full MemWal
// round-trip (client-side Seal encryption + Walrus + embeddings) without
// reimplementing any of it.
//
// Reads a JSON payload from argv[2] (a file path) or stdin:
//   { "op": "add",    "text": "...",  "namespace"?, "userId"?, "agentId"?, "runId"?, "metadata"? }
//   { "op": "search", "query": "...", "topK"?, "namespace"?, "userId"?, "agentId"?, "runId"?, "metadata"? }
//   { "op": "get",    "id": "..." }
//   { "op": "list",   "userId"?, "agentId"?, "runId"?, "namespace"?, "metadata"?, "limit"? }
//   { "op": "delete", "id": "..." }
//
// Memory config comes from env (ONEMEM_DELEGATE_KEY / ONEMEM_ACCOUNT_ID /
// ONEMEM_EMBEDDING_API_KEY [+ MEMWAL_PACKAGE_ID / MEMWAL_RELAYER_URL]).
// Signer: ONEMEM_PRIVATE_KEY → sui keystore → generated+persisted wallet.
// Prints one JSON line to stdout:
//   add    -> { "memoryId", "walrusBlobId", "inputHashHex"? }
//   search -> { "results": [{ "text", "walrusBlobId", "relevance" }, ...] }
//   get    -> { "memory": StoredMemory | null }
//   list   -> { "memories": StoredMemory[] }
//   delete -> { "id", "deleted": boolean }

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

  const scope = {
    namespace: p.namespace,
    userId: p.userId,
    agentId: p.agentId,
    runId: p.runId,
    metadata: p.metadata,
  };

  if (p.op === "add") {
    if (typeof p.text !== "string" || p.text.length === 0) {
      throw new Error("add requires a non-empty 'text'");
    }
    const r = await onemem.requireMemory().add(p.text, scope);
    process.stdout.write(
      `${JSON.stringify({ memoryId: r.memoryId, walrusBlobId: r.walrusBlobId, inputHashHex: r.inputHashHex })}\n`,
    );
    return;
  }

  if (p.op === "search") {
    if (typeof p.query !== "string" || p.query.length === 0) {
      throw new Error("search requires a non-empty 'query'");
    }
    const r = await onemem.requireMemory().search(p.query, { ...scope, topK: p.topK });
    process.stdout.write(`${JSON.stringify({ results: r.results })}\n`);
    return;
  }

  if (p.op === "get") {
    if (typeof p.id !== "string" || p.id.length === 0) {
      throw new Error("get requires a non-empty 'id'");
    }
    const memory = await onemem.requireMemory().get(p.id);
    process.stdout.write(`${JSON.stringify({ memory })}\n`);
    return;
  }

  if (p.op === "list") {
    const memories = await onemem.requireMemory().getAll({
      userId: p.userId,
      agentId: p.agentId,
      runId: p.runId,
      namespace: p.namespace,
      metadata: p.metadata,
      limit: p.limit,
    });
    process.stdout.write(`${JSON.stringify({ memories })}\n`);
    return;
  }

  if (p.op === "delete") {
    if (typeof p.id !== "string" || p.id.length === 0) {
      throw new Error("delete requires a non-empty 'id'");
    }
    const deleted = await onemem.requireMemory().delete(p.id);
    process.stdout.write(`${JSON.stringify({ id: p.id, deleted })}\n`);
    return;
  }

  throw new Error(
    `unknown op "${p.op}" — expected one of: add, search, get, list, delete`,
  );
}

main().catch((err) => {
  console.error(`[onemem-memory] ${err instanceof Error ? err.stack : String(err)}`);
  process.exit(1);
});
