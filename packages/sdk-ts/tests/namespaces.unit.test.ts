import { describe, expect, it } from "vitest";
import {
  capabilityKindFromObjectType,
  fetchNamespaceCapabilityHistory,
  NamespacesAPI,
  namespaceCapabilityFromSuiObject,
  suiOwnerSummary,
} from "../src/namespaces";

const PKG = "0x123";
const CAP_ID = `0x${"c".repeat(64)}`;
const CAP_ID_2 = `0x${"f".repeat(64)}`;
const NS_ID = `0x${"d".repeat(64)}`;
const OWNER = `0x${"e".repeat(64)}`;

describe("capabilityKindFromObjectType", () => {
  it("parses ReadOnly capability object types", () => {
    expect(
      capabilityKindFromObjectType(
        `${PKG}::namespace::NamespaceCapability<${PKG}::namespace::ReadOnly>`,
      ),
    ).toBe("ReadOnly");
  });

  it("parses ReadWrite capability object types", () => {
    expect(
      capabilityKindFromObjectType(
        `${PKG}::namespace::NamespaceCapability<${PKG}::namespace::ReadWrite>`,
      ),
    ).toBe("ReadWrite");
  });

  it("parses Admin capability object types", () => {
    expect(
      capabilityKindFromObjectType(
        `${PKG}::namespace::NamespaceCapability<${PKG}::namespace::Admin>`,
      ),
    ).toBe("Admin");
  });

  it("rejects unrelated object types", () => {
    expect(() => capabilityKindFromObjectType(`${PKG}::namespace::MemoryNamespace`)).toThrow(
      /NamespaceCapability/,
    );
  });
});

describe("namespaceCapabilityFromSuiObject", () => {
  it("parses capability details from a Sui object response", () => {
    expect(
      namespaceCapabilityFromSuiObject(CAP_ID, {
        type: `${PKG}::namespace::NamespaceCapability<${PKG}::namespace::ReadOnly>`,
        owner: { AddressOwner: OWNER },
        content: {
          dataType: "moveObject",
          fields: {
            id: { id: CAP_ID },
            namespace_id: NS_ID,
          },
        },
      }),
    ).toEqual({
      id: CAP_ID,
      namespaceId: NS_ID,
      kind: "ReadOnly",
      objectType: `${PKG}::namespace::NamespaceCapability<${PKG}::namespace::ReadOnly>`,
      ownerKind: "address",
      ownerAddress: OWNER,
      ownerDisplay: OWNER,
    });
  });

  it("accepts nested ID field shapes for namespace_id", () => {
    const capability = namespaceCapabilityFromSuiObject(CAP_ID, {
      type: `${PKG}::namespace::NamespaceCapability<${PKG}::namespace::ReadWrite>`,
      owner: { ObjectOwner: OWNER },
      content: {
        dataType: "moveObject",
        fields: { namespace_id: { id: NS_ID } },
      },
    });

    expect(capability.namespaceId).toBe(NS_ID);
    expect(capability.kind).toBe("ReadWrite");
    expect(capability.ownerKind).toBe("object");
    expect(capability.ownerAddress).toBe(OWNER);
  });

  it("rejects missing capability fields", () => {
    expect(() =>
      namespaceCapabilityFromSuiObject(CAP_ID, {
        type: `${PKG}::namespace::NamespaceCapability<${PKG}::namespace::Admin>`,
        content: { dataType: "moveObject", fields: {} },
      }),
    ).toThrow(/namespace_id/);
  });
});

describe("suiOwnerSummary", () => {
  it("formats common Sui owner variants", () => {
    expect(suiOwnerSummary({ AddressOwner: OWNER })).toEqual({
      kind: "address",
      address: OWNER,
      display: OWNER,
    });
    expect(suiOwnerSummary({ Shared: { initial_shared_version: "1" } }).kind).toBe("shared");
    expect(suiOwnerSummary("Immutable").kind).toBe("immutable");
  });
});

describe("NamespacesAPI.getCapability", () => {
  it("loads capability details from the configured Sui client", async () => {
    const api = new NamespacesAPI({
      client: {
        async getObject(input: unknown) {
          expect(input).toEqual({
            id: CAP_ID,
            options: { showType: true, showContent: true, showOwner: true },
          });
          return {
            data: {
              type: `${PKG}::namespace::NamespaceCapability<${PKG}::namespace::Admin>`,
              owner: { AddressOwner: OWNER },
              content: {
                dataType: "moveObject",
                fields: { namespace_id: NS_ID },
              },
            },
          };
        },
      },
    } as never);

    await expect(api.getCapability(CAP_ID)).resolves.toMatchObject({
      id: CAP_ID,
      namespaceId: NS_ID,
      kind: "Admin",
      ownerAddress: OWNER,
    });
  });
});

