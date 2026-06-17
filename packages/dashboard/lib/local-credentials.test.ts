import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { localCredentialSummary } from "./local-credentials";

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

function testEnv(values: Partial<NodeJS.ProcessEnv>): NodeJS.ProcessEnv {
  return { ...values, NODE_ENV: values.NODE_ENV ?? "test" } as NodeJS.ProcessEnv;
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "onemem-dashboard-creds-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("localCredentialSummary", () => {
  it("returns sanitized configured credential metadata", () => {
    const path = writeCreds({
      delegateKey: "private-delegate-key",
      embeddingApiKey: "private-embedding-key",
      delegatePublicKey: "pub-key",
      accountId: "0xacct",
      suiAddress: "0xsui",
      activeNamespaceId: "0xnamespace",
      memwalPackageId: "0xmemwal",
      relayerUrl: "https://relayer",
      delegateLabel: "codex laptop",
      delegateTtlSeconds: 2_592_000,
      createdAt: "2026-06-17T00:00:00.000Z",
      expiresAt: "2026-07-17T00:00:00.000Z",
    });

    const summary = localCredentialSummary(
      testEnv({ ONEMEM_CREDENTIALS_PATH: path }),
      new Date("2026-06-17T00:00:00.000Z"),
    );
    expect(summary.status).toBe("configured");
    expect(summary.delegateStatus).toBe("active");
    expect(summary.delegateLabel).toBe("codex laptop");
    expect(summary.delegateTtlSeconds).toBe(2_592_000);
    expect(summary.expiresInDays).toBe(30);
    expect(summary.delegatePublicKey).toBe("pub-key");
    expect(summary.memwalPackageId).toBe("0xmemwal");
    expect(JSON.stringify(summary)).not.toContain("private-delegate-key");
    expect(JSON.stringify(summary)).not.toContain("private-embedding-key");
  });

  it("marks credentials expiring soon", () => {
    const path = writeCreds({
      delegateKey: "private-delegate-key",
      embeddingApiKey: "private-embedding-key",
      accountId: "0xacct",
      memwalPackageId: "0xmemwal",
      expiresAt: "2026-06-20T00:00:00.000Z",
    });

    const summary = localCredentialSummary(
      testEnv({ ONEMEM_CREDENTIALS_PATH: path }),
      new Date("2026-06-17T00:00:00.000Z"),
    );
    expect(summary.status).toBe("configured");
    expect(summary.delegateStatus).toBe("expiring-soon");
    expect(summary.expiresInDays).toBe(3);
  });

  it("marks expired file credentials unusable without leaking secrets", () => {
    const path = writeCreds({
      delegateKey: "private-delegate-key",
      embeddingApiKey: "private-embedding-key",
      accountId: "0xacct",
      memwalPackageId: "0xmemwal",
      expiresAt: "2026-06-16T00:00:00.000Z",
    });

    const summary = localCredentialSummary(
      testEnv({ ONEMEM_CREDENTIALS_PATH: path }),
      new Date("2026-06-17T00:00:00.000Z"),
    );
    expect(summary.status).toBe("expired");
    expect(summary.delegateStatus).toBe("expired");
    expect(summary.memwalPackageId).toBeNull();
    expect(summary.missing).toEqual([
      "ONEMEM_DELEGATE_KEY",
      "ONEMEM_ACCOUNT_ID",
      "ONEMEM_EMBEDDING_API_KEY",
      "MEMWAL_PACKAGE_ID",
    ]);
    expect(JSON.stringify(summary)).not.toContain("private-delegate-key");
    expect(JSON.stringify(summary)).not.toContain("private-embedding-key");
  });

  it("reports env-backed configuration even when the local file is expired", () => {
    const path = writeCreds({
      delegateKey: "private-delegate-key",
      embeddingApiKey: "private-embedding-key",
      accountId: "0xacct-file",
      memwalPackageId: "0xfile",
      expiresAt: "2026-06-16T00:00:00.000Z",
    });

    const summary = localCredentialSummary(
      testEnv({
        ONEMEM_CREDENTIALS_PATH: path,
        ONEMEM_DELEGATE_KEY: "env-key",
        ONEMEM_ACCOUNT_ID: "0xacct-env",
        ONEMEM_EMBEDDING_API_KEY: "sk-env",
        MEMWAL_PACKAGE_ID: "0xenv",
      }),
      new Date("2026-06-17T00:00:00.000Z"),
    );
    expect(summary.status).toBe("configured");
    expect(summary.delegateStatus).toBe("expired");
    expect(summary.accountId).toBe("0xacct-env");
    expect(summary.memwalPackageId).toBe("0xenv");
    expect(JSON.stringify(summary)).not.toContain("env-key");
    expect(JSON.stringify(summary)).not.toContain("sk-env");
  });

  it("surfaces unsafe credential-file permissions without leaking contents", () => {
    const path = writeCreds(
      {
        delegateKey: "private-delegate-key",
        embeddingApiKey: "private-embedding-key",
      },
      0o644,
    );

    const summary = localCredentialSummary(testEnv({ ONEMEM_CREDENTIALS_PATH: path }));
    expect(summary.status).toBe("error");
    expect(summary.delegateStatus).toBe("error");
    expect(summary.error).toContain("chmod 600");
    expect(JSON.stringify(summary)).not.toContain("private-delegate-key");
    expect(JSON.stringify(summary)).not.toContain("private-embedding-key");
  });
});
