// Fast, deterministic unit tests for the Seal store — no network. They mock the
// `@mysten/seal` SessionKey + the Transaction builder so the SessionKey caching
// and the configurable verifyKeyServers logic run in CI (the live round-trip
// lives in the env-gated integration suite).

import { beforeEach, describe, expect, it, vi } from "vitest";

const sessionKeyCreate = vi.fn();

vi.mock("@mysten/seal", () => ({
  SealClient: class {},
  SessionKey: { create: (...args: unknown[]) => sessionKeyCreate(...args) },
}));

vi.mock("@mysten/sui/transactions", () => ({
  Transaction: class {
    pure = { vector: () => ({}) };
    object() {
      return {};
    }
    moveCall() {}
    async build() {
      return new Uint8Array([1, 2, 3]);
    }
  },
}));

vi.mock("@mysten/sui/utils", () => ({ fromHex: () => new Uint8Array([0]) }));

import { SealStore } from "../src/seal.js";

function makeSessionKey(expired = false) {
  return {
    getPersonalMessage: () => new Uint8Array([9]),
    setPersonalMessageSignature: vi.fn(),
    isExpired: vi.fn(() => expired),
  };
}

function makeStore(
  decrypt = vi.fn(async () => new Uint8Array([42])),
  config: { threshold?: number } = {},
  encrypt = vi.fn(async () => ({ encryptedObject: new Uint8Array([7, 8, 9]) })),
) {
  const seal = { decrypt, encrypt };
  const signer = {
    toSuiAddress: () => "0xsigner",
    signPersonalMessage: vi.fn(async () => ({ signature: "sig" })),
  };
  // biome-ignore lint/suspicious/noExplicitAny: minimal mocks of the Seal/Sui seams
  const store = new SealStore(seal as any, {} as any, signer as any, "0xpkg", config);
  return { store, seal, signer };
}

const ARGS = { namespaceId: "0xns", capId: "0xcap", capKind: "ReadWrite" as const };

describe("SealStore SessionKey caching", () => {
  beforeEach(() => {
    sessionKeyCreate.mockReset();
  });

  it("reuses the signed SessionKey across decrypts within its TTL", async () => {
    sessionKeyCreate.mockResolvedValue(makeSessionKey(false));
    const { store, signer } = makeStore();

    await store.decrypt(new Uint8Array([0]), ARGS);
    await store.decrypt(new Uint8Array([0]), ARGS);

    expect(sessionKeyCreate).toHaveBeenCalledTimes(1);
    expect(signer.signPersonalMessage).toHaveBeenCalledTimes(1);
  });

  it("re-mints and re-signs once the cached SessionKey has expired", async () => {
    sessionKeyCreate
      .mockResolvedValueOnce(makeSessionKey(true)) // first key reports expired on next use
      .mockResolvedValueOnce(makeSessionKey(false));
    const { store, signer } = makeStore();

    await store.decrypt(new Uint8Array([0]), ARGS);
    await store.decrypt(new Uint8Array([0]), ARGS);

    expect(sessionKeyCreate).toHaveBeenCalledTimes(2);
    expect(signer.signPersonalMessage).toHaveBeenCalledTimes(2);
  });

  it("wraps decrypt failures in SealDecryptError carrying the cap context", async () => {
    sessionKeyCreate.mockResolvedValue(makeSessionKey(false));
    const { store } = makeStore(
      vi.fn(async () => {
        throw new Error("key-server denied");
      }),
    );

    await expect(store.decrypt(new Uint8Array([0]), ARGS)).rejects.toMatchObject({
      name: "SealDecryptError",
      namespaceId: "0xns",
      capId: "0xcap",
    });
  });

  it("drops the cached key on failure so the next decrypt re-mints", async () => {
    sessionKeyCreate.mockResolvedValue(makeSessionKey(false));
    let calls = 0;
    const decrypt = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new Error("transient key-server error");
      return new Uint8Array([1]);
    });
    const { store, signer } = makeStore(decrypt);

    await expect(store.decrypt(new Uint8Array([0]), ARGS)).rejects.toThrow();
    await store.decrypt(new Uint8Array([0]), ARGS); // recovers

    // First mint poisoned → cleared; second decrypt re-mints (2 signs total).
    expect(signer.signPersonalMessage).toHaveBeenCalledTimes(2);
  });
});

describe("SealStore.encrypt", () => {
  beforeEach(() => sessionKeyCreate.mockReset());

  it("propagates the configured threshold + identity into seal.encrypt", async () => {
    const { store, seal } = makeStore(undefined, { threshold: 3 });
    await store.encrypt(new Uint8Array([1, 2]), "0xabc");

    expect(seal.encrypt).toHaveBeenCalledWith(
      expect.objectContaining({ threshold: 3, packageId: "0xpkg", id: "abc" }),
    );
  });

  it("wraps encrypt failures in SealEncryptError carrying the namespace", async () => {
    const encrypt = vi.fn(async () => {
      throw new Error("key-server unreachable");
    });
    const { store } = makeStore(undefined, {}, encrypt);

    await expect(store.encrypt(new Uint8Array([1]), "0xns")).rejects.toMatchObject({
      name: "SealEncryptError",
      namespaceId: "0xns",
    });
  });

  it("rejects an empty ciphertext rather than storing it", async () => {
    const encrypt = vi.fn(async () => ({ encryptedObject: new Uint8Array([]) }));
    const { store } = makeStore(undefined, {}, encrypt);

    await expect(store.encrypt(new Uint8Array([1]), "0xns")).rejects.toMatchObject({
      name: "SealEncryptError",
    });
  });
});

describe("createSealClient verifyKeyServers", () => {
  it("defaults verifyKeyServers to false and honours an explicit override", async () => {
    const ctorArgs: Array<Record<string, unknown>> = [];
    vi.resetModules();
    vi.doMock("@mysten/seal", () => ({
      SealClient: class {
        constructor(cfg: Record<string, unknown>) {
          ctorArgs.push(cfg);
        }
      },
      SessionKey: { create: sessionKeyCreate },
    }));
    const { createSealClient } = await import("../src/seal.js");
    const servers = [{ objectId: "0xks" }];

    // biome-ignore lint/suspicious/noExplicitAny: client unused by ctor
    createSealClient({} as any, "testnet", { keyServers: servers });
    // biome-ignore lint/suspicious/noExplicitAny: client unused by ctor
    createSealClient({} as any, "testnet", { keyServers: servers, verifyKeyServers: true });

    expect(ctorArgs[0]?.verifyKeyServers).toBe(false);
    expect(ctorArgs[1]?.verifyKeyServers).toBe(true);
    vi.doUnmock("@mysten/seal");
  });
});
