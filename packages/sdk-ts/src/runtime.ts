// Runtime helpers for plugin/CLI authors: signer resolution, namespace
// provisioning, runtime policy, and verifiable TraceSession recording.

import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import { OneMem } from "./client.js";
import type { SuiNetwork } from "./generated/addresses.js";
import { shouldTraceRuntime } from "./runtime-controls.js";
import { CallStatus, NamespaceKind, SessionStatus } from "./types/move.js";

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
  shouldTraceRuntime,
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

export interface ProvisionedTarget {
  namespaceId: string;
  rwCapId: string;
  /** Present for targets provisioned by recent `ensureNamespace()` versions. Older persisted targets may not have it. */
  adminCapId?: string;
}

/** A single buffered call to record as an ActionCall. */
export interface RuntimeCall {
  toolName: string;
  toolNamespace?: string;
  input?: unknown;
  output?: unknown;
}

const ONEMEM_DIR = join(homedir(), ".onemem");
const SECRET_FILE_MODE = 0o600;
const SECRET_DIR_MODE = 0o700;
const FAUCET_URLS: Partial<Record<string, string>> = {
  testnet: "https://faucet.testnet.sui.io/v2/gas",
};
const FAUCET_TIMEOUT_MS = 15_000;
const FAUCET_SETTLE_MS = 8_000;
const NAME_SUFFIX_BYTES = 4;
const ADDR_TAG_START = 2;
const ADDR_TAG_END = 10;

