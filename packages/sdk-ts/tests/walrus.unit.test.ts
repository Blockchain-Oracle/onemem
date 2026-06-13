// Fast, deterministic unit tests for the Walrus store — no network. They mock
// the `client.walrus` seam so the retry/backoff/error logic runs in CI (the
// live round-trip lives in the env-gated integration suite).

import { RetryableWalrusClientError } from "@mysten/walrus";
import { describe, expect, it, vi } from "vitest";

import {
  extendWithWalrus,
  isRetryableWalrusError,
  WalrusReadError,
  WalrusStore,
  WalrusWriteError,
} from "../src/walrus.js";

type WriteFn = ReturnType<typeof vi.fn>;
type ReadFn = ReturnType<typeof vi.fn>;

function makeStore(writeBlob: WriteFn, readBlob: ReadFn = vi.fn()) {
  // biome-ignore lint/suspicious/noExplicitAny: minimal mock of the walrus client seam
  const client = { walrus: { writeBlob, readBlob } } as any;
  // biome-ignore lint/suspicious/noExplicitAny: signer is unused once writeBlob is mocked
  return new WalrusStore(client, {} as any, { writeRetries: 3, retryBackoffMs: 0 });
}

describe("isRetryableWalrusError", () => {
  it("treats RetryableWalrusClientError and `fetch failed` as transient", () => {
    expect(isRetryableWalrusError(Object.create(RetryableWalrusClientError.prototype))).toBe(true);
    expect(isRetryableWalrusError(new Error("fetch failed"))).toBe(true);
  });
  it("treats other errors as terminal", () => {
    expect(isRetryableWalrusError(new Error("Insufficient balance of WAL"))).toBe(false);
    expect(isRetryableWalrusError("nope")).toBe(false);
  });
});

describe("WalrusStore.uploadBlob", () => {
  it("retries transient failures and succeeds on a later attempt", async () => {
    const writeBlob = vi
      .fn()
      .mockRejectedValueOnce(new Error("fetch failed"))
      .mockResolvedValueOnce({ blobId: "blob-xyz" });
    const store = makeStore(writeBlob);

    await expect(store.uploadBlob(new Uint8Array([1]))).resolves.toBe("blob-xyz");
    expect(writeBlob).toHaveBeenCalledTimes(2);
  });

  it("exhausts retries on persistent transient failure → WalrusWriteError(cause)", async () => {
    const cause = new Error("fetch failed");
    const writeBlob = vi.fn().mockRejectedValue(cause);
    const store = makeStore(writeBlob);

    await expect(store.uploadBlob(new Uint8Array([1]))).rejects.toMatchObject({
      name: "WalrusWriteError",
      attempts: 3,
      cause,
    });
    expect(writeBlob).toHaveBeenCalledTimes(3);
  });

  it("fails fast (no retry) on a terminal error", async () => {
    const cause = new Error("Insufficient balance of WAL");
    const writeBlob = vi.fn().mockRejectedValue(cause);
    const store = makeStore(writeBlob);

    const err = await store.uploadBlob(new Uint8Array([1])).catch((e) => e);
    expect(err).toBeInstanceOf(WalrusWriteError);
    expect(err.attempts).toBe(1);
    expect(err.cause).toBe(cause);
    expect(writeBlob).toHaveBeenCalledTimes(1);
  });
});

describe("WalrusStore.readBlob", () => {
  it("wraps read failures in WalrusReadError carrying the blob ID", async () => {
    const readBlob = vi.fn().mockRejectedValue(new Error("boom"));
    const store = makeStore(vi.fn(), readBlob);

    const err = await store.readBlob("blob-abc").catch((e) => e);
    expect(err).toBeInstanceOf(WalrusReadError);
    expect(err.blobId).toBe("blob-abc");
  });
});

describe("extendWithWalrus", () => {
  it("returns null when no relay host is known and none supplied", () => {
    // biome-ignore lint/suspicious/noExplicitAny: base is never touched on the null path
    expect(extendWithWalrus({} as any, "devnet")).toBeNull();
  });
  it("extends the client when a host is supplied", () => {
    const $extend = vi.fn().mockReturnValue({ extended: true });
    // biome-ignore lint/suspicious/noExplicitAny: minimal base client stub
    const base = { $extend } as any;
    const result = extendWithWalrus(base, "devnet", { uploadRelayHost: "https://relay.example" });
    expect(result).toEqual({ extended: true });
    expect($extend).toHaveBeenCalledOnce();
  });
});
