import {
  CredentialsParseError,
  CredentialsPermissionError,
  credentialsPath,
  type OneMemCredentials,
  readOnememCredentials,
  resolveMemoryConfigFromSources,
} from "@onemem/sdk-ts/runtime";

export type LocalCredentialStatus = "configured" | "partial" | "missing" | "expired" | "error";
export type LocalCredentialLifecycle =
  | "active"
  | "expiring-soon"
  | "expired"
  | "unknown"
  | "not-found"
  | "error";

export interface LocalCredentialSummary {
  status: LocalCredentialStatus;
  delegateStatus: LocalCredentialLifecycle;
  credentialsFile: string;
  error: string | null;
  missing: readonly string[];
  delegateLabel: string | null;
  delegateTtlSeconds: number | null;
  accountId: string | null;
  suiAddress: string | null;
  delegatePublicKey: string | null;
  activeNamespaceId: string | null;
  agentId: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  expiresInDays: number | null;
  sdkVersion: string | null;
  memwalPackageId: string | null;
  relayerUrl: string | null;
  namespace: string | null;
}

const EXPIRING_SOON_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function stringField(credentials: OneMemCredentials | null, key: keyof OneMemCredentials) {
  const value = credentials?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function numberField(credentials: OneMemCredentials | null, key: keyof OneMemCredentials) {
  const value = credentials?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function lifecycleStatus(
  credentials: OneMemCredentials | null,
  now: Date,
): Pick<LocalCredentialSummary, "delegateStatus" | "expiresInDays"> {
  if (!credentials) return { delegateStatus: "not-found", expiresInDays: null };
  const expiresAt = stringField(credentials, "expiresAt");
  if (!expiresAt) return { delegateStatus: "unknown", expiresInDays: null };
  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) return { delegateStatus: "unknown", expiresInDays: null };

  const remainingMs = expiresAtMs - now.getTime();
  const expiresInDays = Math.ceil(remainingMs / DAY_MS);
  if (remainingMs <= 0) return { delegateStatus: "expired", expiresInDays };
  if (remainingMs <= EXPIRING_SOON_MS) return { delegateStatus: "expiring-soon", expiresInDays };
  return { delegateStatus: "active", expiresInDays };
}

function errorMessage(error: unknown): string {
  if (error instanceof CredentialsPermissionError) {
    return "Credentials file permissions are unsafe. Run chmod 600 on the file.";
  }
  if (error instanceof CredentialsParseError) {
    return "Credentials file is not valid OneMem JSON.";
  }
  return error instanceof Error ? error.message : String(error);
}

export function localCredentialSummary(
  env: NodeJS.ProcessEnv = process.env,
  now: Date = new Date(),
): LocalCredentialSummary {
  const file = credentialsPath(env);
  try {
    const credentials = readOnememCredentials(file);
    const resolved = resolveMemoryConfigFromSources(env, credentials, now);
    const cfg = resolved.config;
    // MEMWAL_PACKAGE_ID is enforced as a required secret by the resolver, so it
    // is already in `resolved.missing` when absent — don't append it again.
    const missing = resolved.missing;
    const lifecycle = lifecycleStatus(credentials, now);
    const status: LocalCredentialStatus =
      credentials === null
        ? "missing"
        : resolved.credentialsExpired && missing.length > 0
          ? "expired"
          : missing.length > 0
            ? "partial"
            : "configured";

    return {
      status,
      delegateStatus: lifecycle.delegateStatus,
      credentialsFile: file,
      error: null,
      missing,
      delegateLabel: stringField(credentials, "delegateLabel"),
      delegateTtlSeconds: numberField(credentials, "delegateTtlSeconds"),
      accountId:
        cfg?.accountId ??
        (resolved.credentialsExpired
          ? (env.ONEMEM_ACCOUNT_ID ?? null)
          : (stringField(credentials, "accountId") ?? env.ONEMEM_ACCOUNT_ID ?? null)),
      suiAddress: stringField(credentials, "suiAddress"),
      delegatePublicKey: stringField(credentials, "delegatePublicKey"),
      activeNamespaceId:
        stringField(credentials, "activeNamespaceId") ?? env.ONEMEM_NAMESPACE_ID ?? null,
      agentId: stringField(credentials, "agentId"),
      createdAt: stringField(credentials, "createdAt"),
      expiresAt: stringField(credentials, "expiresAt"),
      expiresInDays: lifecycle.expiresInDays,
      sdkVersion: stringField(credentials, "sdkVersion"),
      memwalPackageId:
        cfg?.memwalPackageId ||
        (resolved.credentialsExpired ? null : stringField(credentials, "memwalPackageId")),
      relayerUrl: cfg?.relayerUrl ?? null,
      namespace: cfg?.namespace ?? null,
    };
  } catch (error) {
    return {
      status: "error",
      delegateStatus: "error",
      credentialsFile: file,
      error: errorMessage(error),
      missing: [],
      delegateLabel: null,
      delegateTtlSeconds: null,
      accountId: null,
      suiAddress: null,
      delegatePublicKey: null,
      activeNamespaceId: env.ONEMEM_NAMESPACE_ID ?? null,
      agentId: null,
      createdAt: null,
      expiresAt: null,
      expiresInDays: null,
      sdkVersion: null,
      memwalPackageId: null,
      relayerUrl: null,
      namespace: null,
    };
  }
}