interface PersistedTarget extends ProvisionedTarget {
  network: string;
  address: string;
}

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
async function ensureGas(
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

/**
 * Resolve a trace target, provisioning + persisting one on first use. `label`
 * namespaces both the persisted file (`~/.onemem/<label>.<network>.json`) and
 * the on-chain namespace name, so different runtimes get distinct targets.
 */
export async function ensureNamespace(
  onemem: OneMem,
  opts: { network: SuiNetwork; label: string; logger?: RuntimeLogger },
): Promise<ProvisionedTarget> {
  const file = join(ONEMEM_DIR, `${opts.label}.${opts.network}.json`);
  const persisted = readJsonFile<PersistedTarget>(file);
  if (persisted?.namespaceId && persisted?.rwCapId) {
    return {
      namespaceId: persisted.namespaceId,
      rwCapId: persisted.rwCapId,
      adminCapId: persisted.adminCapId,
    };
  }
  const address = onemem.signer.toSuiAddress();
  await ensureGas(onemem, address, opts.network, opts.logger);
  opts.logger?.info?.(`[onemem] provisioning a namespace + ReadWrite cap for "${opts.label}"`);
  const suffix = randomBytes(NAME_SUFFIX_BYTES).toString("hex");
  const ns = await onemem.namespaces.create({
    name: `${opts.label}-${address.slice(ADDR_TAG_START, ADDR_TAG_END)}-${suffix}`,
    kind: NamespaceKind.Shared,
    sealPackageId: onemem.addresses.packageId,
  });
  const cap = await onemem.namespaces.shareReadWrite({
    namespaceId: ns.namespaceId,
    adminCapId: ns.adminCapId,
    recipient: address,
  });
  const target: ProvisionedTarget = {
    namespaceId: ns.namespaceId,
    rwCapId: cap.capId,
    adminCapId: ns.adminCapId,
  };
  writeJsonAtomic(file, { ...target, network: opts.network, address } satisfies PersistedTarget);
  opts.logger?.info?.(
    `[onemem] provisioned namespace ${target.namespaceId} (persisted to ${file})`,
  );
  return target;
}

/**
 * Record a buffered batch of calls as ONE verifiable TraceSession: startSession
 * → Merkle-chained appendCall/closeCall (content stored on Walrus, Seal-encrypted)
 * → endSession. Returns the on-chain session id.
 */
export interface RecordSessionResult {
  sessionId: string;
  /** The emitted ActionCall ids, in call order (one per input call) — hand one to a sub-runtime as its `parentCallId` to stitch traces across runtimes. */
  readonly callIds: readonly string[];
}

export async function recordSession(
  onemem: OneMem,
  args: {
    target: ProvisionedTarget;
    agentId: string;
    environment: string;
    calls: RuntimeCall[];
    sdkVersion?: string;
    /** Seed the FIRST call's parent with a call id from another runtime's session (same namespace) to stitch cross-runtime traces. */
    parentCallId?: string | null;
  },
): Promise<RecordSessionResult> {
  const { target } = args;
  const session = await onemem.traces.startSession({
    namespaceId: target.namespaceId,
    rwCapId: target.rwCapId,
    agentId: args.agentId,
    environment: args.environment,
    sdkVersion: args.sdkVersion ?? "0.1.0",
  });
  const enc = (v: unknown) =>
    new TextEncoder().encode(typeof v === "string" ? v : JSON.stringify(v ?? ""));
  // Seed from an external (cross-runtime) parent call when provided; thereafter
  // each call chains off the previous one in THIS session.
  let parentCallId: string | null = args.parentCallId ?? null;
  const callIds: string[] = [];
  try {
    for (const call of args.calls) {
      const emitted = await onemem.traces.appendCall({
        sessionId: session.sessionId,
        namespaceId: target.namespaceId,
        rwCapId: target.rwCapId,
        parentCallId,
        toolName: call.toolName,
        toolNamespace: call.toolNamespace ?? args.environment,
        input: { content: enc(call.input), encrypt: true },
      });
      await onemem.traces.closeCall({
        sessionId: session.sessionId,
        rwCapId: target.rwCapId,
        namespaceId: target.namespaceId,
        callId: emitted.callId,
        output: { content: enc(call.output), encrypt: true },
        status: CallStatus.Success,
      });
      parentCallId = emitted.callId;
      callIds.push(emitted.callId);
    }
  } catch (err) {
    // A mid-loop failure (e.g. a Walrus flake) would otherwise leave the session
    // open forever. Mark it Failed so the on-chain record is self-describing,
    // then rethrow so the caller knows the trace is incomplete.
    await onemem.traces
      .endSession({
        sessionId: session.sessionId,
        rwCapId: target.rwCapId,
        status: SessionStatus.Failed,
      })
      .catch(() => {});
    throw err;
  }
  await onemem.traces.endSession({
    sessionId: session.sessionId,
    rwCapId: target.rwCapId,
    status: SessionStatus.Completed,
  });
  return { sessionId: session.sessionId, callIds };
}

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/** Resolve the network: explicit opt → validated $SUI_NETWORK → testnet. */
export function resolveNetwork(opt: SuiNetwork | undefined, logger?: RuntimeLogger): SuiNetwork {
  if (opt) return opt;
  const env = process.env.SUI_NETWORK;
  const valid = ["testnet", "mainnet", "devnet", "local"];
  if (env && valid.includes(env)) return env as SuiNetwork;
  if (env) logger?.warn?.(`[onemem] unknown SUI_NETWORK "${env}" — defaulting to testnet`);
  return "testnet";
}

export interface TraceRecorderOptions {
  agentId?: string;
  environment?: string;
  network?: SuiNetwork;
  privateKey?: string;
  /** Explicit target; else $ONEMEM_NAMESPACE_ID/$ONEMEM_RW_CAP_ID; else auto-provisioned. */
  target?: ProvisionedTarget;
  /** Namespace label for auto-provisioning (default = agentId). */
  label?: string;
  /** Disable recording (default on). */
  enableTrace?: boolean;
  onTrace?: (sessionId: string) => void;
  /** Defaults to console.warn so a silent-stop is visible; pass {} to silence. */
  logger?: RuntimeLogger;
}

export interface TraceRecorder {
  /** Fire-and-forget: record these calls as ONE verifiable TraceSession. Never throws. */
  record(calls: RuntimeCall[]): void;
  readonly enabled: boolean;
}

/**
 * Shared trace recorder used by the framework providers and runtime plugins:
 * lazily + once provisions the signer/namespace (memoized, reset-on-reject) and
 * records buffered calls as one TraceSession off the caller's critical path —
 * a OneMem failure never breaks or slows the host.
 */
export function createTraceRecorder(opts: TraceRecorderOptions = {}): TraceRecorder {
  const logger: RuntimeLogger = opts.logger ?? { warn: (m) => console.warn(m) };
  const agentId = opts.agentId ?? "onemem";
  const environment = opts.environment ?? agentId;
  const label = opts.label ?? agentId;
  const network = resolveNetwork(opts.network, logger);
  const enabled = opts.enableTrace !== false;

  let clientPromise: Promise<OneMem> | null = null;
  let targetPromise: Promise<ProvisionedTarget | null> | null = null;

  function getClient(): Promise<OneMem> {
    if (!clientPromise) {
      const p = OneMem.create({ network, signer: resolveSigner(opts.privateKey, logger) });
      clientPromise = p;
      p.catch(() => {
        if (clientPromise === p) clientPromise = null;
      });
    }
    return clientPromise;
  }

  function getTarget(client: OneMem): Promise<ProvisionedTarget | null> {
    if (!targetPromise) {
      const p = (async () => {
        if (opts.target) return opts.target;
        const ns = process.env.ONEMEM_NAMESPACE_ID;
        const cap = process.env.ONEMEM_RW_CAP_ID;
        if (ns && cap) return { namespaceId: ns, rwCapId: cap };
        return ensureNamespace(client, { network, label, logger });
      })();
      targetPromise = p;
      p.catch(() => {
        if (targetPromise === p) targetPromise = null;
      });
    }
    return targetPromise;
  }

  function record(calls: RuntimeCall[]): void {
    if (!enabled || calls.length === 0) return;
    try {
      if (!shouldTraceRuntime(environment)) {
        logger.info?.(`[onemem] trace skipped by runtime controls for ${environment}`);
        return;
      }
    } catch (err) {
      logger.warn?.(`[onemem] trace skipped: runtime controls unreadable: ${errMsg(err)}`);
      return;
    }
    void (async () => {
      try {
        const client = await getClient();
        const target = await getTarget(client);
        if (!target) return;
        const { sessionId } = await recordSession(client, { target, agentId, environment, calls });
        logger.info?.(`[onemem] verifiable trace ${sessionId}`);
        try {
          opts.onTrace?.(sessionId);
        } catch (cbErr) {
          logger.warn?.(`[onemem] onTrace callback threw: ${errMsg(cbErr)}`);
        }
      } catch (err) {
        logger.warn?.(`[onemem] trace failed: ${errMsg(err)}`);
      }
    })();
  }

  return { record, enabled };
}
