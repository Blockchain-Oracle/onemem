import { Transaction } from "@mysten/sui/transactions";
import { describe, expect, it, vi } from "vitest";

import { NamespacesAPI } from "../src/namespaces";

const CAP_ID = `0x${"c".repeat(64)}`;

describe("NamespacesAPI upgraded package type IDs", () => {
  it("uses the current package for the revoke function and original package for the capability type", async () => {
    const moveCall = vi.spyOn(Transaction.prototype, "moveCall");
    const execute = vi.fn(async () => ({ digest: "digest-self-revoke" }));
    const api = new NamespacesAPI({
      addresses: { packageId: "0xcurrent", originalPackageId: "0xoriginal" },
      execute,
      // biome-ignore lint/suspicious/noExplicitAny: minimal OneMem stub for PTB target assertion
    } as any);

    await expect(api.revokeCapability({ capId: CAP_ID, kind: "ReadWrite" })).resolves.toEqual({
      txDigest: "digest-self-revoke",
      kind: "ReadWrite",
    });

    expect(moveCall).toHaveBeenCalledWith(
      expect.objectContaining({
        target: "0xcurrent::namespace::revoke_capability",
        typeArguments: ["0xoriginal::namespace::ReadWrite"],
      }),
    );
    moveCall.mockRestore();
  });
});
