#!/usr/bin/env tsx
/**
 * REAL MemWal-testnet integration test for the Mem0 CRUD/scoping layer.
 *
 * End-to-end against the live testnet relayer + Walrus + Seal:
 *   1. add two memories scoped to userId "itest-<unique>" (+ metadata)
 *   2. getAll({ userId }) returns BOTH
 *   3. get(id) returns ONE (with correct text + scope)
 *   4. search(query, { userId }) returns them ranked by relevance
 *   5. delete(id) one
 *   6. getAll / search no longer return the deleted one
 *
 * Gated: exits 0 with a SKIP message when MemWal creds are absent (so CI skips
 * it). Run for real with:
 *
 *   set -a; . ./.env; set +a
 *   mise exec -- pnpm exec tsx packages/sdk-ts/scripts/memory-crud-itest.mts
 *
 * Uses a TEMP index db so it never pollutes ~/.onemem/memory-index.db.
 */

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { OneMem } from "../src/client.js";
import { memoryConfigFromEnv, resolveSigner } from "../src/runtime.js";

function log(step: string, detail: unknown = ""): void {
  const body = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
  console.log(`\n=== ${step} ===${body ? `\n${body}` : ""}`);
}

function assert(cond: boolean, message: string): void {
  if (!cond) throw new Error(`ASSERTION FAILED: ${message}`);
  console.log(`  ✓ ${message}`);
}

