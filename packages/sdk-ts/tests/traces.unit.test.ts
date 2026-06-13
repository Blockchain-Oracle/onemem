// Fast unit tests for trace payload resolution — no network. Exercises the
// private resolveBlob() (the content→Walrus upload + hash-derivation logic)
// through a minimal mocked client.

import { sha256 } from "@noble/hashes/sha2.js";
import { describe, expect, it, vi } from "vitest";

import { TracePayloadError, TracesAPI } from "../src/traces.js";

function tracesWith(uploadBlob: ReturnType<typeof vi.fn>) {
  // biome-ignore lint/suspicious/noExplicitAny: minimal OneMem stub — resolveBlob only needs requireWalrus()
  const fakeClient = { requireWalrus: () => ({ uploadBlob }) } as any;
  // biome-ignore lint/suspicious/noExplicitAny: reach the private resolveBlob in tests
  return new TracesAPI(fakeClient) as any;
}

describe("TracesAPI.resolveBlob", () => {
  it("uploads raw content and derives sha256(content) as the on-chain hash", async () => {
    const uploadBlob = vi.fn().mockResolvedValue("blob-1");
    const content = new TextEncoder().encode("real tool input");
    const { blob, hash } = await tracesWith(uploadBlob).resolveBlob(
      content,
      undefined,
      undefined,
      "input",
    );
    expect(blob).toBe("blob-1");
    expect(uploadBlob).toHaveBeenCalledWith(content);
    expect(Array.from(hash)).toEqual(Array.from(sha256(content)));
  });

  it("honors an explicit hash over the derived one when both are supplied", async () => {
    const explicit = new Uint8Array([9, 9, 9]);
    const { hash } = await tracesWith(vi.fn().mockResolvedValue("b")).resolveBlob(
      new Uint8Array([1]),
      undefined,
      explicit,
      "input",
    );
    expect(hash).toBe(explicit);
  });

  it("passes through a pre-uploaded blob + hash without uploading", async () => {
    const uploadBlob = vi.fn();
    const h = new Uint8Array([1, 2, 3]);
    const { blob, hash } = await tracesWith(uploadBlob).resolveBlob(
      undefined,
      "walrus:pre",
      h,
      "output",
    );
    expect(blob).toBe("walrus:pre");
    expect(hash).toBe(h);
    expect(uploadBlob).not.toHaveBeenCalled();
  });

  it("throws TracePayloadError naming the field when neither input is given", async () => {
    await expect(
      tracesWith(vi.fn()).resolveBlob(undefined, undefined, undefined, "output"),
    ).rejects.toBeInstanceOf(TracePayloadError);
  });
});
