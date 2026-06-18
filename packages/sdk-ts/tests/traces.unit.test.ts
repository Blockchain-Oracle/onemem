// Fast unit tests for trace payload resolution — no network. Exercises the
// private resolvePayload() (the content→Walrus upload + hash-derivation +
// optional Seal-encrypt logic) through a minimal mocked client.

import { Transaction } from "@mysten/sui/transactions";
import { sha256 } from "@noble/hashes/sha2.js";
import { describe, expect, it, vi } from "vitest";

import { CallStatus, SessionStatus } from "../src/index.js";
import { TracePayloadError, TracesAPI } from "../src/traces.js";

const IDS = {
  session: "0x0000000000000000000000000000000000000000000000000000000000000001",
  namespace: "0x0000000000000000000000000000000000000000000000000000000000000002",
  cap: "0x0000000000000000000000000000000000000000000000000000000000000003",
  call: "0x0000000000000000000000000000000000000000000000000000000000000004",
} as const;

function tracesWith(
  uploadBlob: ReturnType<typeof vi.fn>,
  encrypt: ReturnType<typeof vi.fn> = vi.fn(),
) {
  const fakeClient = {
    addresses: { packageId: "0xpkg" },
    requireWalrus: () => ({ uploadBlob }),
    requireSeal: () => ({ encrypt }),
    // biome-ignore lint/suspicious/noExplicitAny: minimal OneMem stub for resolvePayload
  } as any;
  // biome-ignore lint/suspicious/noExplicitAny: reach the private resolvePayload in tests
  return new TracesAPI(fakeClient) as any;
}

describe("TracesAPI.resolvePayload", () => {
  it("uploads raw content and derives sha256(content) as the on-chain hash", async () => {
    const uploadBlob = vi.fn().mockResolvedValue("blob-1");
    const content = new TextEncoder().encode("real tool input");
    const { blob, hash } = await tracesWith(uploadBlob).resolvePayload({ content }, undefined);
    expect(blob).toBe("blob-1");
    expect(uploadBlob).toHaveBeenCalledWith(content);
    expect(Array.from(hash)).toEqual(Array.from(sha256(content)));
  });

  it("honors an explicit hash over the derived one when both are supplied", async () => {
    const explicit = new Uint8Array([9, 9, 9]);
    const { hash } = await tracesWith(vi.fn().mockResolvedValue("b")).resolvePayload(
      { content: new Uint8Array([1]), hash: explicit },
      undefined,
    );
    expect(hash).toBe(explicit);
  });

  it("encrypts the content (ciphertext stored) but hashes the plaintext", async () => {
    const uploadBlob = vi.fn().mockResolvedValue("blob-enc");
    const ciphertext = new Uint8Array([0xde, 0xad]);
    const encrypt = vi.fn().mockResolvedValue(ciphertext);
    const content = new TextEncoder().encode("secret");
    const { blob, hash } = await tracesWith(uploadBlob, encrypt).resolvePayload(
      { content, encrypt: true },
      "0xns",
    );
    expect(blob).toBe("blob-enc");
    expect(encrypt).toHaveBeenCalledWith(content, "0xns");
    expect(uploadBlob).toHaveBeenCalledWith(ciphertext); // ciphertext on Walrus
    expect(Array.from(hash)).toEqual(Array.from(sha256(content))); // hash over plaintext
  });

  it("refuses to encrypt without a namespaceId (loud, not silent plaintext)", async () => {
    const api = tracesWith(vi.fn(), vi.fn());
    const base = { sessionId: "0xs", rwCapId: "0xc", toolName: "t", toolNamespace: "n" };
    await expect(
      api.appendCall({
        ...base,
        namespaceId: "",
        input: { content: new Uint8Array([1]), encrypt: true },
      }),
    ).rejects.toBeInstanceOf(TracePayloadError);
    await expect(
      api.closeCall({
        sessionId: "0xs",
        namespaceId: "",
        rwCapId: "0xc",
        callId: "0xcall",
        output: { content: new Uint8Array([1]), encrypt: true },
        status: CallStatus.Success,
      }),
    ).rejects.toBeInstanceOf(TracePayloadError);
  });

  it("passes through a pre-uploaded blob + hash without uploading", async () => {
    const uploadBlob = vi.fn();
    const h = new Uint8Array([1, 2, 3]);
    const { blob, hash } = await tracesWith(uploadBlob).resolvePayload(
      { walrusBlob: "walrus:pre", hash: h },
      undefined,
    );
    expect(blob).toBe("walrus:pre");
    expect(hash).toBe(h);
    expect(uploadBlob).not.toHaveBeenCalled();
  });
});

describe("TracesAPI trace close targets", () => {
  it("targets the namespace-aware Move function for closeCall", async () => {
    const moveCall = vi.spyOn(Transaction.prototype, "moveCall");
    const uploadBlob = vi.fn().mockResolvedValue("walrus:out");
    const execute = vi.fn().mockResolvedValue({ digest: "0xtx" });
    const api = new TracesAPI({
      addresses: { packageId: "0xpkg" },
      requireWalrus: () => ({ uploadBlob }),
      execute,
      // biome-ignore lint/suspicious/noExplicitAny: minimal OneMem stub for PTB target assertion
    } as any);

    await api.closeCall({
      sessionId: IDS.session,
      namespaceId: IDS.namespace,
      rwCapId: IDS.cap,
      callId: IDS.call,
      output: { content: new Uint8Array([1]) },
      status: CallStatus.Success,
    });

    expect(moveCall).toHaveBeenCalledWith(
      expect.objectContaining({ target: "0xpkg::trace::close_call_with_namespace" }),
    );
    expect(execute).toHaveBeenCalledTimes(1);
    moveCall.mockRestore();
  });

  it("targets the namespace-aware Move function for endSession", async () => {
    const moveCall = vi.spyOn(Transaction.prototype, "moveCall");
    const execute = vi.fn().mockResolvedValue({ digest: "0xtx" });
    const api = new TracesAPI({
      addresses: { packageId: "0xpkg" },
      execute,
      // biome-ignore lint/suspicious/noExplicitAny: minimal OneMem stub for PTB target assertion
    } as any);

    await api.endSession({
      sessionId: IDS.session,
      namespaceId: IDS.namespace,
      rwCapId: IDS.cap,
      status: SessionStatus.Completed,
    });

    expect(moveCall).toHaveBeenCalledWith(
      expect.objectContaining({ target: "0xpkg::trace::close_session_with_namespace" }),
    );
    expect(execute).toHaveBeenCalledTimes(1);
    moveCall.mockRestore();
  });
});