async function main(): Promise<void> {
  const memory = memoryConfigFromEnv();
  if (!memory) {
    console.log(
      "SKIP: MemWal creds not set (ONEMEM_DELEGATE_KEY / ONEMEM_ACCOUNT_ID / ONEMEM_EMBEDDING_API_KEY / MEMWAL_PACKAGE_ID). " +
        "Run with `set -a; . ./.env; set +a` to execute the real testnet integration.",
    );
    process.exit(0);
  }

  const network = (process.env.SUI_NETWORK ?? "testnet") as "testnet" | "mainnet";
  // Isolate the index in a temp file so the test is self-contained.
  const indexPath = join(mkdtempSync(join(tmpdir(), "onemem-crud-itest-")), "index.db");
  const userId = `itest-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  log("config", { network, userId, accountId: memory.accountId, indexPath });

  const onemem = await OneMem.create({
    network,
    rpcUrl: process.env.ONEMEM_RPC_URL,
    signer: resolveSigner(process.env.ONEMEM_PRIVATE_KEY, { info: (m) => console.error(m) }),
    memory: { ...memory, indexPath },
  });
  const mem = onemem.requireMemory();

  const TEXT_A = `OneMem itest: ${userId} prefers the Move programming language on Sui.`;
  const TEXT_B = `OneMem itest: ${userId} is based in Lagos and ships at night.`;

  try {
    // 1. add two memories scoped to the user, with metadata.
    log("1. add two memories");
    const a = await mem.add(TEXT_A, { userId, metadata: { topic: "language", n: 1 } });
    log("  add A ->", a);
    const b = await mem.add(TEXT_B, { userId, metadata: { topic: "location", n: 2 } });
    log("  add B ->", b);
    assert(!!a.memoryId && !!a.walrusBlobId, "add A returned a memoryId + walrusBlobId");
    assert(!!b.memoryId && !!b.walrusBlobId, "add B returned a memoryId + walrusBlobId");

    // 2. getAll({ userId }) returns both.
    log("2. getAll({ userId })");
    const all = await mem.getAll({ userId });
    log("  getAll ->", all);
    assert(all.length === 2, `getAll returned 2 memories (got ${all.length})`);
    const texts = all.map((m) => m.text).sort();
    assert(
      texts.includes(TEXT_A) && texts.includes(TEXT_B),
      "getAll texts match the two added memories (content verified, not just count)",
    );
    assert(
      all.every((m) => m.userId === userId && m.namespace === `user:${userId}`),
      "getAll rows carry the right userId + derived namespace user:<id>",
    );

    // 3. get(id) returns one with correct text + scope + metadata.
    log("3. get(id) for A");
    const gotA = await mem.get(a.memoryId);
    log("  get A ->", gotA);
    assert(gotA !== null, "get(A) returned a memory");
    assert(gotA?.text === TEXT_A, "get(A).text is exactly the text we stored");
    assert(gotA?.metadata?.topic === "language", "get(A).metadata.topic === 'language'");

    // 4. search returns them ranked by relevance.
    log("4. search('what language?', { userId })");
    const searched = await mem.search(`What programming language does ${userId} prefer?`, {
      userId,
      topK: 10,
    });
    log("  search ->", searched.results);
    assert(searched.results.length >= 1, "search returned at least one ranked hit");
    assert(
      searched.results.some((r) => r.text === TEXT_A),
      "search results include the Move/language memory (text verified)",
    );
    assert(
      searched.results.every((r) => r.relevance >= 0 && r.relevance <= 1),
      "every search hit has a relevance in [0,1]",
    );

    // 4b. SCOPE ISOLATION — two users under the SAME explicit namespace must not
    //     leak into each other via search or getAll. (Regression guard for the
    //     cross-user leak: userId is enforced as a post-filter, not just agentId.)
    log("4b. scope isolation under a shared namespace");
    const sharedNs = `itest-shared-${Date.now().toString(36)}`;
    const userX = `${userId}-X`;
    const userY = `${userId}-Y`;
    const TEXT_X = `OneMem itest shared-ns: ${userX} keeps a private note about Walrus blobs.`;
    const TEXT_Y = `OneMem itest shared-ns: ${userY} keeps a private note about Walrus blobs.`;
    const x = await mem.add(TEXT_X, { namespace: sharedNs, userId: userX });
    const y = await mem.add(TEXT_Y, { namespace: sharedNs, userId: userY });
    log("  add X/Y ->", { x, y });

    const getAllX = await mem.getAll({ namespace: sharedNs, userId: userX });
    log("  getAll(X) ->", getAllX);
    assert(
      getAllX.length === 1 && getAllX[0]?.text === TEXT_X,
      "getAll({namespace, userId:X}) returns ONLY X's memory (Y not leaked)",
    );
    assert(
      !getAllX.some((m) => m.text === TEXT_Y),
      "getAll for X never contains Y's content",
    );

    const searchX = await mem.search(`private note about Walrus blobs`, {
      namespace: sharedNs,
      userId: userX,
      topK: 10,
    });
    log("  search(X) ->", searchX.results);
    assert(
      searchX.results.some((r) => r.text === TEXT_X),
      "search({namespace, userId:X}) returns X's memory",
    );
    assert(
      !searchX.results.some((r) => r.text === TEXT_Y),
      "search for X under the shared namespace does NOT leak Y's memory (cross-user isolation)",
    );

    // 5. delete(id) one (A).
    log("5. delete(A)");
    const deleted = await mem.delete(a.memoryId);
    log("  delete A ->", { deleted });
    assert(deleted === true, "delete(A) returned true");

    // 6. getAll / search no longer return the deleted one.
    log("6. getAll + search after delete");
    const allAfter = await mem.getAll({ userId });
    log("  getAll after ->", allAfter);
    assert(allAfter.length === 1, `getAll now returns 1 memory (got ${allAfter.length})`);
    assert(allAfter[0]?.text === TEXT_B, "the remaining memory is B (A is gone)");
    assert(await mem.get(a.memoryId) === null, "get(A) is null after delete");

    const searchAfter = await mem.search(`What programming language does ${userId} prefer?`, {
      userId,
      topK: 10,
    });
    log("  search after ->", searchAfter.results);
    assert(
      !searchAfter.results.some((r) => r.text === TEXT_A),
      "search no longer returns the deleted memory A",
    );

    log("RESULT", "ALL ASSERTIONS PASSED — real MemWal-testnet CRUD/scoping end-to-end ✓");
  } finally {
    mem.dispose();
  }
}

main().catch((err) => {
  console.error(`\nINTEGRATION TEST FAILED:\n${err instanceof Error ? err.stack : String(err)}`);
  process.exit(1);
});
