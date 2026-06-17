import type { SuiTransactionBlockResponse } from "@mysten/sui/jsonRpc";
import { describe, expect, it } from "vitest";
import {
  bytesToHex,
  digestFromExecuteResult,
  findCreatedObject,
  hexToBytes,
  shortId,
} from "./cli-login-client";

describe("cli login browser helpers", () => {
  it("converts hex and bytes without accepting malformed key material", () => {
    expect(bytesToHex(Uint8Array.from([0, 15, 255]))).toBe("000fff");
    expect([...hexToBytes("0x000fff")]).toEqual([0, 15, 255]);
    expect(() => hexToBytes("abc")).toThrow(/invalid hex/);
    expect(() => hexToBytes("zz")).toThrow(/invalid hex/);
  });

  it("requires wallet execution results to include a digest", () => {
    expect(digestFromExecuteResult({ digest: "abc" })).toBe("abc");
    expect(() => digestFromExecuteResult({})).toThrow(/transaction digest/);
  });

  it("finds created objects by Move object type suffix", () => {
    const tx = {
      objectChanges: [
        {
          type: "created",
          objectType: "0x2::account::Other",
          objectId: `0x${"1".repeat(64)}`,
        },
        {
          type: "created",
          objectType: "0x2::account::MemWalAccount",
          objectId: `0x${"2".repeat(64)}`,
        },
      ],
    } as SuiTransactionBlockResponse;

    expect(findCreatedObject(tx, "::account::MemWalAccount")).toBe(`0x${"2".repeat(64)}`);
    expect(() => findCreatedObject(tx, "::namespace::MemoryNamespace")).toThrow(/did not create/);
  });

  it("shortens long ids while preserving empty-state copy", () => {
    expect(shortId(null)).toBe("none");
    expect(shortId("short")).toBe("short");
    expect(shortId(`0x${"a".repeat(64)}`)).toBe("0xaaaaaaaaaa...aaaaaaaa");
  });
});
