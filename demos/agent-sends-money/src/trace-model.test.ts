import { describe, expect, it } from "vitest";

import {
  buildMockPaymentCalls,
  hashPayload,
  hex,
  PROOF_BOUNDARIES,
  stableJson,
} from "./trace-model.js";

describe("agent-sends-money demo trace model", () => {
  it("models the safe mocked payment call sequence", () => {
    const calls = buildMockPaymentCalls("run-1");

    expect(calls.map((call) => call.toolName)).toEqual([
      "resolve_suins",
      "fetch_pyth_oracle",
      "check_gas_estimate",
      "execute_payment",
    ]);
    expect(calls.at(-1)?.output).toMatchObject({
      mocked: true,
      txDigest: "mock:testnet:no-transfer",
    });
    expect(PROOF_BOUNDARIES.join(" ")).toContain("Does not send real money");
  });

  it("hashes semantically equivalent payloads deterministically", () => {
    const left = { b: 2, a: { d: 4, c: 3 } };
    const right = { a: { c: 3, d: 4 }, b: 2 };

    expect(stableJson(left)).toBe(stableJson(right));
    expect(hex(hashPayload(left))).toBe(hex(hashPayload(right)));
    expect(hex(hashPayload(left))).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
