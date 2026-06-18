import type { VerifyResult } from "@onemem/sdk-ts";
import { describe, expect, it } from "vitest";
import {
  fetchPublicVerifyCalls,
  hexOf,
  loadPublicVerifySession,
  rootPreview,
  shortId,
} from "./public-verify";

const SESSION_ID = `0x${"a".repeat(64)}`;
const PACKAGE_ID = `0x${"1".repeat(64)}`;

function verifyResult(callCount: number): VerifyResult {
  return {
    ok: true,
    brokenAt: null,
    expectedMerkleRoot: Uint8Array.from([1, 2, 3]),
    computedMerkleRoot: Uint8Array.from([1, 2, 3]),
    callCount,
    sessionCallCount: callCount,
    rootMatches: true,
    countMatches: true,
    sessionStatus: 1 as VerifyResult["sessionStatus"],
  };
}

describe("public verifier helpers", () => {
  it("formats roots and identifiers for public display", () => {
    expect(hexOf(Uint8Array.from([0, 15, 255]))).toBe("0x000fff");
    expect(shortId(`0x${"b".repeat(64)}`)).toBe("0xbbbbbbbbbb...bbbbbbbb");
    expect(rootPreview(`0x${"c".repeat(64)}`)).toBe("0xcccccccccccccccccccccccc...cccccccc");
  });

  it("paginates emitted events and filters by session", async () => {
    const calls = await fetchPublicVerifyCalls(
      {
        async getObject() {
          throw new Error("not used");
        },
        async queryEvents(input) {
          if (!input.cursor) {
            return {
              data: [
                {
                  id: { txDigest: "tx-1" },
                  timestampMs: "10",
                  parsedJson: {
                    session_id: SESSION_ID,
                    call_id: "call-1",
                    tool_namespace: "wallet",
                    tool_name: "balance",
                  },
                },
                {
                  parsedJson: {
                    session_id: `0x${"b".repeat(64)}`,
                    call_id: "other",
                  },
                },
              ],
              hasNextPage: true,
              nextCursor: { txDigest: "page-2", eventSeq: "0" },
            };
          }
          return {
            data: [
              {
                id: { txDigest: "tx-2" },
                timestampMs: "20",
                parsedJson: {
                  session_id: SESSION_ID,
                  call_id: "call-2",
                  tool_namespace: "sui",
                  tool_name: "confirm",
                },
              },
            ],
            hasNextPage: false,
          };
        },
      },
      PACKAGE_ID,
      SESSION_ID,
    );

    expect(calls).toEqual([
      {
        sequence: 1,
        callId: "call-1",
        toolNamespace: "wallet",
        toolName: "balance",
        label: "wallet/balance",
        txDigest: "tx-1",
        timestampMs: 10,
      },
      {
        sequence: 2,
        callId: "call-2",
        toolNamespace: "sui",
        toolName: "confirm",
        label: "sui/confirm",
        txDigest: "tx-2",
        timestampMs: 20,
      },
    ]);
  });

  it("loads session metadata, verification, and event evidence together", async () => {
    const data = await loadPublicVerifySession(SESSION_ID, {
      packageId: PACKAGE_ID,
      network: "testnet",
      verifier: async () => verifyResult(1),
      rpc: {
        async getObject() {
          return {
            data: {
              content: {
                dataType: "moveObject",
                fields: { agent_id: "agent", environment: "test", status: 1 },
              },
            },
          };
        },
        async queryEvents() {
          return {
            data: [
              {
                parsedJson: {
                  session_id: SESSION_ID,
                  call_id: "call",
                  tool_namespace: "runtime",
                  tool_name: "run",
                },
              },
            ],
            hasNextPage: false,
          };
        },
      },
    });

    expect(data.agentId).toBe("agent");
    expect(data.statusLabel).toBe("Completed");
    expect(data.callEvidenceMatchesVerifier).toBe(true);
    expect(data.calls).toHaveLength(1);
    expect(data.expectedRoot).toBe("0x010203");
  });

  it("reports when displayed event evidence is incomplete", async () => {
    const data = await loadPublicVerifySession(SESSION_ID, {
      packageId: PACKAGE_ID,
      network: "testnet",
      verifier: async () => verifyResult(2),
      rpc: {
        async getObject() {
          return {
            data: {
              content: {
                dataType: "moveObject",
                fields: { agent_id: "agent", environment: "test", status: 1 },
              },
            },
          };
        },
        async queryEvents() {
          return { data: [], hasNextPage: false };
        },
      },
    });

    expect(data.callEvidenceMatchesVerifier).toBe(false);
    expect(data.verify.callCount).toBe(2);
    expect(data.calls).toHaveLength(0);
  });
});
