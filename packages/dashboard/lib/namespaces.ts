// Namespace + capability reads for the dashboard. Wraps the SDK's read-only
// NamespacesAPI (event queries — no signer needed; we pass a throwaway keypair
// since these paths never sign). Powers /share, /settings, the namespace chip,
// and the /api/capabilities route.

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { OneMem } from "@onemem/sdk-ts";
import { NETWORK } from "./trace";

async function readClient(): Promise<OneMem> {
  // Reads (queryEvents/getObject) don't sign; a generated keypair is fine.
  return OneMem.create({ network: NETWORK, signer: Ed25519Keypair.generate() });
}

export interface NamespaceRow {
  namespaceId: string;
  name: string;
  kind: number;
  createdAt: number;
}

export interface CapabilityRow {
  capId: string;
  kind: number;
  recipient: string;
}

/** Namespaces created by an owner (from NamespaceCreatedEvent). */
export async function fetchNamespaces(owner: string): Promise<NamespaceRow[]> {
  const om = await readClient();
  return om.namespaces.list(owner);
}

/** Active capabilities for a namespace (minted minus revoked). */
export async function fetchCapabilities(namespaceId: string): Promise<CapabilityRow[]> {
  const om = await readClient();
  return om.namespaces.getCapabilities(namespaceId);
}

/** A namespace's on-chain fields. */
export async function fetchNamespace(namespaceId: string): Promise<{
  id: string;
  owner: string;
  name: string;
  kind: number;
  active: boolean;
}> {
  const om = await readClient();
  return om.namespaces.get(namespaceId);
}
