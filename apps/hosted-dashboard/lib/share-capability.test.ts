import { describe, expect, it } from "vitest";
import {
  holderSelfRevokeCommand,
  loadShareCapability,
  namespaceKindLabel,
} from "./share-capability";

const CAP_ID = `0x${"a".repeat(64)}`;
const NS_ID = `0x${"b".repeat(64)}`;
const OWNER = `0x${"c".repeat(64)}`;
const PKG = `0x${"1".repeat(64)}`;

describe("share capability loader", () => {
  it("loads capability and namespace metadata", async () => {
    const calls: unknown[] = [];
    const result = await loadShareCapability(CAP_ID, {
      network: "testnet",
      rpc: {
        async getObject(input) {
          calls.push(input);
          if (input.id === CAP_ID) {
            return {
              data: {
                type: `${PKG}::namespace::NamespaceCapability<${PKG}::namespace::ReadOnly>`,
                owner: { AddressOwner: OWNER },
                content: {
                  dataType: "moveObject",
                  fields: { namespace_id: NS_ID },
                },
              },
            };
          }
          return {
            data: {
              content: {
                dataType: "moveObject",
                fields: { owner: OWNER, name: "team-memory", kind: 2, active: true },
              },
            },
          };
        },
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.data.capability.kind).toBe("ReadOnly");
    expect(result.data.capability.namespaceId).toBe(NS_ID);
    expect(result.data.namespace).toMatchObject({
      id: NS_ID,
      owner: OWNER,
      name: "team-memory",
      kind: 2,
      active: true,
    });
    expect(result.data.suiscanCapability).toContain(CAP_ID);
    expect(calls).toEqual([
      {
        id: CAP_ID,
        options: { showType: true, showContent: true, showOwner: true },
      },
      { id: NS_ID, options: { showContent: true } },
    ]);
  });

  it("returns a public not-found result for missing capability objects", async () => {
    const result = await loadShareCapability(CAP_ID, {
      network: "testnet",
      rpc: {
        async getObject() {
          return { data: null };
        },
      },
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected not found");
    expect(result.capabilityId).toBe(CAP_ID);
    expect(result.error).toMatch(/No NamespaceCapability/);
    expect(result.suiscanCapability).toContain(CAP_ID);
  });

  it("keeps capability metadata when namespace lookup fails", async () => {
    const result = await loadShareCapability(CAP_ID, {
      network: "testnet",
      rpc: {
        async getObject(input) {
          if (input.id === CAP_ID) {
            return {
              data: {
                type: `${PKG}::namespace::NamespaceCapability<${PKG}::namespace::ReadWrite>`,
                owner: { AddressOwner: OWNER },
                content: {
                  dataType: "moveObject",
                  fields: { namespace_id: NS_ID },
                },
              },
            };
          }
          throw new Error("rpc unavailable");
        },
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.data.capability.kind).toBe("ReadWrite");
    expect(result.data.namespace).toBeNull();
    expect(result.data.namespaceError).toBe("rpc unavailable");
  });

  it("labels namespace kinds", () => {
    expect(namespaceKindLabel(0)).toBe("User");
    expect(namespaceKindLabel(4)).toBe("Shared");
    expect(namespaceKindLabel(9)).toBe("Unknown(9)");
  });

  it("generates holder self-revoke CLI commands", () => {
    expect(holderSelfRevokeCommand(CAP_ID, "ReadOnly")).toBe(`onemem namespace revoke ${CAP_ID}`);
    expect(holderSelfRevokeCommand(CAP_ID, "ReadWrite")).toBe(`onemem namespace revoke ${CAP_ID}`);
    expect(holderSelfRevokeCommand(CAP_ID, "Admin")).toBe(
      `onemem namespace revoke ${CAP_ID} --allow-admin`,
    );
  });
});
