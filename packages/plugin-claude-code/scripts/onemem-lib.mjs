// Shared helpers for the OneMem Claude Code hook scripts.
//
// Hooks run as separate short-lived processes, so session state (the OneMem
// TraceSession id for a given Claude session) is shared via a JSON file keyed
// by Claude's session_id. Everything here is DEFENSIVE: a OneMem failure must
// never break the user's Claude Code session, so callers always exit 0.

import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DEFAULT_STATE_DIR = join(homedir(), ".onemem", "cc-sessions");
const DEFAULT_RUNTIME_CONTROLS_FILE = join(homedir(), ".onemem", "runtime-controls.json");

export function stateDir() {
  const pluginData = process.env.CLAUDE_PLUGIN_DATA || process.env.PLUGIN_DATA;
  return pluginData ? join(pluginData, "sessions") : DEFAULT_STATE_DIR;
}

/** Read the hook event JSON that Claude Code pipes on stdin. */
export async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * OneMem config from env. Returns null if not enough to write traces — hooks
 * then no-op (so the plugin is inert until the user configures it).
 *   ONEMEM_PRIVATE_KEY   suiprivkey1... (else sui keystore fallback)
 *   ONEMEM_NAMESPACE_ID  OneMem MemoryNamespace object id
 *   ONEMEM_RW_CAP_ID     ReadWrite capability for that namespace
 *   SUI_NETWORK          testnet (default) | mainnet | ...
 */
export function loadConfig() {
  const namespaceId = process.env.ONEMEM_NAMESPACE_ID;
  const rwCapId = process.env.ONEMEM_RW_CAP_ID;
  if (!namespaceId || !rwCapId) return null;
  return {
    namespaceId,
    rwCapId,
    network: process.env.SUI_NETWORK ?? "testnet",
    privateKey: process.env.ONEMEM_PRIVATE_KEY,
  };
}

/** Build a signer from ONEMEM_PRIVATE_KEY or the first sui keystore key. */
async function loadSigner(privateKey) {
  const { Ed25519Keypair } = await import("@mysten/sui/keypairs/ed25519");
  if (privateKey) return Ed25519Keypair.fromSecretKey(privateKey);
  const path = join(homedir(), ".sui", "sui_config", "sui.keystore");
  const entries = JSON.parse(readFileSync(path, "utf8"));
  return Ed25519Keypair.fromSecretKey(Buffer.from(entries[0], "base64").subarray(1));
}

/** Create a OneMem client from config (or null on failure). */
export async function loadClient(config) {
  try {
    const { OneMem } = await import("@onemem/sdk-ts");
    const signer = await loadSigner(config.privateKey);
    return await OneMem.create({ network: config.network, signer });
  } catch {
    return null;
  }
}

function statePath(claudeSessionId) {
  return join(stateDir(), `${claudeSessionId}.json`);
}

export function readSessionState(claudeSessionId) {
  try {
    return JSON.parse(readFileSync(statePath(claudeSessionId), "utf8"));
  } catch {
    return null;
  }
}

export function writeSessionState(claudeSessionId, state) {
  mkdirSync(stateDir(), { recursive: true });
  writeFileSync(statePath(claudeSessionId), JSON.stringify(state), "utf8");
}

function bufferPath(claudeSessionId) {
  return join(stateDir(), `${claudeSessionId}.buffer.jsonl`);
}

export function clearSessionState(claudeSessionId) {
  try {
    rmSync(statePath(claudeSessionId));
  } catch {
    // best-effort cleanup
  }
}

/** Append one buffered tool call (instant; flushed on-chain at SessionEnd). */
export function bufferToolCall(claudeSessionId, call) {
  mkdirSync(stateDir(), { recursive: true });
  appendFileSync(bufferPath(claudeSessionId), `${JSON.stringify(call)}\n`, "utf8");
}

/** Read buffered tool calls without deleting them. */
export function readBufferedToolCalls(claudeSessionId) {
  let raw = "";
  try {
    raw = readFileSync(bufferPath(claudeSessionId), "utf8");
  } catch {
    return [];
  }
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function clearBufferedToolCalls(claudeSessionId) {
  try {
    rmSync(bufferPath(claudeSessionId));
  } catch {
    // best-effort cleanup
  }
}

/** Read + clear the buffered tool calls for a session. */
export function drainToolCalls(claudeSessionId) {
  const calls = readBufferedToolCalls(claudeSessionId);
  clearBufferedToolCalls(claudeSessionId);
  return calls;
}

export function runtimeControlsPath() {
  return process.env.ONEMEM_RUNTIME_CONTROLS_PATH || DEFAULT_RUNTIME_CONTROLS_FILE;
}

function normalizeRuntime(runtime) {
  return String(runtime || "").trim().toLowerCase();
}

export function traceCaptureEnabled(runtime) {
  const id = normalizeRuntime(runtime);
  if (!id) return false;
  try {
    const parsed = JSON.parse(readFileSync(runtimeControlsPath(), "utf8"));
    const control = parsed?.runtimes?.[id];
    const traceCapture = control?.permissions?.traceCapture;
    return control?.paused !== true && traceCapture !== false;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return true;
    }
    return false;
  }
}
