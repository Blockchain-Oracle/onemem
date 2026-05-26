// Example PTB: mint a MemoryNamespace + initial NamespaceCapability<Admin>.
// Implemented in Pillar 1. Spec: docs/05-our-architecture/01-protocol/access-control-and-sharing.md

import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

const client = new SuiClient({ url: getFullnodeUrl("mainnet") });

export async function mintNamespace(packageId: string, sender: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::namespace::create`,
    arguments: [],
  });
  tx.setSender(sender);
  return tx;
}
