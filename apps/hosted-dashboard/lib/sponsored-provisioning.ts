import { EnokiClient } from "@mysten/enoki";
import {
  SuiJsonRpcClient,
  type SuiObjectChange,
  type SuiTransactionBlockResponse,
} from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import {
  isValidSuiAddress,
  isValidSuiObjectId,
  SUI_CLOCK_OBJECT_ID,
  toBase64,
} from "@mysten/sui/utils";
import { addressesFor, NamespaceKind, type SuiNetwork } from "@onemem/sdk-ts";

export type SponsoredProvisioningAction =
  | "namespace-create"
  | "rw-cap-mint"
  | "ro-cap-share"
  | "rw-cap-share";
type EnokiProvisioningNetwork = Exclude<SuiNetwork, "local">;
export type SponsoredCapabilityKind = "ReadOnly" | "ReadWrite";

export interface PrepareSponsoredProvisioningInput {
  readonly action: SponsoredProvisioningAction;
  readonly sender: string;
  readonly network?: string;
  readonly label?: string;
  readonly namespaceId?: string;
  readonly adminCapId?: string;
  readonly recipient?: string;
}

export interface ExecuteSponsoredProvisioningInput {
  readonly action: SponsoredProvisioningAction;
  readonly digest: string;
  readonly signature: string;
  readonly network?: string;
}

export interface SponsoredProvisioningPrepared {
  readonly ok: true;
  readonly action: SponsoredProvisioningAction;
  readonly network: EnokiProvisioningNetwork;
  readonly digest: string;
  readonly bytes: string;
  readonly sender: string;
  readonly namespaceName?: string;
  readonly namespaceId?: string;
  readonly adminCapId?: string;
  readonly recipient?: string;
  readonly capKind?: SponsoredCapabilityKind;
  readonly allowedMoveCallTargets: readonly string[];
  readonly allowedAddresses: readonly string[];
}

export interface SponsoredProvisioningExecuted {
  readonly ok: true;
  readonly action: SponsoredProvisioningAction;
  readonly network: EnokiProvisioningNetwork;
  readonly txDigest: string;
  readonly namespaceId?: string;
  readonly adminCapId?: string;
  readonly roCapId?: string;
  readonly rwCapId?: string;
  readonly sharedCapId?: string;
  readonly capKind?: SponsoredCapabilityKind;
}

interface SponsoredTransactionRequest {
  readonly network: EnokiProvisioningNetwork;
  readonly transactionKindBytes: string;
  readonly sender: string;
  readonly allowedMoveCallTargets: string[];
  readonly allowedAddresses: string[];
}

export interface SponsoredProvisioningDeps {
  readonly createSponsoredTransaction?: (
    args: SponsoredTransactionRequest,
  ) => Promise<{ readonly digest: string; readonly bytes: string }>;
  readonly executeSponsoredTransaction?: (
    args: Pick<ExecuteSponsoredProvisioningInput, "digest" | "signature">,
  ) => Promise<{ readonly digest: string }>;
  readonly waitForTransaction?: (
    network: EnokiProvisioningNetwork,
    digest: string,
  ) => Promise<SuiTransactionBlockResponse>;
}

export interface SponsoredProvisioningRequest {
  readonly action: SponsoredProvisioningAction;
  readonly network: EnokiProvisioningNetwork;
  readonly sender: string;
  readonly allowedMoveCallTargets: readonly string[];
  readonly allowedAddresses: readonly string[];
  readonly namespaceName?: string;
  readonly namespaceId?: string;
  readonly adminCapId?: string;
  readonly recipient?: string;
  readonly capKind?: SponsoredCapabilityKind;
}

export class ProvisioningConfigError extends Error {
  readonly code = "not_configured";
}

export class ProvisioningValidationError extends Error {
  readonly code = "bad_request";
}

const ACTIONS = new Set<SponsoredProvisioningAction>([
  "namespace-create",
  "rw-cap-mint",
  "ro-cap-share",
  "rw-cap-share",
]);

function getEnokiPrivateKey(env = process.env): string {
  return env.ENOKI_PRIVATE_KEY ?? env.ENOKI_SECRET_KEY ?? "";
}

export function hasHostedSponsorshipConfig(env = process.env): boolean {
  return getEnokiPrivateKey(env).length > 0;
}

export function assertHostedSponsorshipConfigured(env = process.env): string {
  const key = getEnokiPrivateKey(env);
  if (!key) {
    throw new ProvisioningConfigError(
      "Hosted sponsorship is not configured. Set ENOKI_PRIVATE_KEY on the server.",
    );
  }
  return key;
}

