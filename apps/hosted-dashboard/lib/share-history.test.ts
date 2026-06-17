import { describe, expect, it } from "vitest";
import {
  isSuiObjectId,
  loadShareHistory,
  resolveShareHistoryNetwork,
  ShareHistoryValidationError,
} from "./share-history";

const NS_ID = `0x${"a".repeat(64)}`;
const CAP_ID = `0x${"b".repeat(64)}`;
const RECIPIENT = `0x${"c".repeat(64)}`;

describe("share history helper", () => {
  it("loads event-backed rows through an injected reader", async () => {
    const result = await loadShareHistory(
      { namespaceId: ` ${NS_ID} `, network: "testnet" },
      {
        reader: {
          async getCapabilityHistory(namespaceId) {
            expect(namespaceId).toBe(NS_ID);
            return [
              {
                capId: CAP_ID,
                kind: 0,
                recipient: RECIPIENT,
                active: true,
                status: "active",
                mintedTxDigest: "mint",
                mintedEventSeq: "1",
                mintedAtMs: 100,
                revokedTxDigest: null,
                revokedEventSeq: null,
                revokedAtMs: null,
              },
            ];
          },
        },
      },
    );

    expect(result).toEqual({
      ok: true,
      namespaceId: NS_ID,
      network: "testnet",
      rows: [
        {
          capId: CAP_ID,
          kind: 0,
          recipient: RECIPIENT,
          active: true,
          status: "active",
          mintedTxDigest: "mint",
          mintedEventSeq: "1",
          mintedAtMs: 100,
          revokedTxDigest: null,
          revokedEventSeq: null,
          revokedAtMs: null,
        },
      ],
    });
  });

  it("validates namespace IDs", async () => {
    await expect(loadShareHistory({ namespaceId: "0x123", network: "testnet" })).rejects.toThrow(
      ShareHistoryValidationError,
    );
  });

  it("returns an empty row set when Sui has no share events", async () => {
    const result = await loadShareHistory(
      { namespaceId: NS_ID, network: "testnet" },
      {
        reader: {
          async getCapabilityHistory() {
            return [];
          },
        },
      },
    );

    expect(result.rows).toEqual([]);
  });

  it("lets RPC failures bubble for API-level 502 mapping", async () => {
    await expect(
      loadShareHistory(
        { namespaceId: NS_ID, network: "testnet" },
        {
          reader: {
            async getCapabilityHistory() {
              throw new Error("rpc unavailable");
            },
          },
        },
      ),
    ).rejects.toThrow(/rpc unavailable/);
  });

  it("validates networks", () => {
    expect(resolveShareHistoryNetwork("testnet")).toBe("testnet");
    expect(() => resolveShareHistoryNetwork("badnet")).toThrow(/network/);
  });

  it("recognizes Sui object IDs", () => {
    expect(isSuiObjectId(NS_ID)).toBe(true);
    expect(isSuiObjectId("0x123")).toBe(false);
  });
});
