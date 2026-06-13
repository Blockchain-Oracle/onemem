// OneMem client — the entry point for SDK consumers.
//
//   import { OneMem } from "@onemem/sdk-ts";
//   import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
//
//   const onemem = await OneMem.create({
//     network: "testnet",
//     signer: Ed25519Keypair.fromSecretKey(env.PRIVATE_KEY),
//   });
//
//   const { namespaceId, adminCapId } = await onemem.namespaces.create({
//     name: "my-agent-memory",
//     kind: NamespaceKind.User,
//     sealPackageId: "0x...",
//   });
//
// Reads deployed addresses from the codegen-emitted manifest in
// `src/generated/addresses.ts`. Switch networks with `network: "mainnet"`
// (throws a clean "OneMem is not deployed on mainnet" error until the
// mainnet deploy populates the manifest — by design, per
// feedback_config_portability_empty_then_populate).

import type { Signer } from "@mysten/sui/cryptography";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

import {
  ACTIVE_NETWORK,
  addressesFor,
  type OneMemAddresses,
  type SuiNetwork,
} from "./generated/addresses.js";
import { MemoryAPI, type MemoryConfig, MemoryNotConfiguredError } from "./memory.js";
import { NamespacesAPI } from "./namespaces.js";
import { createSealClient, type SealConfig, SealNotConfiguredError, SealStore } from "./seal.js";
import { TracesAPI } from "./traces.js";
import {
  extendWithWalrus,
  type WalrusConfig,
  WalrusNotConfiguredError,
  WalrusStore,
} from "./walrus.js";

export interface OneMemConfig {
  /** Sui network. Defaults to ACTIVE_NETWORK from the manifest. */
  readonly network?: SuiNetwork;
  /**
   * Signer for transactions. Any `@mysten/sui` Signer works
   * (Ed25519Keypair, Secp256k1Keypair, custom adapters).
   */
  readonly signer: Signer;
  /**
   * Optional override of the RPC URL from the manifest. Useful for
   * pointing at a local fullnode in dev (`http://127.0.0.1:9000`) or
   * a paid provider (Triton, Blockdaemon) in production.
   */
  readonly rpcUrl?: string;
  /**
   * Optional override of the manifest addresses block. Almost never
   * needed — exists for tests + edge cases (e.g., a fork environment).
   */
  readonly addresses?: OneMemAddresses;
  /**
   * Walrus blob-storage settings. When a relay host is available for the
   * network (testnet/mainnet by default), `onemem.walrus` is wired up so
   * trace payloads can be stored on Walrus. Pass `{ uploadRelayHost }` to
   * enable other networks.
   */
  readonly walrus?: WalrusConfig;
  /**
   * Seal encryption settings. When key servers are available for the network
   * (testnet by default), `onemem.seal` is wired up so trace payloads can be
   * encrypted before Walrus upload and decrypted by capability holders.
   */
  readonly seal?: SealConfig;
  /**
   * Memory layer (Mem0-mirror) config — MemWal `/manual` credentials. When
   * present, `onemem.memory` is wired up so `add`/`search` work. Needs a
   * MemWal account + delegate key (see scripts/setup-memwal.mts) + an
   * embedding API key.
   */
  readonly memory?: MemoryConfig;
}

export class OneMem {
  readonly network: SuiNetwork;
  readonly client: SuiJsonRpcClient;
  readonly addresses: OneMemAddresses;
  readonly signer: Signer;
  readonly namespaces: NamespacesAPI;
  readonly traces: TracesAPI;
  /** Walrus blob store — present when a relay host is configured for the network. */
  readonly walrus?: WalrusStore;
  /** Seal encrypt/decrypt — present when key servers are configured for the network. */
  readonly seal?: SealStore;
  /** Memory layer (Mem0-mirror) — present when MemWal config is supplied. */
  readonly memory?: MemoryAPI;

  private constructor(params: {
    network: SuiNetwork;
    client: SuiJsonRpcClient;
    addresses: OneMemAddresses;
    signer: Signer;
    walrus?: WalrusStore;
    seal?: SealStore;
    memory?: MemoryConfig;
    suiPrivateKey?: string;
  }) {
    this.network = params.network;
    this.client = params.client;
    this.addresses = params.addresses;
    this.signer = params.signer;
    this.walrus = params.walrus;
    this.seal = params.seal;
    this.namespaces = new NamespacesAPI(this);
    this.traces = new TracesAPI(this);
    this.memory =
      params.memory && params.suiPrivateKey
        ? new MemoryAPI(this, params.memory, params.suiPrivateKey)
        : undefined;
  }

  static async create(config: OneMemConfig): Promise<OneMem> {
    const network = config.network ?? ACTIVE_NETWORK;
    const addresses = config.addresses ?? addressesFor(network);
    const url = config.rpcUrl ?? addresses.rpcUrl;
    const base = new SuiJsonRpcClient({ network, url });

    // Extend the SAME client with Walrus so Move txs + Walrus writes share one
    // object/coin cache (avoids stale-gas-coin "object unavailable" errors).
    const walrusClient = extendWithWalrus(base, network, config.walrus ?? {});
    const client = walrusClient ?? base;
    const walrusStore = walrusClient
      ? new WalrusStore(walrusClient, config.signer, config.walrus ?? {})
      : undefined;

    const sealClient = createSealClient(client, network, config.seal ?? {});
    const sealStore = sealClient
      ? new SealStore(sealClient, client, config.signer, addresses.packageId, config.seal ?? {})
      : undefined;

    // MemWal `/manual` needs a bech32 Sui key for Seal + Walrus signing;
    // default to the signer's own key when it exposes getSecretKey (keypairs do).
    const suiPrivateKey =
      config.memory?.suiPrivateKey ??
      (config.signer as { getSecretKey?: () => string }).getSecretKey?.();
    if (config.memory && !suiPrivateKey) {
      throw new MemoryNotConfiguredError(
        "memory config supplied but no Sui private key — pass memory.suiPrivateKey (this signer can't expose one).",
      );
    }

    return new OneMem({
      network,
      client,
      addresses,
      signer: config.signer,
      walrus: walrusStore,
      seal: sealStore,
      memory: config.memory,
      suiPrivateKey,
    });
  }

  /** Sender address derived from the signer's public key. */
  senderAddress(): string {
    return this.signer.toSuiAddress();
  }

  /** Return the Walrus store or throw a clear error if it isn't configured for this network. */
  requireWalrus(): WalrusStore {
    if (!this.walrus) {
      throw new WalrusNotConfiguredError(this.network);
    }
    return this.walrus;
  }

  /** Return the Seal store or throw if it isn't configured for this network. */
  requireSeal(): SealStore {
    if (!this.seal) {
      throw new SealNotConfiguredError(this.network);
    }
    return this.seal;
  }

  /** Return the Memory API or throw if MemWal config wasn't supplied. */
  requireMemory(): MemoryAPI {
    if (!this.memory) {
      throw new MemoryNotConfiguredError();
    }
    return this.memory;
  }
}
