// Seal encryption for OneMem trace content.
//
// Trace payloads stored on Walrus are encrypted with Seal so only holders of a
// NamespaceCapability for the namespace can decrypt them. Encryption is
// identity-based on (our package id, namespace id); decryption is gated by the
// on-chain `onemem::seal_policy::seal_approve<KIND>` (proved working against
// testnet key servers).
//
// Model (verified by spike):
//   - encrypt: SealClient.encrypt({ packageId=<first onemem pkg>, id=<namespace id>,
//     data }) — no signature, no gas. Seal requires the package ID to be the
//     original package object (version 1), even after Sui package upgrades.
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
import type { CapKind } from "./types/move.js";

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
  /**
   * Verify each key server's on-chain object matches its reported public key
   * before use. Enabling costs one extra round-trip per server. Defaults to
   * `false`; enable for untrusted/custom key servers.
   */
  readonly verifyKeyServers?: boolean;
}

const strip0x = (hex: string): string => (hex.startsWith("0x") ? hex.slice(2) : hex);

export interface SealPackageIds {
  /** First-version package ID used by Seal identities and SessionKeys. */
  readonly sealPackageId: string;
  /** Current package ID containing the latest `seal_policy::seal_approve` implementation. */
  readonly policyPackageId?: string;
  /** Package ID that defines `namespace::NamespaceCapability<KIND>` type identity. */
  readonly typePackageId?: string;
}

/** Thrown when Seal is used on a client where it wasn't configured. */
export class SealNotConfiguredError extends Error {
  constructor(network: string) {
    super(
      `Seal is not configured for network "${network}". Pass { seal: { keyServers } } to OneMem.create().`,
    );
    this.name = "SealNotConfiguredError";
  }
}

/** Thrown when Seal encryption fails; carries the namespace + cause. */
export class SealEncryptError extends Error {
  constructor(
    readonly namespaceId: string,
    options?: { cause?: unknown },
  ) {
    super(`Seal encryption failed for namespace ${namespaceId}`, options);
    this.name = "SealEncryptError";
  }
}

/** Thrown when Seal decryption fails — wrong cap, inactive namespace, or key-server error. */
export class SealDecryptError extends Error {
  constructor(
    message: string,
    readonly namespaceId: string,
    readonly capId: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "SealDecryptError";
  }
}

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
    verifyKeyServers: config.verifyKeyServers ?? false,
  });
}

/** Encrypts/decrypts OneMem trace payloads, gated by the namespace's seal_approve. */
export class SealStore {
  private readonly threshold: number;
  private readonly ttlMin: number;
  private readonly sealPackageId: string;
  private readonly policyPackageId: string;
  private readonly typePackageId: string;
  /**
   * In-flight/resolved signed-SessionKey promise, reused across decrypts until
   * the key expires. Holding the promise (not the resolved key) collapses
   * concurrent decrypts onto a single mint+sign — the signature is the costly
   * step. Cleared on decrypt failure so a poisoned key (revoked cap, rotated
   * server) re-mints on the next call instead of wedging for the whole TTL.
   */
  private sessionKeyPromise: Promise<SessionKey> | null = null;

  constructor(
    private readonly seal: SealClient,
    private readonly suiClient: SuiJsonRpcClient,
    private readonly signer: Signer,
    packageIds: string | SealPackageIds,
    config: SealConfig = {},
  ) {
    this.threshold = config.threshold ?? DEFAULT_SEAL_THRESHOLD;
    this.ttlMin = config.sessionTtlMin ?? DEFAULT_SESSION_TTL_MIN;
    const ids = typeof packageIds === "string" ? { sealPackageId: packageIds } : packageIds;
    this.sealPackageId = ids.sealPackageId;
    this.policyPackageId = ids.policyPackageId ?? ids.sealPackageId;
    this.typePackageId = ids.typePackageId ?? ids.sealPackageId;
  }

  /** The Seal identity for a namespace — all its blobs share it. */
  private identityFor(namespaceId: string): string {
    return strip0x(namespaceId);
  }

  /**
   * A signed SessionKey, cached until expiry. Signing a personal message is the
   * costly step, so we reuse the key across decrypts within its TTL and only
   * re-mint (+re-sign) once it expires. Concurrent callers share the in-flight
   * mint via the cached promise.
   */
  private async getSessionKey(): Promise<SessionKey> {
    if (this.sessionKeyPromise) {
      const existing = await this.sessionKeyPromise.catch(() => null);
      if (existing && !existing.isExpired()) return existing;
    }
    const minted = this.mintSessionKey();
    this.sessionKeyPromise = minted;
    return minted;
  }

  /** Mint + sign a fresh SessionKey (one personal-message signature, no gas). */
  private async mintSessionKey(): Promise<SessionKey> {
    const sessionKey = await SessionKey.create({
      address: this.signer.toSuiAddress(),
      packageId: this.sealPackageId,
      ttlMin: this.ttlMin,
      suiClient: this.suiClient as never,
    });
    const { signature } = await this.signer.signPersonalMessage(sessionKey.getPersonalMessage());
    sessionKey.setPersonalMessageSignature(signature);
    return sessionKey;
  }

  /** Encrypt plaintext for a namespace. No signature, no gas. */
  async encrypt(plaintext: Uint8Array, namespaceId: string): Promise<Uint8Array> {
    try {
      const { encryptedObject } = await this.seal.encrypt({
        threshold: this.threshold,
        packageId: this.sealPackageId,
        id: this.identityFor(namespaceId),
        data: plaintext,
      });
      if (encryptedObject.length === 0) {
        throw new Error("Seal returned empty ciphertext");
      }
      return encryptedObject;
    } catch (error) {
      throw new SealEncryptError(namespaceId, { cause: error });
    }
  }

  /**
   * Decrypt a Seal blob. Requires a NamespaceCapability for `namespaceId`;
   * `capKind` is the Move type tag, e.g. "ReadWrite" | "ReadOnly" | "Admin".
   */
  async decrypt(
    ciphertext: Uint8Array,
    args: { namespaceId: string; capId: string; capKind: CapKind },
  ): Promise<Uint8Array> {
    try {
      const id = this.identityFor(args.namespaceId);

      const tx = new Transaction();
      tx.moveCall({
        target: `${this.policyPackageId}::seal_policy::seal_approve`,
        typeArguments: [`${this.typePackageId}::namespace::${args.capKind}`],
        arguments: [
          tx.pure.vector("u8", fromHex(id)),
          tx.object(args.namespaceId),
          tx.object(args.capId),
        ],
      });
      const txBytes = await tx.build({
        client: this.suiClient as never,
        onlyTransactionKind: true,
      });

      const sessionKey = await this.getSessionKey();

      return await this.seal.decrypt({ data: ciphertext, sessionKey, txBytes });
    } catch (error) {
      // Drop the cached key so a poisoned session (rotated server, rejected
      // signature) re-mints next call rather than failing for the whole TTL.
      this.sessionKeyPromise = null;
      throw new SealDecryptError(
        `Seal decryption failed (namespace ${args.namespaceId}, cap ${args.capId}, kind ${args.capKind}) — wrong/inactive cap or key-server error`,
        args.namespaceId,
        args.capId,
        { cause: error },
      );
    }
  }
}
