import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildDay1Calls,
  buildDay2Calls,
  buildDay3Calls,
  hashPayload,
  hex,
  SOURCE_DIGEST_MEMORY_BLOB_ID,
  SYNTHESIS_MEMORY_BLOB_ID,
  sourceDigestHash,
  stableJson,
  synthesisHash,
} from "./trace-model.js";

describe("verifiable research agent trace model", () => {
  test("models multi-day memory accumulation and recall", () => {
    const day1 = buildDay1Calls("run-1");
    const sourceMemory = {
      kind: "source-digest" as const,
      blobId: SOURCE_DIGEST_MEMORY_BLOB_ID,
      contentHash: sourceDigestHash(),
      sourceSessionId: "0xday1",
      sourceRuntime: "hermes-research-agent",
    };
    const day2 = buildDay2Calls("run-1", sourceMemory);
    const synthesisMemory = {
      kind: "research-synthesis" as const,
      blobId: SYNTHESIS_MEMORY_BLOB_ID,
      contentHash: synthesisHash(),
      sourceSessionId: "0xday2",
      sourceRuntime: "hermes-research-agent",
    };
    const day3 = buildDay3Calls("run-1", [sourceMemory, synthesisMemory]);

    assert.deepEqual(
      day1.map((call) => call.toolName),
      ["search_prediction_market_sources", "write_source_digest_memory"],
    );
    assert.equal(day1[1]?.output.memoryBlobId, SOURCE_DIGEST_MEMORY_BLOB_ID);
    assert.deepEqual(
      day2.map((call) => call.toolName),
      [
        "extract_market_microstructure_summary",
        "extract_volatility_surface_summary",
        "write_research_synthesis_memory",
      ],
    );
    assert.equal(day2[2]?.output.memoryBlobId, SYNTHESIS_MEMORY_BLOB_ID);
    assert.deepEqual(
      day3.map((call) => call.toolName),
      ["recall_research_memory", "answer_research_question"],
    );
    assert.deepEqual(day3[0]?.input.memoryBlobIds, [
      SOURCE_DIGEST_MEMORY_BLOB_ID,
      SYNTHESIS_MEMORY_BLOB_ID,
    ]);
    assert.match(String(day3[1]?.output.answer), /Volatility-surface/);
  });

  test("hashing is stable across object key order", () => {
    const left = { topic: "markets", facts: { b: 2, a: 1 } };
    const right = { facts: { a: 1, b: 2 }, topic: "markets" };

    assert.equal(stableJson(left), stableJson(right));
    assert.equal(hex(hashPayload(left)), hex(hashPayload(right)));
    assert.match(hex(hashPayload(left)), /^0x[0-9a-f]{64}$/);
  });
});
