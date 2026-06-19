export const TTL_OPTIONS = [
  { label: "1 hour", seconds: 3_600 },
  { label: "24 hours", seconds: 86_400 },
  { label: "30 days", seconds: 2_592_000 },
  { label: "90 days", seconds: 7_776_000 },
] as const;

export type PairingStatus =
  | "idle"
  | "loading-account"
  | "creating-account"
  | "generating-delegate"
  | "registering-delegate"
  | "posting-callback"
  | "paired";

const RUNNING_STATUSES = new Set<PairingStatus>([
  "creating-account",
  "generating-delegate",
  "registering-delegate",
  "posting-callback",
]);

export function isPairingRunning(status: PairingStatus): boolean {
  return RUNNING_STATUSES.has(status);
}

export function pairingStatusMessage({
  hasAccount,
  hasMemWalAccount,
  pairingUrlValid,
  status,
}: {
  hasAccount: boolean;
  hasMemWalAccount: boolean;
  pairingUrlValid: boolean;
  status: PairingStatus;
}): string {
  if (!pairingUrlValid) return "Open this page from `onemem login` so it includes nonce and port.";
  if (!hasAccount) return "Connect the wallet that should own the CLI delegate.";
  if (status === "loading-account") return "Looking up your MemWal account.";
  if (status === "creating-account") return "Creating a MemWal account with your wallet.";
  if (status === "generating-delegate") return "Generating a fresh CLI delegate key locally.";
  if (status === "registering-delegate") return "Registering the delegate public key on-chain.";
  if (status === "posting-callback") return "Sending the credential to your local CLI callback.";
  if (status === "paired") return "Pairing complete. Return to your terminal.";
  if (!hasMemWalAccount) return "No MemWal account found yet. Create one to continue.";
  return "Ready to mint and register a CLI delegate key.";
}
