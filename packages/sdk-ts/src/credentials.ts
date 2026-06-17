import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import type { MemoryConfig } from "./memory.js";

export const ONEMEM_DIR = join(homedir(), ".onemem");
export const DEFAULT_CREDENTIALS_FILE = join(ONEMEM_DIR, "credentials.json");
export const DEFAULT_MEMWAL_RELAYER_URL = "https://relayer.memory.walrus.xyz";

export interface OneMemCredentials {
  readonly delegateKey?: unknown;
  readonly delegatePublicKey?: unknown;
  readonly delegateLabel?: unknown;
  readonly delegateTtlSeconds?: unknown;
  readonly accountId?: unknown;
  readonly suiAddress?: unknown;
  readonly activeNamespaceId?: unknown;
  readonly agentId?: unknown;
  readonly createdAt?: unknown;
  readonly expiresAt?: unknown;
  readonly sdkVersion?: unknown;
  readonly embeddingApiKey?: unknown;
  readonly memwalPackageId?: unknown;
  readonly relayerUrl?: unknown;
  readonly serverUrl?: unknown;
  readonly memwalNamespace?: unknown;
  readonly namespace?: unknown;
  readonly [key: string]: unknown;
}

export class CredentialsPermissionError extends Error {
  constructor(readonly path: string) {
    super(`refusing to read ${path}: credentials file must be owner-only (chmod 600)`);
    this.name = "CredentialsPermissionError";
  }
}

export class CredentialsParseError extends Error {
  constructor(
    readonly path: string,
    options?: ErrorOptions,
  ) {
    super(`could not parse ${path} as OneMem credentials JSON`, options);
    this.name = "CredentialsParseError";
  }
}

export function credentialsPath(env: NodeJS.ProcessEnv = process.env): string {
  return env.ONEMEM_CREDENTIALS_PATH || DEFAULT_CREDENTIALS_FILE;
}

export function readOnememCredentials(path = credentialsPath()): OneMemCredentials | null {
  if (!existsSync(path)) return null;
  const stat = statSync(path);
  if ((stat.mode & 0o077) !== 0) {
    throw new CredentialsPermissionError(path);
  }
  try {
    return JSON.parse(readFileSync(path, "utf8")) as OneMemCredentials;
  } catch (error) {
    throw new CredentialsParseError(path, { cause: error });
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function credString(
  credentials: OneMemCredentials | null | undefined,
  ...keys: Array<keyof OneMemCredentials>
): string | undefined {
  if (!credentials) return undefined;
  for (const key of keys) {
    const value = stringValue(credentials[key]);
    if (value) return value;
  }
  return undefined;
}

export function credentialsExpiresAt(
  credentials: OneMemCredentials | null | undefined,
): string | null {
  return stringValue(credentials?.expiresAt) ?? null;
}

export function credentialsExpiryTimeMs(
  credentials: OneMemCredentials | null | undefined,
): number | null {
  const expiresAt = credentialsExpiresAt(credentials);
  if (!expiresAt) return null;
  const time = Date.parse(expiresAt);
  return Number.isNaN(time) ? null : time;
}

export function credentialsAreExpired(
  credentials: OneMemCredentials | null | undefined,
  now: Date = new Date(),
): boolean {
  const expiresAtMs = credentialsExpiryTimeMs(credentials);
  return expiresAtMs !== null && expiresAtMs <= now.getTime();
}

export interface MemoryConfigResolution {
  readonly config?: MemoryConfig;
  readonly missing: readonly string[];
  readonly credentialsFile: string;
  readonly credentialsLoaded: boolean;
  readonly credentialsExpired: boolean;
  readonly credentialsExpiresAt: string | null;
}

export function resolveMemoryConfigFromSources(
  env: NodeJS.ProcessEnv = process.env,
  credentials: OneMemCredentials | null = readOnememCredentials(credentialsPath(env)),
  now: Date = new Date(),
): MemoryConfigResolution {
  const credentialsExpired = credentialsAreExpired(credentials, now);
  const credentialsExpiresAtValue = credentialsExpiresAt(credentials);
  const usableCredentials = credentialsExpired ? null : credentials;
  const delegateKey =
    stringValue(env.ONEMEM_DELEGATE_KEY) ?? credString(usableCredentials, "delegateKey");
  const accountId =
    stringValue(env.ONEMEM_ACCOUNT_ID) ?? credString(usableCredentials, "accountId");
  const embeddingApiKey =
    stringValue(env.ONEMEM_EMBEDDING_API_KEY) ?? credString(usableCredentials, "embeddingApiKey");

  const missing = [
    !delegateKey ? "ONEMEM_DELEGATE_KEY" : null,
    !accountId ? "ONEMEM_ACCOUNT_ID" : null,
    !embeddingApiKey ? "ONEMEM_EMBEDDING_API_KEY" : null,
  ].filter((key): key is string => key !== null);

  if (!delegateKey || !accountId || !embeddingApiKey) {
    return {
      missing,
      credentialsFile: credentialsPath(env),
      credentialsLoaded: credentials !== null,
      credentialsExpired,
      credentialsExpiresAt: credentialsExpiresAtValue,
    };
  }

  return {
    config: {
      delegateKey,
      accountId,
      embeddingApiKey,
      memwalPackageId:
        stringValue(env.MEMWAL_PACKAGE_ID) ??
        credString(usableCredentials, "memwalPackageId") ??
        "",
      relayerUrl:
        stringValue(env.MEMWAL_RELAYER_URL) ??
        credString(usableCredentials, "relayerUrl", "serverUrl") ??
        DEFAULT_MEMWAL_RELAYER_URL,
      namespace:
        stringValue(env.ONEMEM_MEMWAL_NAMESPACE) ??
        credString(usableCredentials, "memwalNamespace", "namespace"),
    },
    missing: [],
    credentialsFile: credentialsPath(env),
    credentialsLoaded: credentials !== null,
    credentialsExpired,
    credentialsExpiresAt: credentialsExpiresAtValue,
  };
}

export function memoryConfigFromCredentials(
  env: NodeJS.ProcessEnv = process.env,
): MemoryConfig | undefined {
  return resolveMemoryConfigFromSources(env).config;
}