export function resolveProvisioningNetwork(
  value?: string,
  env = process.env,
): EnokiProvisioningNetwork {
  const raw = value ?? env.NEXT_PUBLIC_SUI_NETWORK ?? env.SUI_NETWORK ?? "testnet";
  if (raw !== "testnet" && raw !== "mainnet" && raw !== "devnet") {
    throw new ProvisioningValidationError(`unsupported Sui network: ${raw}`);
  }
  return raw;
}

function assertAction(value: string): SponsoredProvisioningAction {
  if (ACTIONS.has(value as SponsoredProvisioningAction))
    return value as SponsoredProvisioningAction;
  throw new ProvisioningValidationError(
    "action must be namespace-create, rw-cap-mint, ro-cap-share, or rw-cap-share",
  );
}

function assertAddress(value: unknown, label: string): string {
  if (typeof value !== "string" || !isValidSuiAddress(value)) {
    throw new ProvisioningValidationError(`${label} must be a valid Sui address`);
  }
  return value;
}

function assertObjectId(value: unknown, label: string): string {
  if (typeof value !== "string" || !isValidSuiObjectId(value)) {
    throw new ProvisioningValidationError(`${label} must be a valid Sui object id`);
  }
  return value;
}

function assertDigest(value: unknown): string {
  if (typeof value !== "string" || value.length < 20) {
    throw new ProvisioningValidationError("digest is required");
  }
  return value;
}

function assertSignature(value: unknown): string {
  if (typeof value !== "string" || value.length < 20) {
    throw new ProvisioningValidationError("signature is required");
  }
  return value;
}

function namespaceName(sender: string, label: unknown): string {
  const raw = typeof label === "string" && label.trim() ? label.trim() : "hosted";
  const clean = raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  const base = clean || "hosted";
  return `${base}-${sender.slice(2, 10)}-${Date.now().toString(36)}`;
}

function suiClient(network: EnokiProvisioningNetwork) {
  const addresses = addressesFor(network);
  return { addresses, client: new SuiJsonRpcClient({ network, url: addresses.rpcUrl }) };
}

function capabilityKindForAction(action: SponsoredProvisioningAction): SponsoredCapabilityKind {
  return action === "ro-cap-share" ? "ReadOnly" : "ReadWrite";
}

function capabilityMintFunction(action: SponsoredProvisioningAction): string {
  return action === "ro-cap-share" ? "mint_capability_readonly" : "mint_capability_readwrite";
}

function moveTargets(packageId: string, action: SponsoredProvisioningAction): readonly string[] {
  const target =
    action === "namespace-create"
      ? `${packageId}::namespace::create`
      : `${packageId}::namespace::${capabilityMintFunction(action)}`;
  return [target];
}

function uniqueAddresses(...addresses: string[]): readonly string[] {
  return [...new Set(addresses)];
}

function findCreatedObject(tx: SuiTransactionBlockResponse, objectType: string): string {
  const changes = (tx.objectChanges ?? []) as SuiObjectChange[];
  const created = changes.find(
    (change) =>
      change.type === "created" &&
      "objectType" in change &&
      change.objectType === objectType &&
      "objectId" in change &&
      typeof change.objectId === "string",
  );
  if (!created || !("objectId" in created) || typeof created.objectId !== "string") {
    throw new Error(`transaction did not create expected object type ${objectType}`);
  }
  return created.objectId;
}

function assertTransactionSucceeded(tx: SuiTransactionBlockResponse): void {
  const status = tx.effects?.status;
  if (status?.status !== "success") {
    throw new Error(`sponsored transaction failed: ${status?.error ?? "unknown error"}`);
  }
}

export function resolveSponsoredProvisioningRequest(
  input: PrepareSponsoredProvisioningInput,
): SponsoredProvisioningRequest {
  const action = assertAction(input.action);
  const sender = assertAddress(input.sender, "sender");
  const network = resolveProvisioningNetwork(input.network);
  const { addresses } = suiClient(network);

  if (action === "namespace-create") {
    const name = namespaceName(sender, input.label);
    return {
      action,
      network,
      sender,
      allowedMoveCallTargets: moveTargets(addresses.packageId, action),
      allowedAddresses: [sender],
      namespaceName: name,
    };
  }

  const namespaceId = assertObjectId(input.namespaceId, "namespaceId");
  const adminCapId = assertObjectId(input.adminCapId, "adminCapId");
  const recipient = action === "rw-cap-mint" ? sender : assertAddress(input.recipient, "recipient");
  return {
    action,
    network,
    sender,
    allowedMoveCallTargets: moveTargets(addresses.packageId, action),
    allowedAddresses: uniqueAddresses(sender, recipient),
    namespaceId,
    adminCapId,
    recipient,
    capKind: capabilityKindForAction(action),
  };
}

