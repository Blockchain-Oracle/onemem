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
import { NamespacesAPI } from "./namespaces.js";
import { TracesAPI } from "./traces.js";

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
}

export class OneMem {
  readonly network: SuiNetwork;
  readonly client: SuiJsonRpcClient;
  readonly addresses: OneMemAddresses;
  readonly signer: Signer;
  readonly namespaces: NamespacesAPI;
  readonly traces: TracesAPI;

  private constructor(params: {
    network: SuiNetwork;
    client: SuiJsonRpcClient;
    addresses: OneMemAddresses;
    signer: Signer;
  }) {
    this.network = params.network;
    this.client = params.client;
    this.addresses = params.addresses;
    this.signer = params.signer;
    this.namespaces = new NamespacesAPI(this);
    this.traces = new TracesAPI(this);
  }

  static async create(config: OneMemConfig): Promise<OneMem> {
    const network = config.network ?? ACTIVE_NETWORK;
    const addresses = config.addresses ?? addressesFor(network);
    const client = new SuiJsonRpcClient({
      network,
      url: config.rpcUrl ?? addresses.rpcUrl,
    });
    return new OneMem({ network, client, addresses, signer: config.signer });
  }

  /** Sender address derived from the signer's public key. */
  senderAddress(): string {
    return this.signer.toSuiAddress();
  }
}
