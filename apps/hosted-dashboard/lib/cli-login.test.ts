import { describe, expect, it } from "vitest";
import {
  CliLoginConfigError,
  CliLoginValidationError,
  lookupCliLoginMemWalAccount,
  resolveCliLoginMemWalConfig,
  resolveCliLoginNetwork,
} from "./cli-login";

const OWNER = `0x${"a".repeat(64)}`;
const PACKAGE_ID = `0x${"1".repeat(64)}`;
const REGISTRY_ID = `0x${"2".repeat(64)}`;
const TABLE_ID = `0x${"3".repeat(64)}`;
const ACCOUNT_ID = `0x${"4".repeat(64)}`;

function env(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    MEMWAL_PACKAGE_ID: PACKAGE_ID,
    MEMWAL_REGISTRY_ID: REGISTRY_ID,
    ...values,
  } as NodeJS.ProcessEnv;
}

function emptyEnv(): NodeJS.ProcessEnv {
  return { NODE_ENV: "test" } as NodeJS.ProcessEnv;
}

function registryContent(tableId = TABLE_ID) {
  return {
    dataType: "moveObject",
    fields: { accounts: { fields: { id: { id: tableId } } } },
  };
}

function accountContent(accountId = ACCOUNT_ID) {
  return {
    dataType: "moveObject",
    fields: { value: accountId },
  };
}

describe("hosted CLI login config", () => {
  it("resolves defaults without leaking or requiring private config", () => {
    expect(resolveCliLoginNetwork(env())).toBe("testnet");
    expect(resolveCliLoginMemWalConfig(env())).toMatchObject({
      network: "testnet",
      packageId: PACKAGE_ID,
      registryId: REGISTRY_ID,
      relayerUrl: "https://relayer.staging.memwal.ai",
    });
  });

  it("rejects unsupported networks and missing public MemWal config", () => {
    expect(() => resolveCliLoginNetwork(env({ SUI_NETWORK: "localnet" }))).toThrow(
      CliLoginValidationError,
    );
    expect(() => resolveCliLoginMemWalConfig(emptyEnv())).toThrow(CliLoginConfigError);
    expect(() =>
      resolveCliLoginMemWalConfig(env({ MEMWAL_PACKAGE_ID: "not-an-object-id" })),
    ).toThrow(CliLoginConfigError);
  });
});

describe("lookupCliLoginMemWalAccount", () => {
  it("resolves an existing account dynamic field", async () => {
    const calls: string[] = [];
    const client = {
      async getObject() {
        calls.push("registry");
        return { data: { content: registryContent() } };
      },
      async getDynamicFieldObject(input: {
        readonly parentId: string;
        readonly name: { readonly type: "address"; readonly value: string };
      }) {
        calls.push(`${input.parentId}:${input.name.value}`);
        return { data: { content: accountContent() } };
      },
    };

    await expect(lookupCliLoginMemWalAccount(OWNER, env(), client)).resolves.toMatchObject({
      ok: true,
      owner: OWNER,
      accountId: ACCOUNT_ID,
      packageId: PACKAGE_ID,
      registryId: REGISTRY_ID,
    });
    expect(calls).toEqual(["registry", `${TABLE_ID}:${OWNER}`]);
  });

  it("returns null when the owner dynamic field is missing", async () => {
    const client = {
      async getObject() {
        return { data: { content: registryContent() } };
      },
      async getDynamicFieldObject() {
        throw new Error("dynamic field does not exist");
      },
    };

    await expect(lookupCliLoginMemWalAccount(OWNER, env(), client)).resolves.toMatchObject({
      accountId: null,
    });
  });

  it("fails closed for invalid owners and malformed registry objects", async () => {
    await expect(lookupCliLoginMemWalAccount("bad-owner", env())).rejects.toThrow(
      CliLoginValidationError,
    );

    const client = {
      async getObject() {
        return { data: { content: { dataType: "moveObject", fields: {} } } };
      },
      async getDynamicFieldObject() {
        return { data: { content: accountContent() } };
      },
    };
    await expect(lookupCliLoginMemWalAccount(OWNER, env(), client)).rejects.toThrow(
      /accounts table id/,
    );
  });
});
