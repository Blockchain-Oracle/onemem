import { addressesFor } from "@onemem/sdk-ts";
import { describe, expect, it } from "vitest";
import {
  assertHostedSponsorshipConfigured,
  executeSponsoredProvisioning,
  hasHostedSponsorshipConfig,
  ProvisioningConfigError,
  ProvisioningValidationError,
  prepareSponsoredProvisioning,
  resolveProvisioningNetwork,
  resolveSponsoredProvisioningRequest,
} from "./sponsored-provisioning";

function env(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return { NODE_ENV: "test", ...values } as NodeJS.ProcessEnv;
}

const sender = `0x${"1".repeat(64)}`;
const namespaceId = `0x${"2".repeat(64)}`;
const adminCapId = `0x${"3".repeat(64)}`;
const recipient = `0x${"4".repeat(64)}`;
const capId = `0x${"5".repeat(64)}`;

function createdCapChange(kind: "ReadOnly" | "ReadWrite") {
  const { packageId } = addressesFor("testnet");
  return {
    type: "created",
    objectType: `${packageId}::namespace::NamespaceCapability<${packageId}::namespace::${kind}>`,
    objectId: capId,
  };
}

describe("sponsored provisioning guardrails", () => {
  it("accepts either private Enoki key name but never treats missing config as ready", () => {
    expect(hasHostedSponsorshipConfig(env())).toBe(false);
    expect(hasHostedSponsorshipConfig(env({ ENOKI_SECRET_KEY: "secret" }))).toBe(true);
    expect(assertHostedSponsorshipConfigured(env({ ENOKI_PRIVATE_KEY: "secret" }))).toBe("secret");
    expect(() => assertHostedSponsorshipConfigured(env())).toThrow(ProvisioningConfigError);
  });

  it("validates supported Sui networks", () => {
    expect(resolveProvisioningNetwork(undefined, env())).toBe("testnet");
    expect(resolveProvisioningNetwork("mainnet")).toBe("mainnet");
    expect(() => resolveProvisioningNetwork("localnet")).toThrow(ProvisioningValidationError);
  });

  it("returns config errors before building or executing sponsored transactions", async () => {
    await expect(
      prepareSponsoredProvisioning(
        { action: "namespace-create", sender: `0x${"a".repeat(64)}` },
        env(),
      ),
    ).rejects.toThrow(ProvisioningConfigError);

    await expect(
      executeSponsoredProvisioning(
        { action: "namespace-create", digest: "digest".repeat(5), signature: "sig".repeat(8) },
        env(),
      ),
    ).rejects.toThrow(ProvisioningConfigError);
  });

  it("validates action shape before contacting Enoki for malformed requests", async () => {
    await expect(
      prepareSponsoredProvisioning(
        {
          action: "unsupported" as "namespace-create",
          sender: `0x${"a".repeat(64)}`,
        },
        env({ ENOKI_PRIVATE_KEY: "secret" }),
      ),
    ).rejects.toThrow(ProvisioningValidationError);
  });

  it("validates hosted share recipients before contacting Enoki", async () => {
    await expect(
      prepareSponsoredProvisioning(
        {
          action: "ro-cap-share",
          sender,
          namespaceId,
          adminCapId,
          recipient: "not-an-address",
        },
        env({ ENOKI_PRIVATE_KEY: "secret" }),
      ),
    ).rejects.toThrow(ProvisioningValidationError);
  });

  it("resolves ReadOnly share requests with a strict target and address allowlist", () => {
    const prepared = resolveSponsoredProvisioningRequest({
      action: "ro-cap-share",
      sender,
      namespaceId,
      adminCapId,
      recipient,
    });

    expect(prepared.action).toBe("ro-cap-share");
    expect(prepared.capKind).toBe("ReadOnly");
    expect(prepared.recipient).toBe(recipient);
    expect(prepared).toMatchObject({
      sender,
      allowedAddresses: [sender, recipient],
    });
    expect(prepared.allowedMoveCallTargets[0]).toMatch(/::namespace::mint_capability_readonly$/);
  });

  it("resolves ReadWrite share requests with a strict target and address allowlist", () => {
    const prepared = resolveSponsoredProvisioningRequest({
      action: "rw-cap-share",
      sender,
      namespaceId,
      adminCapId,
      recipient,
    });

    expect(prepared.action).toBe("rw-cap-share");
    expect(prepared.capKind).toBe("ReadWrite");
    expect(prepared.recipient).toBe(recipient);
    expect(prepared).toMatchObject({
      sender,
      allowedAddresses: [sender, recipient],
    });
    expect(prepared.allowedMoveCallTargets[0]).toMatch(/::namespace::mint_capability_readwrite$/);
  });

  it("parses executed ReadOnly share capabilities from transaction object changes", async () => {
    const executed = await executeSponsoredProvisioning(
      { action: "ro-cap-share", digest: "digest".repeat(5), signature: "sig".repeat(8) },
      env({ ENOKI_PRIVATE_KEY: "secret" }),
      {
        executeSponsoredTransaction: async () => ({ digest: "tx".repeat(16) }),
        waitForTransaction: async () =>
          ({
            effects: { status: { status: "success" } },
            objectChanges: [createdCapChange("ReadOnly")],
          }) as never,
      },
    );

    expect(executed.capKind).toBe("ReadOnly");
    expect(executed.roCapId).toBe(capId);
    expect(executed.sharedCapId).toBe(capId);
  });

  it("parses executed ReadWrite share capabilities from transaction object changes", async () => {
    const executed = await executeSponsoredProvisioning(
      { action: "rw-cap-share", digest: "digest".repeat(5), signature: "sig".repeat(8) },
      env({ ENOKI_PRIVATE_KEY: "secret" }),
      {
        executeSponsoredTransaction: async () => ({ digest: "tx".repeat(16) }),
        waitForTransaction: async () =>
          ({
            effects: { status: { status: "success" } },
            objectChanges: [createdCapChange("ReadWrite")],
          }) as never,
      },
    );

    expect(executed.capKind).toBe("ReadWrite");
    expect(executed.rwCapId).toBe(capId);
    expect(executed.sharedCapId).toBe(capId);
  });
});
