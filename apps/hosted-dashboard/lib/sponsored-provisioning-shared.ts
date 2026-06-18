import type { SuiTransactionBlockResponse } from "@mysten/sui/jsonRpc";
import { isValidSuiAddress, isValidSuiObjectId } from "@mysten/sui/utils";
import type { SuiNetwork } from "@onemem/sdk-ts";

export type SponsoredProvisioningAction =
  | "namespace-create"
  | "rw-cap-mint"
  | "ro-cap-share"
  | "rw-cap-share"
  | "cap-self-revoke";
export type EnokiProvisioningNetwork = Exclude<SuiNetwork, "local">;
export type SponsoredCapabilityKind = "ReadOnly" | "ReadWrite" | "Admin";

export interface PrepareSponsoredProvisioningInput {
  readonly action: SponsoredProvisioningAction;
  readonly sender: string;
  readonly network?: string;
  readonly label?: string;
  readonly namespaceId?: string;
  readonly adminCapId?: string;
  readonly capId?: string;
  readonly capKind?: string;
  readonly recipient?: string;
}

export interface ExecuteSponsoredProvisioningInput {
  readonly action: SponsoredProvisioningAction;
  readonly digest: string;
  readonly signature: string;
  readonly network?: string;
  readonly capId?: string;
  readonly capKind?: string;
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
  readonly capId?: string;
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
  readonly revokedCapId?: string;
  readonly capKind?: SponsoredCapabilityKind;
}

export interface SponsoredTransactionRequest {
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
  readonly capId?: string;
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
  "cap-self-revoke",
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

export function assertAction(value: string): SponsoredProvisioningAction {
  if (ACTIONS.has(value as SponsoredProvisioningAction))
    return value as SponsoredProvisioningAction;
  throw new ProvisioningValidationError(
    "action must be namespace-create, rw-cap-mint, ro-cap-share, rw-cap-share, or cap-self-revoke",
  );
}

export function assertAddress(value: unknown, label: string): string {
  if (typeof value !== "string" || !isValidSuiAddress(value)) {
    throw new ProvisioningValidationError(`${label} must be a valid Sui address`);
  }
  return value;
}

export function assertObjectId(value: unknown, label: string): string {
  if (typeof value !== "string" || !isValidSuiObjectId(value)) {
    throw new ProvisioningValidationError(`${label} must be a valid Sui object id`);
  }
  return value;
}

export function assertDigest(value: unknown): string {
  if (typeof value !== "string" || value.length < 20) {
    throw new ProvisioningValidationError("digest is required");
  }
  return value;
}

export function assertSignature(value: unknown): string {
  if (typeof value !== "string" || value.length < 20) {
    throw new ProvisioningValidationError("signature is required");
  }
  return value;
}

export function assertCapabilityKind(value: unknown): SponsoredCapabilityKind {
  if (value === "ReadOnly" || value === "ReadWrite" || value === "Admin") {
    return value;
  }
  throw new ProvisioningValidationError("capKind must be ReadOnly, ReadWrite, or Admin");
}

export function capabilityKindForAction(
  action: SponsoredProvisioningAction,
): SponsoredCapabilityKind {
  if (action === "cap-self-revoke") {
    throw new ProvisioningValidationError("capKind is required for cap-self-revoke");
  }
  return action === "ro-cap-share" ? "ReadOnly" : "ReadWrite";
}

export function capabilityMintFunction(action: SponsoredProvisioningAction): string {
  return action === "ro-cap-share" ? "mint_capability_readonly" : "mint_capability_readwrite";
}

export function moveTargets(
  packageId: string,
  action: SponsoredProvisioningAction,
): readonly string[] {
  const target =
    action === "namespace-create"
      ? `${packageId}::namespace::create`
      : action === "cap-self-revoke"
        ? `${packageId}::namespace::revoke_capability`
        : `${packageId}::namespace::${capabilityMintFunction(action)}`;
  return [target];
}

export function uniqueAddresses(...addresses: string[]): readonly string[] {
  return [...new Set(addresses)];
}
