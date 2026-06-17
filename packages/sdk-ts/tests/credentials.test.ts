import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CredentialsPermissionError,
  readOnememCredentials,
  resolveMemoryConfigFromSources,
} from "../src/credentials.js";

let dir = "";

function credsPath(): string {
  return join(dir, "credentials.json");
}

function writeCreds(value: Record<string, unknown>, mode = 0o600): string {
  const path = credsPath();
  writeFileSync(path, JSON.stringify(value, null, 2), { mode });
  chmodSync(path, mode);
  return path;
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "onemem-creds-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("readOnememCredentials", () => {
  it("returns null when the file is missing", () => {
    expect(readOnememCredentials(credsPath())).toBeNull();
  });

  it("refuses group/world-readable credentials", () => {
    const path = writeCreds({ delegateKey: "file-key" }, 0o644);
    expect(() => readOnememCredentials(path)).toThrow(CredentialsPermissionError);
  });
});

describe("resolveMemoryConfigFromSources", () => {
  it("builds memory config from a credentials file", () => {
    const credentials = readOnememCredentials(
      writeCreds({
        delegateKey: "file-key",
        accountId: "0xacct",
        embeddingApiKey: "sk-file",
        memwalPackageId: "0xmemwal",
        relayerUrl: "https://relayer",
        memwalNamespace: "memories",
      }),
    );

    const resolved = resolveMemoryConfigFromSources(
      { ONEMEM_CREDENTIALS_PATH: credsPath() },
      credentials,
    );
    expect(resolved.config).toMatchObject({
      delegateKey: "file-key",
      accountId: "0xacct",
      embeddingApiKey: "sk-file",
      memwalPackageId: "0xmemwal",
      relayerUrl: "https://relayer",
      namespace: "memories",
    });
    expect(resolved.credentialsLoaded).toBe(true);
  });

  it("lets env override file values field by field", () => {
    const credentials = readOnememCredentials(
      writeCreds({
        delegateKey: "file-key",
        accountId: "0xacct-file",
        embeddingApiKey: "sk-file",
        memwalPackageId: "0xfile",
        relayerUrl: "https://file",
      }),
    );

    const resolved = resolveMemoryConfigFromSources(
      {
        ONEMEM_CREDENTIALS_PATH: credsPath(),
        ONEMEM_ACCOUNT_ID: "0xacct-env",
        MEMWAL_RELAYER_URL: "https://env",
      },
      credentials,
    );
    expect(resolved.config).toMatchObject({
      delegateKey: "file-key",
      accountId: "0xacct-env",
      embeddingApiKey: "sk-file",
      memwalPackageId: "0xfile",
      relayerUrl: "https://env",
    });
  });

  it("does not use expired file-backed credentials for memory config", () => {
    const credentials = readOnememCredentials(
      writeCreds({
        delegateKey: "expired-file-key",
        accountId: "0xacct-file",
        embeddingApiKey: "sk-file",
        memwalPackageId: "0xfile",
        expiresAt: "2026-06-16T00:00:00.000Z",
      }),
    );

    const resolved = resolveMemoryConfigFromSources(
      { ONEMEM_CREDENTIALS_PATH: credsPath() },
      credentials,
      new Date("2026-06-17T00:00:00.000Z"),
    );
    expect(resolved.config).toBeUndefined();
    expect(resolved.credentialsLoaded).toBe(true);
    expect(resolved.credentialsExpired).toBe(true);
    expect(resolved.credentialsExpiresAt).toBe("2026-06-16T00:00:00.000Z");
    expect(resolved.missing).toEqual([
      "ONEMEM_DELEGATE_KEY",
      "ONEMEM_ACCOUNT_ID",
      "ONEMEM_EMBEDDING_API_KEY",
    ]);
  });

  it("allows env-provided memory config when the credentials file is expired", () => {
    const credentials = readOnememCredentials(
      writeCreds({
        delegateKey: "expired-file-key",
        accountId: "0xacct-file",
        embeddingApiKey: "sk-file",
        memwalPackageId: "0xfile",
        relayerUrl: "https://file-relayer",
        expiresAt: "2026-06-16T00:00:00.000Z",
      }),
    );

    const resolved = resolveMemoryConfigFromSources(
      {
        ONEMEM_CREDENTIALS_PATH: credsPath(),
        ONEMEM_DELEGATE_KEY: "env-key",
        ONEMEM_ACCOUNT_ID: "0xacct-env",
        ONEMEM_EMBEDDING_API_KEY: "sk-env",
        MEMWAL_PACKAGE_ID: "0xenv",
      },
      credentials,
      new Date("2026-06-17T00:00:00.000Z"),
    );
    expect(resolved.credentialsExpired).toBe(true);
    expect(resolved.config).toMatchObject({
      delegateKey: "env-key",
      accountId: "0xacct-env",
      embeddingApiKey: "sk-env",
      memwalPackageId: "0xenv",
    });
    expect(resolved.config?.relayerUrl).not.toBe("https://file-relayer");
  });
});