async function buildTransactionKindBytes(
  input: PrepareSponsoredProvisioningInput,
): Promise<SponsoredProvisioningRequest & { readonly txBytes: Uint8Array }> {
  const request = resolveSponsoredProvisioningRequest(input);
  const { addresses, client } = suiClient(request.network);
  const tx = new Transaction();
  tx.setSender(request.sender);

  if (request.action === "namespace-create") {
    tx.moveCall({
      target: `${addresses.packageId}::namespace::create`,
      arguments: [
        tx.object(addresses.registryId),
        tx.pure.string(request.namespaceName ?? "hosted"),
        tx.pure.u8(NamespaceKind.Shared),
        tx.pure.id(addresses.packageId),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });
  } else {
    tx.moveCall({
      target: `${addresses.packageId}::namespace::${capabilityMintFunction(request.action)}`,
      arguments: [
        tx.object(request.namespaceId ?? ""),
        tx.object(request.adminCapId ?? ""),
        tx.pure.address(request.recipient ?? request.sender),
      ],
    });
  }

  return {
    ...request,
    txBytes: await tx.build({ client, onlyTransactionKind: true }),
  };
}

export async function prepareSponsoredProvisioning(
  input: PrepareSponsoredProvisioningInput,
  env = process.env,
  deps: SponsoredProvisioningDeps = {},
): Promise<SponsoredProvisioningPrepared> {
  const apiKey = assertHostedSponsorshipConfigured(env);
  const built = await buildTransactionKindBytes(input);
  const createSponsoredTransaction =
    deps.createSponsoredTransaction ??
    ((args: SponsoredTransactionRequest) =>
      new EnokiClient({ apiKey }).createSponsoredTransaction(args));
  const sponsored = await createSponsoredTransaction({
    network: built.network,
    transactionKindBytes: toBase64(built.txBytes),
    sender: built.sender,
    allowedMoveCallTargets: [...built.allowedMoveCallTargets],
    allowedAddresses: [...built.allowedAddresses],
  });

  return {
    ok: true,
    action: built.action,
    network: built.network,
    digest: sponsored.digest,
    bytes: sponsored.bytes,
    sender: built.sender,
    namespaceName: built.namespaceName,
    namespaceId: built.namespaceId,
    adminCapId: built.adminCapId,
    recipient: built.recipient,
    capKind: built.capKind,
    allowedMoveCallTargets: built.allowedMoveCallTargets,
    allowedAddresses: built.allowedAddresses,
  };
}

export async function executeSponsoredProvisioning(
  input: ExecuteSponsoredProvisioningInput,
  env = process.env,
  deps: SponsoredProvisioningDeps = {},
): Promise<SponsoredProvisioningExecuted> {
  const apiKey = assertHostedSponsorshipConfigured(env);
  const action = assertAction(input.action);
  const digest = assertDigest(input.digest);
  const signature = assertSignature(input.signature);
  const network = resolveProvisioningNetwork(input.network);
  const { addresses, client } = suiClient(network);

  const executeSponsoredTransaction =
    deps.executeSponsoredTransaction ??
    ((args: Pick<ExecuteSponsoredProvisioningInput, "digest" | "signature">) =>
      new EnokiClient({ apiKey }).executeSponsoredTransaction(args));
  const executed = await executeSponsoredTransaction({ digest, signature });
  const txDigest = executed.digest;
  const tx = deps.waitForTransaction
    ? await deps.waitForTransaction(network, txDigest)
    : await client.waitForTransaction({
        digest: txDigest,
        options: { showEffects: true, showObjectChanges: true, showEvents: true },
      });
  assertTransactionSucceeded(tx);

  if (action === "namespace-create") {
    const namespaceId = findCreatedObject(tx, `${addresses.packageId}::namespace::MemoryNamespace`);
    const adminCapId = findCreatedObject(
      tx,
      `${addresses.packageId}::namespace::NamespaceCapability<${addresses.packageId}::namespace::Admin>`,
    );
    return { ok: true, action, network, txDigest, namespaceId, adminCapId };
  }

  const capKind = capabilityKindForAction(action);
  const capId = findCreatedObject(
    tx,
    `${addresses.packageId}::namespace::NamespaceCapability<${addresses.packageId}::namespace::${capKind}>`,
  );
  if (action === "ro-cap-share") {
    return { ok: true, action, network, txDigest, roCapId: capId, sharedCapId: capId, capKind };
  }
  if (action === "rw-cap-share") {
    return { ok: true, action, network, txDigest, rwCapId: capId, sharedCapId: capId, capKind };
  }
  return { ok: true, action, network, txDigest, rwCapId: capId, capKind };
}
