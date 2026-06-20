// OneMem client — the entry point for SDK consumers.
//
//   import { OneMem } from "@onemem/sdk-ts";
//   import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
//
//   const onemem = await OneMem.create({
//     network: "testnet",
//     signer: Ed25519Keypair.fromSecretKey(env.PRIVATE_KEY),
//     memory: { delegateKey, accountId, embeddingApiKey, memwalPackageId, relayerUrl },
//   });
//
//   await onemem.requireMemory().add("user prefers dark mode");
//
// Memory is stored via MemWal (`@mysten-incubation/memwal`), which does its own
// Seal encryption + Walrus storage internally. OneMem holds the Sui signer +
// MemWal credentials and exposes the Mem0-style `add`/`search` surface.

import type { Signer } from "@mysten/sui/cryptography";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";

type SignArgs = Parameters<SuiJsonRpcClient["signAndExecuteTransaction"]>[0];
type ExecResult = Awaited<ReturnType<SuiJsonRpcClient["signAndExecuteTransaction"]>>;

import { MemoryAPI, type MemoryConfig, MemoryNotConfiguredError } from "./memory.js";

/** Sui networks OneMem understands. */
export type SuiNetwork = "testnet" | "mainnet" | "devnet" | "local";

/** Default JSON-RPC fullnode per network. Override with `rpcUrl`. */
const RPC_URL_BY_NETWORK: Record<SuiNetwork, string> = {
  testnet: "https://fullnode.testnet.sui.io:443",
  mainnet: "https://fullnode.mainnet.sui.io:443",
  devnet: "https://fullnode.devnet.sui.io:443",
  local: "http://127.0.0.1:9000",
};

export interface OneMemConfig {
  /** Sui network. Defaults to testnet. */
  readonly network?: SuiNetwork;
  /**
   * Signer for transactions. Any `@mysten/sui` Signer works
   * (Ed25519Keypair, Secp256k1Keypair, custom adapters).
   */
  readonly signer: Signer;
  /**
   * Optional override of the per-network RPC URL. Useful for pointing at a local
   * fullnode in dev (`http://127.0.0.1:9000`) or a paid provider in production.
   */
  readonly rpcUrl?: string;
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
  readonly signer: Signer;
  /** Memory layer (Mem0-mirror) — present when MemWal config is supplied. */
  readonly memory?: MemoryAPI;

  private constructor(params: {
    network: SuiNetwork;
    client: SuiJsonRpcClient;
    signer: Signer;
    memory?: MemoryConfig;
    suiPrivateKey?: string;
  }) {
    this.network = params.network;
    this.client = params.client;
    this.signer = params.signer;
    this.memory =
      params.memory && params.suiPrivateKey
        ? new MemoryAPI(this, params.memory, params.suiPrivateKey)
        : undefined;
  }

  static async create(config: OneMemConfig): Promise<OneMem> {
    const network = config.network ?? "testnet";
    const url = config.rpcUrl ?? RPC_URL_BY_NETWORK[network];
    const client = new SuiJsonRpcClient({ network, url });

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
      signer: config.signer,
      memory: config.memory,
      suiPrivateKey,
    });
  }

  /** Sender address derived from the signer's public key. */
  senderAddress(): string {
    return this.signer.toSuiAddress();
  }

  /**
   * Sign + execute a transaction with this client's signer, then wait for it to
   * settle before returning. Waiting matters for back-to-back writes funded by a
   * single gas coin: without it the next `tx.build()` can reference a stale
   * owned-object version and abort with "object … unavailable for consumption".
   */
  async execute(args: {
    transaction: SignArgs["transaction"];
    options?: SignArgs["options"];
  }): Promise<ExecResult> {
    const result = await this.client.signAndExecuteTransaction({
      signer: this.signer,
      transaction: args.transaction,
      options: args.options,
    });
    await this.client.waitForTransaction({ digest: result.digest });
    return result;
  }

  /** Return the Memory API or throw if MemWal config wasn't supplied. */
  requireMemory(): MemoryAPI {
    if (!this.memory) {
      throw new MemoryNotConfiguredError();
    }
    return this.memory;
  }
}
