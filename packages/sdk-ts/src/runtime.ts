// Runtime helpers for signer + network resolution and gas top-up, plus the
// memory + credentials + runtime-controls re-exports node consumers (CLI,
// plugins, providers) get from one node-only entry point.

import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import { OneMem, type SuiNetwork } from "./client.js";

export {
  CredentialsParseError,
  CredentialsPermissionError,
  credentialsAreExpired,
  credentialsExpiresAt,
  credentialsExpiryTimeMs,
  credentialsPath,
  DEFAULT_CREDENTIALS_FILE,
  DEFAULT_MEMWAL_RELAYER_URL,
  type MemoryConfigResolution,
  memoryConfigFromCredentials,
  type OneMemCredentials,
  readOnememCredentials,
  resolveMemoryConfigFromSources,
} from "./credentials.js";
export {
  DEFAULT_RUNTIME_CONTROLS_FILE,
  getRuntimeControl,
  listRuntimeControls,
  normalizeRuntimeId,
  type RuntimeControl,
  type RuntimeControlsFile,
  RuntimeControlsParseError,
  RuntimeControlsValidationError,
  type RuntimePermissionKey,
  type RuntimePermissions,
  readRuntimeControls,
  runtimeControlsPath,
  setRuntimeControl,
  setRuntimePaused,
  setRuntimePermission,
} from "./runtime-controls.js";
export {
  createMemoryRecorder,
  DEFAULT_RECALL_TOP_K,
  injectMemories,
  type MemoryRecorder,
  type MemoryRecorderOptions,
  memoryConfigFromEnv,
} from "./runtime-memory.js";
// Re-export so node consumers (CLI, plugins) get the client + runtime helpers
// from one node-only entry point (`@onemem/sdk-ts/runtime`).
export { OneMem };

export interface RuntimeLogger {
  info?: (msg: string) => void;
  warn?: (msg: string) => void;
}

const ONEMEM_DIR = join(homedir(), ".onemem");
const SECRET_FILE_MODE = 0o600;
const SECRET_DIR_MODE = 0o700;
const FAUCET_URLS: Partial<Record<string, string>> = {
  testnet: "https://faucet.testnet.sui.io/v2/gas",
};
const FAUCET_TIMEOUT_MS = 15_000;
const FAUCET_SETTLE_MS = 8_000;

function readJsonFile<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeJsonAtomic(path: string, value: unknown): void {
  mkdirSync(ONEMEM_DIR, { recursive: true, mode: SECRET_DIR_MODE });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2), { mode: SECRET_FILE_MODE });
  renameSync(tmp, path);
}

/** Resolve a signer: explicit key → sui keystore → generated+persisted wallet. */
export function resolveSigner(privateKey?: string, logger?: RuntimeLogger): Ed25519Keypair {
  if (privateKey) return Ed25519Keypair.fromSecretKey(privateKey);
  try {
    const path = join(homedir(), ".sui", "sui_config", "sui.keystore");
    const entries = JSON.parse(readFileSync(path, "utf8")) as string[];
    if (entries[0]) {
      return Ed25519Keypair.fromSecretKey(Buffer.from(entries[0], "base64").subarray(1));
    }
  } catch {
    // no keystore — fall through to a generated wallet
  }
  const walletFile = join(ONEMEM_DIR, "wallet.key");
  const persisted = readJsonFile<{ secretKey: string }>(walletFile);
  if (persisted?.secretKey) return Ed25519Keypair.fromSecretKey(persisted.secretKey);
  const kp = Ed25519Keypair.generate();
  writeJsonAtomic(walletFile, { secretKey: kp.getSecretKey(), address: kp.toSuiAddress() });
  logger?.info?.(
    `[onemem] generated signer wallet ${kp.toSuiAddress()} (persisted to ${walletFile})`,
  );
  return kp;
}

/** Best-effort testnet faucet top-up when the signer has no gas. */
export async function ensureGas(
  onemem: OneMem,
  address: string,
  network: string,
  logger?: RuntimeLogger,
): Promise<void> {
  const faucetUrl = FAUCET_URLS[network];
  if (!faucetUrl) return;
  try {
    const bal = await onemem.client.getBalance({ owner: address });
    if (BigInt(bal.totalBalance) > 0n) return;
    logger?.info?.(`[onemem] requesting ${network} gas for ${address}`);
    const res = await fetch(faucetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ FixedAmountRequest: { recipient: address } }),
      signal: AbortSignal.timeout(FAUCET_TIMEOUT_MS),
    });
    if (!res.ok) {
      logger?.warn?.(`[onemem] faucet HTTP ${res.status}`);
      return;
    }
    await new Promise((r) => setTimeout(r, FAUCET_SETTLE_MS));
  } catch (err) {
    logger?.warn?.(
      `[onemem] faucet request failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/** Resolve the network: explicit opt → validated $SUI_NETWORK → testnet. */
export function resolveNetwork(opt: SuiNetwork | undefined, logger?: RuntimeLogger): SuiNetwork {
  if (opt) return opt;
  const env = process.env.SUI_NETWORK;
  const valid = ["testnet", "mainnet", "devnet", "local"];
  if (env && valid.includes(env)) return env as SuiNetwork;
  if (env) logger?.warn?.(`[onemem] unknown SUI_NETWORK "${env}" — defaulting to testnet`);
  return "testnet";
}
