// Namespace operations module. PTB builders + executors for
// `onemem::namespace` entry functions.
//
// Methods mirror the Move surface 1:1 (per docs/05-our-architecture/02-sdks/
// shared-api-surface.md):
//   create(name, kind, sealPackageId) → mints shared MemoryNamespace +
//                                       transfers Admin cap to sender
//   findByName(owner, name)           → registry.lookup() (read-only)
//   shareReadOnly(ns, recipient)      → mint RO cap for recipient
//   shareReadWrite(ns, recipient)     → mint RW cap for recipient
//   revokeCapability(cap)             → holder self-revoke; consumes cap object
//   adminRevokeCapability(ns, cap)    → admin marker revoke; cap object remains
//   deactivate(ns) / reactivate(ns)   → admin-gated soft delete

import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import type { OneMem } from "./client.js";
import {
  capabilityKindFromObjectType,
  type NamespaceCapabilityDetails,
  namespaceCapabilityFromSuiObject,
} from "./namespace-capabilities.js";
import {
  fetchNamespaceCapabilityHistory,
  type NamespaceCapabilityHistoryRow,
} from "./namespace-history.js";
import type { NamespaceKind } from "./types/move.js";

export type NamespaceCapabilityKind = "ReadOnly" | "ReadWrite" | "Admin";
export {
  capabilityKindFromObjectType,
  type NamespaceCapabilityDetails,
  type NamespaceCapabilityOwner,
  type NamespaceCapabilityOwnerKind,
  namespaceCapabilityFromSuiObject,
  suiOwnerSummary,
} from "./namespace-capabilities.js";
export {
  fetchNamespaceCapabilityHistory,
  type NamespaceCapabilityHistoryRow,
  type NamespaceCapabilityHistoryStatus,
} from "./namespace-history.js";

export interface CreateNamespaceArgs {
  readonly name: string;
  readonly kind: NamespaceKind;
  readonly sealPackageId: string;
}

export interface CreateNamespaceResult {
  readonly namespaceId: string;
  readonly adminCapId: string;
  readonly txDigest: string;
}

export class NamespacesAPI {
  constructor(private readonly client: OneMem) {}

