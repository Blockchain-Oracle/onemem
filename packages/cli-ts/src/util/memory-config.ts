// Build a MemoryConfig from env plus the login-created credentials file.
// Env wins field-by-field; ~/.onemem/credentials.json is the local fallback.

import type { MemoryConfig } from "@onemem/sdk-ts";
import { resolveMemoryConfigFromSources } from "@onemem/sdk-ts/runtime";

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
        `Env vars override ${credentialsFile}; run \`onemem login\` or update that file.`,
    );
    this.name = "MemoryNotConfiguredError";
  }
}

export function memoryConfigFromEnv(env: NodeJS.ProcessEnv = process.env): MemoryConfig {
  const resolved = resolveMemoryConfigFromSources(env);
  const missing = [...resolved.missing];
  if (!resolved.config?.memwalPackageId) missing.push("MEMWAL_PACKAGE_ID");
  if (!resolved.config || missing.length > 0) {
    throw new MemoryNotConfiguredError(missing, resolved.credentialsFile, {
      credentialsExpired: resolved.credentialsExpired,
      credentialsExpiresAt: resolved.credentialsExpiresAt,
    });
  }
  return resolved.config;
}
