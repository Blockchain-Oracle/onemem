import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryNotConfiguredError, memoryConfigFromEnv } from "../src/util/memory-config.js";

const FULL = {
  ONEMEM_DELEGATE_KEY: "0xkey",
  ONEMEM_ACCOUNT_ID: "0xacct",
  ONEMEM_EMBEDDING_API_KEY: "sk-x",
  MEMWAL_PACKAGE_ID: "0xpkg",
  MEMWAL_RELAYER_URL: "https://relayer",
};

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

function fullEnv(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return { ...FULL, ONEMEM_CREDENTIALS_PATH: credsPath(), ...extra };
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "onemem-cli-creds-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("memoryConfigFromEnv", () => {
  it("builds a config when all required vars are present", () => {
    const cfg = memoryConfigFromEnv(fullEnv({ ONEMEM_MEMWAL_NAMESPACE: "ns1" }));
    expect(cfg.delegateKey).toBe("0xkey");
    expect(cfg.accountId).toBe("0xacct");
    expect(cfg.relayerUrl).toBe("https://relayer");
    expect(cfg.namespace).toBe("ns1");
  });

  it("namespace is optional", () => {
    expect(memoryConfigFromEnv(fullEnv()).namespace).toBeUndefined();
  });

  it("treats an empty-string package id as missing (a blank package is useless)", () => {
    expect(() => memoryConfigFromEnv(fullEnv({ MEMWAL_PACKAGE_ID: "" }))).toThrow(
      /MEMWAL_PACKAGE_ID/,
    );
  });

  it("lists required vars when nothing is configured", () => {
    let err: unknown;
    try {
      memoryConfigFromEnv({ ONEMEM_CREDENTIALS_PATH: credsPath() });
    } catch (e) {
      err = e;
    }
    const msg = (err as Error).message;
    for (const v of [
      "ONEMEM_DELEGATE_KEY",
      "ONEMEM_ACCOUNT_ID",
      "ONEMEM_EMBEDDING_API_KEY",
      "MEMWAL_PACKAGE_ID",
    ]) {
      expect(msg).toContain(v);
    }
  });

  it("throws MemoryNotConfiguredError listing every missing var", () => {
    let err: unknown;
    try {
      memoryConfigFromEnv({
        ONEMEM_DELEGATE_KEY: "0xkey",
        ONEMEM_CREDENTIALS_PATH: credsPath(),
      });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(MemoryNotConfiguredError);
    const msg = (err as Error).message;
    expect(msg).toContain("ONEMEM_ACCOUNT_ID");
    expect(msg).toContain("ONEMEM_EMBEDDING_API_KEY");
    expect(msg).toContain("MEMWAL_PACKAGE_ID");
    expect(msg).not.toContain("ONEMEM_DELEGATE_KEY,"); // present → not listed
  });

  it("uses the login credentials file when env vars are absent", () => {
    const path = writeCreds({
      delegateKey: "file-key",
      accountId: "0xacct-file",
      embeddingApiKey: "sk-file",
      memwalPackageId: "0xmemwal",
      relayerUrl: "https://file-relayer",
      memwalNamespace: "file-ns",
    });
    const cfg = memoryConfigFromEnv({ ONEMEM_CREDENTIALS_PATH: path });
    expect(cfg).toMatchObject({
      delegateKey: "file-key",
      accountId: "0xacct-file",
      embeddingApiKey: "sk-file",
      memwalPackageId: "0xmemwal",
      relayerUrl: "https://file-relayer",
      namespace: "file-ns",
    });
  });

  it("does not report MEMWAL_PACKAGE_ID missing when login credentials contain it", () => {
    const path = writeCreds({
      delegateKey: "file-key",
      accountId: "0xacct-file",
      memwalPackageId: "0xmemwal",
    });

    let err: unknown;
    try {
      memoryConfigFromEnv({ ONEMEM_CREDENTIALS_PATH: path });
    } catch (e) {
      err = e;
    }

    const msg = (err as Error).message;
    expect(msg).toContain("ONEMEM_EMBEDDING_API_KEY");
    expect(msg).not.toContain("MEMWAL_PACKAGE_ID");
  });

  it("lets env override credentials file values", () => {
    const path = writeCreds({
      delegateKey: "file-key",
      accountId: "0xacct-file",
      embeddingApiKey: "sk-file",
      memwalPackageId: "0xfile",
      relayerUrl: "https://file-relayer",
    });
    const cfg = memoryConfigFromEnv({
      ONEMEM_CREDENTIALS_PATH: path,
      ONEMEM_DELEGATE_KEY: "env-key",
      MEMWAL_PACKAGE_ID: "0xenv",
    });
    expect(cfg.delegateKey).toBe("env-key");
    expect(cfg.accountId).toBe("0xacct-file");
    expect(cfg.memwalPackageId).toBe("0xenv");
  });

  it("does not configure memory from expired credentials", () => {
    const path = writeCreds({
      delegateKey: "file-key",
      accountId: "0xacct-file",
      embeddingApiKey: "sk-file",
      memwalPackageId: "0xfile",
      expiresAt: "2020-01-01T00:00:00.000Z",
    });

    let err: unknown;
    try {
      memoryConfigFromEnv({ ONEMEM_CREDENTIALS_PATH: path });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(MemoryNotConfiguredError);
    expect((err as Error).message).toContain("expired at 2020-01-01T00:00:00.000Z");
    expect((err as Error).message).toContain("onemem login");
  });

  it("uses env credentials when the credentials file is expired", () => {
    const path = writeCreds({
      delegateKey: "file-key",
      accountId: "0xacct-file",
      embeddingApiKey: "sk-file",
      memwalPackageId: "0xfile",
      expiresAt: "2020-01-01T00:00:00.000Z",
    });

    const cfg = memoryConfigFromEnv(fullEnv({ ONEMEM_CREDENTIALS_PATH: path }));
    expect(cfg.delegateKey).toBe("0xkey");
    expect(cfg.accountId).toBe("0xacct");
    expect(cfg.embeddingApiKey).toBe("sk-x");
    expect(cfg.memwalPackageId).toBe("0xpkg");
  });

  it("refuses unsafe credentials file permissions", () => {
    const path = writeCreds(
      {
        delegateKey: "file-key",
        accountId: "0xacct-file",
        embeddingApiKey: "sk-file",
        memwalPackageId: "0xfile",
      },
      0o644,
    );
    expect(() => memoryConfigFromEnv({ ONEMEM_CREDENTIALS_PATH: path })).toThrow(/chmod 600/);
  });
});
