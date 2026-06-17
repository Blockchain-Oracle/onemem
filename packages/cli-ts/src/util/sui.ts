// Read-only Sui access for the CLI. Verification + inspection need no signer,
// no Walrus, no Seal — just a JSON-RPC client + the package id. This is what
// makes `onemem verify` runnable by anyone, with zero setup.

import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { addressesFor, type SuiNetwork } from "@onemem/sdk-ts";
import { resolveNetwork } from "@onemem/sdk-ts/runtime";
import { parseNetwork } from "./validate.js";

export interface ReadContext {
  client: SuiJsonRpcClient;
  packageId: string;
  network: SuiNetwork;
}

export function readContext(networkOpt?: string): ReadContext {
  const network = resolveNetwork(parseNetwork(networkOpt));
  const addresses = addressesFor(network);
  return {
    client: new SuiJsonRpcClient({ network, url: addresses.rpcUrl }),
    packageId: addresses.packageId,
    network,
  };
}

export const ACTION_CALL_EMITTED = "events::ActionCallEmittedEvent";
