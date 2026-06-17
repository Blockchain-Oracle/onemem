import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadHostedProvisioningState, saveHostedProvisioningState } from "./hosted-state";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  clear(): void {
    this.values.clear();
  }
}

const storage = new MemoryStorage();

beforeEach(() => {
  storage.clear();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: storage },
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

describe("hosted provisioning state", () => {
  it("loads only wallet and network scoped provisioning state", () => {
    saveHostedProvisioningState({
      suiAddress: `0x${"a".repeat(64)}`,
      network: "testnet",
      namespaceId: `0x${"1".repeat(64)}`,
      adminCapId: `0x${"2".repeat(64)}`,
      rwCapId: `0x${"3".repeat(64)}`,
      namespaceDigest: "namespace-digest",
      rwCapDigest: "rw-digest",
    });

    const loaded = loadHostedProvisioningState(`0x${"A".repeat(64)}`, "testnet");
    expect(loaded?.namespaceId).toBe(`0x${"1".repeat(64)}`);
    expect(loaded?.updatedAt).toEqual(expect.any(String));
    expect(loadHostedProvisioningState(`0x${"b".repeat(64)}`, "testnet")).toBeNull();
    expect(loadHostedProvisioningState(`0x${"a".repeat(64)}`, "mainnet")).toBeNull();
  });

  it("ignores malformed browser storage", () => {
    storage.setItem("onemem.hosted.provisioning.v1", JSON.stringify({ namespaceId: "0x1" }));
    expect(loadHostedProvisioningState()).toBeNull();

    storage.setItem("onemem.hosted.provisioning.v1", "{not-json");
    expect(loadHostedProvisioningState()).toBeNull();
  });
});
