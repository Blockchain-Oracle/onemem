// Seal encryption for OneMem trace content.
//
// Trace payloads stored on Walrus are encrypted with Seal so only holders of a
// NamespaceCapability for the namespace can decrypt them. Encryption is
// identity-based on (our package id, namespace id); decryption is gated by the
// on-chain `onemem::seal_policy::seal_approve<KIND>` (proved working against
// testnet key servers).
//
// Model (verified by spike):
//   - encrypt: SealClient.encrypt({ packageId=<onemem pkg>, id=<namespace id>,
//     data }) — no signature, no gas.
//   - decrypt: a SessionKey (signed personal message, no gas) + a PTB that
//     calls seal_approve for the cap → SealClient.decrypt.
//
// The on-chain integrity hash is taken over the PLAINTEXT (see traces.ts), so a
// cap holder can decrypt the Walrus blob and re-hash to confirm it matches.

import { SealClient, SessionKey } from "@mysten/seal";
import type { Signer } from "@mysten/sui/cryptography";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { fromHex } from "@mysten/sui/utils";

import type { SuiNetwork } from "./generated/addresses.js";

/** Verified testnet key servers (decentralized + aggregator). */
export const SEAL_KEY_SERVERS_BY_NETWORK: Partial<
  Record<SuiNetwork, { objectId: string; aggregatorUrl?: string }[]>
> = {
  testnet: [
    {
      objectId: "0xb012378c9f3799fb5b1a7083da74a4069e3c3f1c93de0b27212a5799ce1e1e98",
      aggregatorUrl: "https://seal-aggregator-testnet.mystenlabs.com",
    },
  ],
};

export const DEFAULT_SEAL_THRESHOLD = 1;
export const DEFAULT_SESSION_TTL_MIN = 10;

export interface SealConfig {
  /** Override the key-server set (objectId + optional aggregatorUrl). */
  readonly keyServers?: { objectId: string; aggregatorUrl?: string }[];
  /** Min key servers required to decrypt. */
  readonly threshold?: number;
  /** Session-key TTL in minutes. */
  readonly sessionTtlMin?: number;
}

const strip0x = (hex: string): string => (hex.startsWith("0x") ? hex.slice(2) : hex);

/**
 * Build a SealClient bound to a network's key servers, or null when none are
 * known for the network and none were supplied.
 */
export function createSealClient(
  suiClient: SuiJsonRpcClient,
  network: SuiNetwork,
  config: SealConfig = {},
): SealClient | null {
  const servers = config.keyServers ?? SEAL_KEY_SERVERS_BY_NETWORK[network];
  if (!servers || servers.length === 0) return null;
  return new SealClient({
    suiClient: suiClient as never,
    serverConfigs: servers.map((s) => ({ ...s, weight: 1 })),
    verifyKeyServers: false,
  });
}

/** Encrypts/decrypts OneMem trace payloads, gated by the namespace's seal_approve. */
export class SealStore {
  private readonly threshold: number;
  private readonly ttlMin: number;

  constructor(
    private readonly seal: SealClient,
    private readonly suiClient: SuiJsonRpcClient,
    private readonly signer: Signer,
    private readonly packageId: string,
    config: SealConfig = {},
  ) {
    this.threshold = config.threshold ?? DEFAULT_SEAL_THRESHOLD;
    this.ttlMin = config.sessionTtlMin ?? DEFAULT_SESSION_TTL_MIN;
  }

  /** The Seal identity for a namespace — all its blobs share it. */
  private identityFor(namespaceId: string): string {
    return strip0x(namespaceId);
  }

  /** Encrypt plaintext for a namespace. No signature, no gas. */
  async encrypt(plaintext: Uint8Array, namespaceId: string): Promise<Uint8Array> {
    const { encryptedObject } = await this.seal.encrypt({
      threshold: this.threshold,
      packageId: this.packageId,
      id: this.identityFor(namespaceId),
      data: plaintext,
    });
    return encryptedObject;
  }

  /**
   * Decrypt a Seal blob. Requires a NamespaceCapability for `namespaceId`;
   * `capKind` is the Move type tag, e.g. "ReadWrite" | "ReadOnly" | "Admin".
   */
  async decrypt(
    ciphertext: Uint8Array,
    args: { namespaceId: string; capId: string; capKind: string },
  ): Promise<Uint8Array> {
    const id = this.identityFor(args.namespaceId);

    const tx = new Transaction();
    tx.moveCall({
      target: `${this.packageId}::seal_policy::seal_approve`,
      typeArguments: [`${this.packageId}::namespace::${args.capKind}`],
      arguments: [
        tx.pure.vector("u8", fromHex(id)),
        tx.object(args.namespaceId),
        tx.object(args.capId),
      ],
    });
    const txBytes = await tx.build({ client: this.suiClient as never, onlyTransactionKind: true });

    const sessionKey = await SessionKey.create({
      address: this.signer.toSuiAddress(),
      packageId: this.packageId,
      ttlMin: this.ttlMin,
      suiClient: this.suiClient as never,
    });
    const { signature } = await this.signer.signPersonalMessage(sessionKey.getPersonalMessage());
    sessionKey.setPersonalMessageSignature(signature);

    return this.seal.decrypt({ data: ciphertext, sessionKey, txBytes });
  }
}
