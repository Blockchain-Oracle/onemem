export interface HostedProvisioningState {
  readonly suiAddress: string;
  readonly network: string;
  readonly namespaceId: string;
  readonly adminCapId: string;
  readonly rwCapId: string;
  readonly namespaceDigest: string;
  readonly rwCapDigest: string;
  readonly updatedAt: string;
}

const PROVISIONING_STATE_KEY = "onemem.hosted.provisioning.v1";

function hasBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function normalizeAddress(value: string): string {
  return value.toLowerCase();
}

export function saveHostedProvisioningState(
  state: Omit<HostedProvisioningState, "updatedAt">,
): void {
  if (!hasBrowserStorage()) return;
  const next: HostedProvisioningState = { ...state, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(PROVISIONING_STATE_KEY, JSON.stringify(next));
}

export function loadHostedProvisioningState(
  suiAddress?: string | null,
  network?: string | null,
): HostedProvisioningState | null {
  if (!hasBrowserStorage()) return null;
  const raw = window.localStorage.getItem(PROVISIONING_STATE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<HostedProvisioningState>;
    if (
      typeof parsed.suiAddress !== "string" ||
      typeof parsed.network !== "string" ||
      typeof parsed.namespaceId !== "string" ||
      typeof parsed.adminCapId !== "string" ||
      typeof parsed.rwCapId !== "string" ||
      typeof parsed.namespaceDigest !== "string" ||
      typeof parsed.rwCapDigest !== "string" ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    if (suiAddress && normalizeAddress(parsed.suiAddress) !== normalizeAddress(suiAddress)) {
      return null;
    }
    if (network && parsed.network !== network) {
      return null;
    }
    return parsed as HostedProvisioningState;
  } catch {
    return null;
  }
}
