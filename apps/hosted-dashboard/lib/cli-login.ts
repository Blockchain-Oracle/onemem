import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { isValidSuiAddress, isValidSuiObjectId } from "@mysten/sui/utils";

export type CliLoginNetwork = "testnet" | "mainnet" | "devnet";

export interface CliLoginMemWalConfig {
  readonly network: CliLoginNetwork;
  readonly rpcUrl: string;
  readonly packageId: string;
  readonly registryId: string;
  readonly relayerUrl: string;
}

export interface CliLoginAccountLookup {
  readonly ok: true;
  readonly owner: string;
  readonly network: CliLoginNetwork;
  readonly packageId: string;
  readonly registryId: string;
  readonly relayerUrl: string;
  readonly accountId: string | null;
}

export class CliLoginConfigError extends Error {
  readonly code = "not_configured";
}

export class CliLoginValidationError extends Error {
  readonly code = "bad_request";
}

function requireEnv(name: string, env = process.env): string {
  const value = env[name];
  if (!value) throw new CliLoginConfigError(`Hosted CLI login is not configured. Set ${name}.`);
  return value;
}

export function resolveCliLoginNetwork(env = process.env): CliLoginNetwork {
  const raw = env.NEXT_PUBLIC_SUI_NETWORK ?? env.SUI_NETWORK ?? "testnet";
  if (raw !== "testnet" && raw !== "mainnet" && raw !== "devnet") {
    throw new CliLoginValidationError(`unsupported Sui network: ${raw}`);
  }
  return raw;
}

function defaultRpcUrl(network: CliLoginNetwork): string {
  if (network === "mainnet") return "https://fullnode.mainnet.sui.io:443";
  if (network === "devnet") return "https://fullnode.devnet.sui.io:443";
  return "https://fullnode.testnet.sui.io:443";
}

function defaultRelayerUrl(network: CliLoginNetwork): string {
  return network === "mainnet" ? "https://relayer.memwal.ai" : "https://relayer.staging.memwal.ai";
}

export function resolveCliLoginMemWalConfig(env = process.env): CliLoginMemWalConfig {
  const network = resolveCliLoginNetwork(env);
  const packageId = requireEnv("MEMWAL_PACKAGE_ID", env);
  const registryId = requireEnv("MEMWAL_REGISTRY_ID", env);
  if (!isValidSuiObjectId(packageId)) {
    throw new CliLoginConfigError("Hosted CLI login has an invalid MEMWAL_PACKAGE_ID.");
  }
  if (!isValidSuiObjectId(registryId)) {
    throw new CliLoginConfigError("Hosted CLI login has an invalid MEMWAL_REGISTRY_ID.");
  }
  return {
    network,
    packageId,
    registryId,
    rpcUrl: env.ONEMEM_RPC_URL ?? env.SUI_RPC_URL ?? defaultRpcUrl(network),
    relayerUrl: env.MEMWAL_RELAYER_URL ?? defaultRelayerUrl(network),
  };
}

type ParsedMoveObject = {
  readonly dataType?: string;
  readonly fields?: Record<string, unknown>;
};

interface CliLoginLookupClient {
  getObject(input: {
    readonly id: string;
    readonly options: { readonly showContent: true };
  }): Promise<{ readonly data?: { readonly content?: unknown } | null }>;
  getDynamicFieldObject(input: {
    readonly parentId: string;
    readonly name: { readonly type: "address"; readonly value: string };
  }): Promise<{ readonly data?: { readonly content?: unknown } | null }>;
}

function parsedContentFields(value: unknown): Record<string, unknown> | null {
  const content = value as ParsedMoveObject | null | undefined;
  return content?.dataType === "moveObject" && content.fields ? content.fields : null;
}

function extractRegistryTableId(content: unknown): string {
  const fields = parsedContentFields(content);
  const accounts = fields?.accounts as
    | { readonly fields?: { readonly id?: { readonly id?: unknown } } }
    | undefined;
  const tableId = accounts?.fields?.id?.id;
  if (typeof tableId !== "string" || !isValidSuiObjectId(tableId)) {
    throw new Error("MemWal registry does not expose an accounts table id.");
  }
  return tableId;
}

function extractDynamicFieldValue(content: unknown): string | null {
  const fields = parsedContentFields(content);
  const value = fields?.value;
  return typeof value === "string" && isValidSuiObjectId(value) ? value : null;
}

export async function lookupCliLoginMemWalAccount(
  owner: string,
  env = process.env,
  lookupClient?: CliLoginLookupClient,
): Promise<CliLoginAccountLookup> {
  if (!isValidSuiAddress(owner)) {
    throw new CliLoginValidationError("owner must be a valid Sui address");
  }
  const config = resolveCliLoginMemWalConfig(env);
  const client =
    lookupClient ?? new SuiJsonRpcClient({ network: config.network, url: config.rpcUrl });
  const registry = await client.getObject({
    id: config.registryId,
    options: { showContent: true },
  });
  const tableId = extractRegistryTableId(registry.data?.content);

  let accountId: string | null = null;
  try {
    const field = await client.getDynamicFieldObject({
      parentId: tableId,
      name: { type: "address", value: owner },
    });
    accountId = extractDynamicFieldValue(field.data?.content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/not exist|not found|does not exist/i.test(message)) {
      throw error;
    }
  }

  return {
    ok: true,
    owner,
    network: config.network,
    packageId: config.packageId,
    registryId: config.registryId,
    relayerUrl: config.relayerUrl,
    accountId,
  };
}