  /**
   * Mint a new MemoryNamespace + Admin cap. Sender becomes the owner;
   * the namespace is shared; the Admin cap is transferred to sender.
   */
  async create(args: CreateNamespaceArgs): Promise<CreateNamespaceResult> {
    const { packageId, registryId } = this.client.addresses;
    const typePackageId = this.client.addresses.originalPackageId || packageId;
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::namespace::create`,
      arguments: [
        tx.object(registryId),
        tx.pure.string(args.name),
        tx.pure.u8(args.kind),
        tx.pure.id(args.sealPackageId),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const result = await this.client.execute({
      transaction: tx,
      options: { showObjectChanges: true, showEvents: true },
    });

    // biome-ignore lint/suspicious/noExplicitAny: SuiObjectChange union type varies across SDK versions
    const created: any[] = (result.objectChanges as any[] | undefined) ?? [];
    const namespaceType = `${typePackageId}::namespace::MemoryNamespace`;
    const adminCapType = `${typePackageId}::namespace::NamespaceCapability<${typePackageId}::namespace::Admin>`;

    // biome-ignore lint/suspicious/noExplicitAny: same as above
    const ns = created.find((c: any) => c.type === "created" && c.objectType === namespaceType);
    // biome-ignore lint/suspicious/noExplicitAny: same as above
    const admin = created.find((c: any) => c.type === "created" && c.objectType === adminCapType);

    if (!ns || !admin || ns.type !== "created" || admin.type !== "created") {
      throw new Error(
        `namespace::create did not return the expected objects. ` +
          `objectChanges: ${JSON.stringify(created, null, 2)}`,
      );
    }

    return {
      namespaceId: ns.objectId,
      adminCapId: admin.objectId,
      txDigest: result.digest,
    };
  }

  /** Look up a namespace ID by (owner, name) via the global registry. Returns null if not registered. */
  async findByName(owner: string, name: string): Promise<string | null> {
    const { packageId, registryId } = this.client.addresses;
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::registry::lookup`,
      arguments: [tx.object(registryId), tx.pure.address(owner), tx.pure.string(name)],
    });

    const result = await this.client.client.devInspectTransactionBlock({
      sender: this.client.senderAddress(),
      transactionBlock: tx,
    });

    if (result.effects.status.status !== "success") {
      throw new Error(`lookup failed: ${result.effects.status.error}`);
    }

    const ret = result.results?.[0]?.returnValues?.[0];
    if (!ret) return null;
    // Returns Option<ID> — BCS-encoded as either 0x00 (None) or 0x01 || <32 bytes>.
    const [rawBytes] = ret;
    const bytes = rawBytes as number[] | undefined;
    if (!bytes || bytes.length === 0 || bytes[0] === 0) return null;
    const idBytes = bytes.slice(1);
    return `0x${idBytes.map((b: number) => b.toString(16).padStart(2, "0")).join("")}`;
  }

  /** Mint a ReadOnly capability for `recipient`. Caller must hold the Admin cap. */
  async shareReadOnly(args: {
    namespaceId: string;
    adminCapId: string;
    recipient: string;
  }): Promise<{ capId: string; txDigest: string }> {
    return this.shareCap("readonly", args);
  }

  /** Mint a ReadWrite capability for `recipient`. Caller must hold the Admin cap. */
  async shareReadWrite(args: {
    namespaceId: string;
    adminCapId: string;
    recipient: string;
  }): Promise<{ capId: string; txDigest: string }> {
    return this.shareCap("readwrite", args);
  }

  private async shareCap(
    kind: "readonly" | "readwrite",
    args: { namespaceId: string; adminCapId: string; recipient: string },
  ): Promise<{ capId: string; txDigest: string }> {
    const { packageId } = this.client.addresses;
    const typePackageId = this.client.addresses.originalPackageId || packageId;
    const fn = kind === "readonly" ? "mint_capability_readonly" : "mint_capability_readwrite";
    const phantomKind = kind === "readonly" ? "ReadOnly" : "ReadWrite";

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::namespace::${fn}`,
      arguments: [
        tx.object(args.namespaceId),
        tx.object(args.adminCapId),
        tx.pure.address(args.recipient),
      ],
    });

    const result = await this.client.execute({
      transaction: tx,
      options: { showObjectChanges: true },
    });

    const capType = `${typePackageId}::namespace::NamespaceCapability<${typePackageId}::namespace::${phantomKind}>`;
    const cap = (
      result.objectChanges as
        | Array<{
            type?: string;
            objectType?: string;
            objectId?: string;
          }>
        | undefined
    )?.find((c) => c.type === "created" && c.objectType === capType);
    if (!cap || cap.type !== "created" || !cap.objectId) {
      throw new Error(
        `${fn} did not return the expected capability. ` +
          `objectChanges: ${JSON.stringify(result.objectChanges, null, 2)}`,
      );
    }
    return { capId: cap.objectId, txDigest: result.digest };
  }

  /** Soft-delete a namespace. Admin-gated. Subsequent emit_call attempts abort `ENamespaceInactive`. */
  async deactivate(args: {
    namespaceId: string;
    adminCapId: string;
  }): Promise<{ txDigest: string }> {
    return this.toggle("deactivate", args);
  }

  /** Re-enable a previously-deactivated namespace. Admin-gated. */
  async reactivate(args: {
    namespaceId: string;
    adminCapId: string;
  }): Promise<{ txDigest: string }> {
    return this.toggle("reactivate", args);
  }

  /** Read a NamespaceCapability's phantom kind from its object type. */
  async getCapabilityKind(capId: string): Promise<NamespaceCapabilityKind> {
    const obj = await this.client.client.getObject({
      id: capId,
      options: { showType: true },
    });
    const objectType = obj.data?.type;
    if (!objectType) {
      throw new Error(`No NamespaceCapability found at ${capId}`);
    }
    return capabilityKindFromObjectType(objectType);
  }

  /** Read a NamespaceCapability's kind, namespace, and Sui owner metadata. */
  async getCapability(capId: string): Promise<NamespaceCapabilityDetails> {
    const obj = await this.client.client.getObject({
      id: capId,
      options: { showType: true, showContent: true, showOwner: true },
    });
    return namespaceCapabilityFromSuiObject(capId, obj.data);
  }

  /**
   * Holder self-revoke. Consumes a capability object owned by the signer.
   * This is not owner-driven revocation of someone else's cap.
   */
  async revokeCapability(args: {
    capId: string;
    kind?: NamespaceCapabilityKind;
  }): Promise<{ txDigest: string; kind: NamespaceCapabilityKind }> {
    const { packageId } = this.client.addresses;
    const typePackageId = this.client.addresses.originalPackageId || packageId;
    const kind = args.kind ?? (await this.getCapabilityKind(args.capId));
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::namespace::revoke_capability`,
      typeArguments: [`${typePackageId}::namespace::${kind}`],
      arguments: [tx.object(args.capId)],
    });
    const result = await this.client.execute({
      transaction: tx,
      options: { showEvents: true },
    });
    return { txDigest: result.digest, kind };
  }

  /**
   * Admin revoke. Marks `capId` revoked under the namespace; it does not delete
   * the holder-owned capability object. Future trace/write/decrypt gates reject it.
   */
  async adminRevokeCapability(args: {
    namespaceId: string;
    adminCapId: string;
    capId: string;
  }): Promise<{ txDigest: string }> {
    const { packageId } = this.client.addresses;
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::namespace::admin_revoke_capability`,
      arguments: [tx.object(args.namespaceId), tx.object(args.adminCapId), tx.pure.id(args.capId)],
    });
    const result = await this.client.execute({
      transaction: tx,
      options: { showEvents: true },
    });
    return { txDigest: result.digest };
  }

  /** List namespaces created by an owner (from NamespaceCreatedEvent). Read-only. */
  async list(
    owner: string,
  ): Promise<Array<{ namespaceId: string; name: string; kind: number; createdAt: number }>> {
    const { packageId } = this.client.addresses;
    const typePackageId = this.client.addresses.originalPackageId || packageId;
    const out: Array<{ namespaceId: string; name: string; kind: number; createdAt: number }> = [];
    // biome-ignore lint/suspicious/noExplicitAny: opaque cursor type across @mysten/sui versions
    let cursor: any = null;
    while (true) {
      const page = await this.client.client.queryEvents({
        query: { MoveEventType: `${typePackageId}::namespace::NamespaceCreatedEvent` },
        cursor,
        order: "descending",
        limit: 50,
      });
      for (const e of page.data) {
        const f = e.parsedJson as Record<string, unknown> | undefined;
        if (!f || f.owner !== owner) continue;
        out.push({
          namespaceId: String(f.namespace_id ?? ""),
          name: String(f.name ?? ""),
          kind: Number(f.namespace_kind ?? 0),
          createdAt: Number(f.created_at ?? 0),
        });
      }
      if (!page.hasNextPage || !page.nextCursor) break;
      cursor = page.nextCursor;
    }
    return out;
  }

  /** Active capabilities for a namespace (minted minus revoked). Read-only. */
  async getCapabilities(
    namespaceId: string,
  ): Promise<Array<{ capId: string; kind: number; recipient: string }>> {
    const history = await this.getCapabilityHistory(namespaceId);
    return history
      .filter((row) => row.active)
      .map((row) => ({ capId: row.capId, kind: row.kind, recipient: row.recipient }));
  }

  /** Capability mint/revoke history for a namespace, derived from Sui events. */
  async getCapabilityHistory(namespaceId: string): Promise<NamespaceCapabilityHistoryRow[]> {
    const { packageId } = this.client.addresses;
    const typePackageId = this.client.addresses.originalPackageId || packageId;
    return fetchNamespaceCapabilityHistory(this.client.client, typePackageId, namespaceId);
  }

  /** Read a MemoryNamespace's on-chain fields (no signer needed). */
  async get(namespaceId: string): Promise<{
    id: string;
    owner: string;
    name: string;
    kind: number;
    active: boolean;
  }> {
    const obj = await this.client.client.getObject({
      id: namespaceId,
      options: { showContent: true },
    });
    const content = obj.data?.content;
    if (!content || content.dataType !== "moveObject") {
      throw new Error(`No MemoryNamespace found at ${namespaceId}`);
    }
    const f = content.fields as Record<string, unknown>;
    return {
      id: namespaceId,
      owner: String(f.owner ?? ""),
      name: String(f.name ?? ""),
      kind: Number(f.kind ?? 0),
      active: f.active !== false,
    };
  }

  private async toggle(
    fn: "deactivate" | "reactivate",
    args: { namespaceId: string; adminCapId: string },
  ): Promise<{ txDigest: string }> {
    const { packageId } = this.client.addresses;
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::namespace::${fn}`,
      arguments: [tx.object(args.namespaceId), tx.object(args.adminCapId)],
    });
    const result = await this.client.execute({ transaction: tx });
    return { txDigest: result.digest };
  }
}
