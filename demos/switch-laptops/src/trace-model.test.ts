import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildLaptopACalls,
  buildLaptopBCalls,
  hashPayload,
  hex,
  MEMORY_BLOB_ID,
  SHARED_CONTEXT,
  stableJson,
} from "./trace-model.js";

describe("switch-laptops trace model", () => {
  test("models Laptop A write then Laptop B recall", () => {
    const laptopA = buildLaptopACalls("run-1");
    const memory = {
      blobId: MEMORY_BLOB_ID,
      contentHash: hex(hashPayload(SHARED_CONTEXT)),
      sourceSessionId: "0xsource",
      sourceRuntime: "claude-code",
    };
    const laptopB = buildLaptopBCalls("run-1", memory);

    assert.deepEqual(
      laptopA.map((call) => call.toolName),
      ["inspect_project_context", "write_project_memory", "prepare_runtime_handoff"],
    );
    assert.deepEqual(
      laptopB.map((call) => call.toolName),
      ["recall_project_memory", "answer_from_memory"],
    );
    assert.deepEqual(laptopA[1]?.output.memoryBlobId, MEMORY_BLOB_ID);
    assert.deepEqual(laptopB[0]?.input, {
      query: "What database does the Next.js project use?",
      memoryBlobId: MEMORY_BLOB_ID,
      sourceSessionId: "0xsource",
      runId: "run-1",
    });
    assert.match(String(laptopB[1]?.output.answer), /Postgres on Supabase/);
  });

  test("hashing is stable across object key order", () => {
    const left = { database: "Postgres", auth: "Clerk" };
    const right = { auth: "Clerk", database: "Postgres" };

    assert.equal(stableJson(left), stableJson(right));
    assert.equal(hex(hashPayload(left)), hex(hashPayload(right)));
  });
});
