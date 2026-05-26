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
//   deactivate(ns) / reactivate(ns)   → admin-gated soft delete

import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import type { OneMem } from "./client.js";
import type { NamespaceKind } from "./types/move.js";

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

    const result = await this.client.client.signAndExecuteTransaction({
      signer: this.client.signer,
      transaction: tx,
      options: { showObjectChanges: true, showEvents: true },
    });

    // biome-ignore lint/suspicious/noExplicitAny: SuiObjectChange union type varies across SDK versions
    const created: any[] = (result.objectChanges as any[] | undefined) ?? [];
    const namespaceType = `${packageId}::namespace::MemoryNamespace`;
    const adminCapType = `${packageId}::namespace::NamespaceCapability<${packageId}::namespace::Admin>`;

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

    const result = await this.client.client.signAndExecuteTransaction({
      signer: this.client.signer,
      transaction: tx,
      options: { showObjectChanges: true },
    });

    const capType = `${packageId}::namespace::NamespaceCapability<${packageId}::namespace::${phantomKind}>`;
    // biome-ignore lint/suspicious/noExplicitAny: SuiObjectChange typing
    const cap = (result.objectChanges as any[] | undefined)?.find(
      (c: any) => c.type === "created" && c.objectType === capType,
    );
    if (!cap || cap.type !== "created") {
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
    const result = await this.client.client.signAndExecuteTransaction({
      signer: this.client.signer,
      transaction: tx,
    });
    return { txDigest: result.digest };
  }
}
