// Build a MemoryConfig from env plus the login-created credentials file.
// Env wins field-by-field; ~/.onemem/credentials.json is the local fallback.

import type { MemoryConfig } from "@onemem/sdk-ts";
import {
  credentialsPath,
  type OneMemCredentials,
  readOnememCredentials,
  resolveMemoryConfigFromSources,
} from "@onemem/sdk-ts/runtime";

export class MemoryNotConfiguredError extends Error {
  constructor(
    missing: string[],
    credentialsFile: string,
    opts: { credentialsExpired?: boolean; credentialsExpiresAt?: string | null } = {},
  ) {
    const missingText = missing.length > 0 ? `set: ${missing.join(", ")}. ` : "";
    const expiryText = opts.credentialsExpired
      ? `Credentials in ${credentialsFile} expired${
          opts.credentialsExpiresAt ? ` at ${opts.credentialsExpiresAt}` : ""
        }. `
      : "";
    super(
      `memory is not configured — ${missingText}${expiryText}` +
        "Run `onemem login` for delegate/account credentials, and set any remaining " +
        `MemWal secrets in env or ${credentialsFile}. Env vars override saved credentials.`,
    );
    this.name = "MemoryNotConfiguredError";
  }
}

function credentialString(
  credentials: OneMemCredentials | null,
  ...keys: Array<keyof OneMemCredentials>
): string | undefined {
  for (const key of keys) {
    const value = credentials?.[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function hasEnvValue(env: NodeJS.ProcessEnv, key: string): boolean {
  return typeof env[key] === "string" && env[key]?.length > 0;
}

export function memoryConfigFromEnv(env: NodeJS.ProcessEnv = process.env): MemoryConfig {
  const path = credentialsPath(env);
  const credentials = readOnememCredentials(path);
  const resolved = resolveMemoryConfigFromSources(env, credentials);
  const usableCredentials = resolved.credentialsExpired ? null : credentials;
  const missing = [...resolved.missing];
  if (
    !hasEnvValue(env, "MEMWAL_PACKAGE_ID") &&
    !credentialString(usableCredentials, "memwalPackageId")
  ) {
    missing.push("MEMWAL_PACKAGE_ID");
  }
  if (!resolved.config || missing.length > 0) {
    throw new MemoryNotConfiguredError(missing, resolved.credentialsFile, {
      credentialsExpired: resolved.credentialsExpired,
      credentialsExpiresAt: resolved.credentialsExpiresAt,
    });
  }
  return resolved.config;
}
