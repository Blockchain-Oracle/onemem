// Build a MemoryConfig from env plus the login-created credentials file.
// Env wins field-by-field; ~/.onemem/credentials.json is the local fallback.

import type { MemoryConfig } from "@onemem/sdk-ts";
import {
  credentialsPath,
  readOnememCredentials,
  resolveMemoryConfigFromSources,
} from "@onemem/sdk-ts/runtime";

export class MemoryNotConfiguredError extends Error {
  constructor(
    missing: readonly string[],
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

export function memoryConfigFromEnv(env: NodeJS.ProcessEnv = process.env): MemoryConfig {
  const path = credentialsPath(env);
  const credentials = readOnememCredentials(path);
  const resolved = resolveMemoryConfigFromSources(env, credentials);
  // MEMWAL_PACKAGE_ID is enforced as a required secret by the resolver — it is
  // already included in `resolved.missing` when absent.
  if (!resolved.config || resolved.missing.length > 0) {
    throw new MemoryNotConfiguredError(resolved.missing, resolved.credentialsFile, {
      credentialsExpired: resolved.credentialsExpired,
      credentialsExpiresAt: resolved.credentialsExpiresAt,
    });
  }
  return resolved.config;
}