describe("fetchNamespaceCapabilityHistory", () => {
  it("joins minted and revoked events into sorted history rows", async () => {
    const calls: unknown[] = [];
    let mintedPage = 0;
    const history = await fetchNamespaceCapabilityHistory(
      {
        async queryEvents(input) {
          calls.push(input);
          const type = input.query.MoveEventType;
          if (type.endsWith("NamespaceCapabilityMintedEvent")) {
            mintedPage += 1;
            if (mintedPage === 1) {
              return {
                data: [
                  {
                    id: { txDigest: "mint-old", eventSeq: "0" },
                    timestampMs: "10",
                    parsedJson: {
                      namespace_id: NS_ID,
                      cap_id: CAP_ID,
                      kind_tag: 0,
                      recipient: OWNER,
                    },
                  },
                ],
                hasNextPage: true,
                nextCursor: { txDigest: "mint-old", eventSeq: "0" },
              };
            }
            return {
              data: [
                {
                  id: { txDigest: "mint-new", eventSeq: "1" },
                  timestampMs: "20",
                  parsedJson: {
                    namespace_id: NS_ID,
                    cap_id: CAP_ID_2,
                    kind_tag: 1,
                    recipient: OWNER,
                  },
                },
                {
                  parsedJson: {
                    namespace_id: `0x${"9".repeat(64)}`,
                    cap_id: `0x${"8".repeat(64)}`,
                    kind_tag: 1,
                    recipient: OWNER,
                  },
                },
              ],
              hasNextPage: false,
            };
          }
          return {
            data: [
              {
                id: { txDigest: "revoke-old", eventSeq: "2" },
                timestampMs: "30",
                parsedJson: {
                  namespace_id: NS_ID,
                  cap_id: CAP_ID,
                },
              },
            ],
            hasNextPage: false,
          };
        },
      },
      PKG,
      NS_ID,
    );

    expect(calls).toEqual(
      expect.arrayContaining([
        {
          query: { MoveEventType: `${PKG}::namespace::NamespaceCapabilityMintedEvent` },
          cursor: null,
          order: "ascending",
          limit: 50,
        },
        {
          query: { MoveEventType: `${PKG}::namespace::NamespaceCapabilityMintedEvent` },
          cursor: { txDigest: "mint-old", eventSeq: "0" },
          order: "ascending",
          limit: 50,
        },
        {
          query: { MoveEventType: `${PKG}::namespace::NamespaceCapabilityRevokedEvent` },
          cursor: null,
          order: "ascending",
          limit: 50,
        },
      ]),
    );
    expect(calls).toHaveLength(3);
    expect(history).toEqual([
      {
        capId: CAP_ID_2,
        kind: 1,
        recipient: OWNER,
        active: true,
        status: "active",
        mintedTxDigest: "mint-new",
        mintedEventSeq: "1",
        mintedAtMs: 20,
        revokedTxDigest: null,
        revokedEventSeq: null,
        revokedAtMs: null,
      },
      {
        capId: CAP_ID,
        kind: 0,
        recipient: OWNER,
        active: false,
        status: "revoked",
        mintedTxDigest: "mint-old",
        mintedEventSeq: "0",
        mintedAtMs: 10,
        revokedTxDigest: "revoke-old",
        revokedEventSeq: "2",
        revokedAtMs: 30,
      },
    ]);
  });
});

describe("NamespacesAPI capability history", () => {
  it("returns active rows from the shared history reader", async () => {
    const api = new NamespacesAPI({
      addresses: { packageId: PKG },
      client: {
        async queryEvents(input: { query: { MoveEventType: string } }) {
          if (input.query.MoveEventType.endsWith("NamespaceCapabilityMintedEvent")) {
            return {
              data: [
                {
                  parsedJson: {
                    namespace_id: NS_ID,
                    cap_id: CAP_ID,
                    kind_tag: 0,
                    recipient: OWNER,
                  },
                },
                {
                  parsedJson: {
                    namespace_id: NS_ID,
                    cap_id: CAP_ID_2,
                    kind_tag: 1,
                    recipient: OWNER,
                  },
                },
              ],
              hasNextPage: false,
            };
          }
          return {
            data: [{ parsedJson: { namespace_id: NS_ID, cap_id: CAP_ID } }],
            hasNextPage: false,
          };
        },
      },
    } as never);

    await expect(api.getCapabilities(NS_ID)).resolves.toEqual([
      { capId: CAP_ID_2, kind: 1, recipient: OWNER },
    ]);
  });

  it("exposes full capability history rows", async () => {
    const api = new NamespacesAPI({
      addresses: { packageId: PKG },
      client: {
        async queryEvents(input: { query: { MoveEventType: string } }) {
          if (input.query.MoveEventType.endsWith("NamespaceCapabilityMintedEvent")) {
            return {
              data: [
                {
                  id: { txDigest: "mint", eventSeq: "0" },
                  timestampMs: "40",
                  parsedJson: {
                    namespace_id: NS_ID,
                    cap_id: CAP_ID,
                    kind_tag: 2,
                    recipient: OWNER,
                  },
                },
              ],
              hasNextPage: false,
            };
          }
          return { data: [], hasNextPage: false };
        },
      },
    } as never);

    await expect(api.getCapabilityHistory(NS_ID)).resolves.toEqual([
      {
        capId: CAP_ID,
        kind: 2,
        recipient: OWNER,
        active: true,
        status: "active",
        mintedTxDigest: "mint",
        mintedEventSeq: "0",
        mintedAtMs: 40,
        revokedTxDigest: null,
        revokedEventSeq: null,
        revokedAtMs: null,
      },
    ]);
  });
});
