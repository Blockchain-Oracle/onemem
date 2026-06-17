// Real decryption of OneMem trace-call content for the dashboard.
//
// SECURITY MODEL: this runs in the LOCAL dashboard's Node server — which is the
// user's OWN machine, holding their key in ~/.onemem. Plaintext is decrypted
// here and rendered to localhost; it never crosses a network to a third party.
// (The hosted multi-tenant build does this client-side with a wallet SessionKey
// so the hosted server never sees plaintext — tracked separately.)
//
// NOTE: this decrypts OneMem-sealed TRACE CALL blobs (onemem::seal_policy). It
// does NOT apply to memory blobs — those are MemWal-sealed under MemWal's own
// policy and are only retrievable via MemWal's query-based recall, not by blob
// id (MemWal 0.0.5 has no get-by-id), so per-row memory decrypt isn't a thing.

import { type CapKind, OneMem } from "@onemem/sdk-ts";
import { resolveSigner } from "@onemem/sdk-ts/runtime";
import { NETWORK } from "./trace";

const KIND_BY_TAG: Record<number, CapKind> = { 0: "ReadOnly", 1: "ReadWrite", 2: "Admin" };

export interface DecryptArgs {
  walrusBlobId: string;
  namespaceId: string;
}

/**
 * Decrypt a trace-call Walrus blob using whatever capability the local signer
 * holds for the namespace. Throws a clear error if the signer holds no cap or
 * the blob isn't readable/decryptable.
 */
export async function decryptCallContent(args: DecryptArgs): Promise<string> {
  if (!args.walrusBlobId || !args.namespaceId) {
    throw new Error("walrusBlobId and namespaceId are required");
  }
  const onemem = await OneMem.create({ network: NETWORK, signer: resolveSigner() });
  const me = onemem.senderAddress();
  const caps = await onemem.namespaces.getCapabilities(args.namespaceId);
  const mine = caps.find((c) => c.recipient === me);
  if (!mine) {
    throw new Error(`signer ${me} holds no capability for namespace ${args.namespaceId}`);
  }
  const capKind = KIND_BY_TAG[mine.kind] ?? "ReadWrite";
  const ciphertext = await onemem.requireWalrus().readBlob(args.walrusBlobId);
  const plaintext = await onemem
    .requireSeal()
    .decrypt(ciphertext, { namespaceId: args.namespaceId, capId: mine.capId, capKind });
  return new TextDecoder().decode(plaintext);
}
