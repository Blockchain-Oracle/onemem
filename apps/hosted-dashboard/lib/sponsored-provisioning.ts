import { EnokiClient } from "@mysten/enoki";
import {
  SuiJsonRpcClient,
  type SuiObjectChange,
  type SuiTransactionBlockResponse,
} from "@mysten/sui/jsonRpc";
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID, toBase64 } from "@mysten/sui/utils";
import { addressesFor, NamespaceKind } from "@onemem/sdk-ts";
import {
  assertAction,
  assertAddress,
  assertCapabilityKind,
  assertDigest,
  assertHostedSponsorshipConfigured,
  assertObjectId,
  assertSignature,
  capabilityKindForAction,
  capabilityMintFunction,
  type EnokiProvisioningNetwork,
  type ExecuteSponsoredProvisioningInput,
  moveTargets,
  type PrepareSponsoredProvisioningInput,
  resolveProvisioningNetwork,
  type SponsoredProvisioningDeps,
  type SponsoredProvisioningExecuted,
  type SponsoredProvisioningPrepared,
  type SponsoredProvisioningRequest,
  type SponsoredTransactionRequest,
  uniqueAddresses,
} from "./sponsored-provisioning-shared";

export {
  assertHostedSponsorshipConfigured,
  type ExecuteSponsoredProvisioningInput,
  hasHostedSponsorshipConfig,
  type PrepareSponsoredProvisioningInput,
  ProvisioningConfigError,
  ProvisioningValidationError,
  resolveProvisioningNetwork,
  type SponsoredCapabilityKind,
  type SponsoredProvisioningAction,
} from "./sponsored-provisioning-shared";

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

function namespaceObjectTypeMatches(actual: string, expected: string): boolean {
  if (actual === expected) return true;
  if (expected.endsWith("::namespace::MemoryNamespace")) {
    return actual.endsWith("::namespace::MemoryNamespace");
  }

  const expectedCap = expected.match(
    /::namespace::NamespaceCapability<.+::namespace::(Admin|ReadOnly|ReadWrite)>$/,
  );
  if (!expectedCap) return false;

  const actualCap = actual.match(
    /::namespace::NamespaceCapability<.+::namespace::(Admin|ReadOnly|ReadWrite)>$/,
  );
  return actualCap?.[1] === expectedCap[1];
}

function findCreatedObject(tx: SuiTransactionBlockResponse, objectType: string): string {
  const changes = (tx.objectChanges ?? []) as SuiObjectChange[];
  const created = changes.find(
    (change) =>
      change.type === "created" &&
      "objectType" in change &&
      typeof change.objectType === "string" &&
      namespaceObjectTypeMatches(change.objectType, objectType) &&
      "objectId" in change &&
      typeof change.objectId === "string",
  );
  if (!created || !("objectId" in created) || typeof created.objectId !== "string") {
    const observed = changes
      .filter(
        (change) =>
          change.type === "created" &&
          "objectType" in change &&
          typeof change.objectType === "string",
      )
      .map((change) => ("objectType" in change ? change.objectType : ""))
      .join(", ");
    throw new Error(
      `transaction did not create expected object type ${objectType}. ` +
        `created object types: ${observed || "none"}`,
    );
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

  if (action === "cap-self-revoke") {
    const capId = assertObjectId(input.capId, "capId");
    const capKind = assertCapabilityKind(input.capKind);
    return {
      action,
      network,
      sender,
      allowedMoveCallTargets: moveTargets(addresses.packageId, action),
      allowedAddresses: [sender],
      capId,
      capKind,
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
    if (request.action === "cap-self-revoke") {
      const typePackageId = addresses.originalPackageId || addresses.packageId;
      tx.moveCall({
        target: `${addresses.packageId}::namespace::revoke_capability`,
        typeArguments: [`${typePackageId}::namespace::${request.capKind}`],
        arguments: [tx.object(request.capId ?? "")],
      });
      return {
        ...request,
        txBytes: await tx.build({ client, onlyTransactionKind: true }),
      };
    }

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
    capId: built.capId,
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
    const typePackageId = addresses.originalPackageId || addresses.packageId;
    const namespaceId = findCreatedObject(tx, `${typePackageId}::namespace::MemoryNamespace`);
    const adminCapId = findCreatedObject(
      tx,
      `${typePackageId}::namespace::NamespaceCapability<${typePackageId}::namespace::Admin>`,
    );
    return { ok: true, action, network, txDigest, namespaceId, adminCapId };
  }

  if (action === "cap-self-revoke") {
    return {
      ok: true,
      action,
      network,
      txDigest,
      revokedCapId: assertObjectId(input.capId, "capId"),
      capKind: assertCapabilityKind(input.capKind),
    };
  }

  const capKind = capabilityKindForAction(action);
  const typePackageId = addresses.originalPackageId || addresses.packageId;
  const capId = findCreatedObject(
    tx,
    `${typePackageId}::namespace::NamespaceCapability<${typePackageId}::namespace::${capKind}>`,
  );
  if (action === "ro-cap-share") {
    return { ok: true, action, network, txDigest, roCapId: capId, sharedCapId: capId, capKind };
  }
  if (action === "rw-cap-share") {
    return { ok: true, action, network, txDigest, rwCapId: capId, sharedCapId: capId, capKind };
  }
  return { ok: true, action, network, txDigest, rwCapId: capId, capKind };
}
