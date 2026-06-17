import { appendFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DEFAULT_DATA_DIR = join(homedir(), ".onemem", "codex-plugin");
const DEFAULT_RUNTIME_CONTROLS_FILE = join(homedir(), ".onemem", "runtime-controls.json");

export async function readHookInput(stdin = process.stdin) {
  const chunks = [];
  for await (const chunk of stdin) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeCodexOutput(payload = { continue: true }) {
  process.stdout.write(JSON.stringify(payload));
}

export function codexOutput(additionalContext) {
  if (!additionalContext) return { continue: true };
  return {
    continue: true,
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext,
    },
  };
}

export function dataDir() {
  return process.env.PLUGIN_DATA || process.env.CLAUDE_PLUGIN_DATA || DEFAULT_DATA_DIR;
}

function safeSessionId(sessionId) {
  return String(sessionId || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function sessionIdFromInput(input) {
  return input?.session_id || input?.sessionId || input?.conversation_id || null;
}

export function stateDir() {
  return join(dataDir(), "sessions");
}

export function statePath(sessionId) {
  return join(stateDir(), `${safeSessionId(sessionId)}.json`);
}

export function bufferPath(sessionId) {
  return join(stateDir(), `${safeSessionId(sessionId)}.buffer.jsonl`);
}

export function tracePayloadPath(sessionId) {
  return join(stateDir(), `${safeSessionId(sessionId)}.trace-payload.json`);
}

export function readSessionState(sessionId) {
  try {
    return JSON.parse(readFileSync(statePath(sessionId), "utf8"));
  } catch {
    return null;
  }
}

export function writeSessionState(sessionId, state) {
  mkdirSync(stateDir(), { recursive: true });
  writeFileSync(statePath(sessionId), JSON.stringify(state), "utf8");
}

export function clearSessionState(sessionId) {
  try {
    rmSync(statePath(sessionId));
  } catch {
    // best-effort cleanup
  }
}

export function bufferToolCall(sessionId, call) {
  mkdirSync(stateDir(), { recursive: true });
  appendFileSync(bufferPath(sessionId), `${JSON.stringify(call)}\n`, "utf8");
}

export function readBufferedToolCalls(sessionId) {
  try {
    return readFileSync(bufferPath(sessionId), "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

export function drainToolCalls(sessionId) {
  const calls = readBufferedToolCalls(sessionId);
  clearBufferedToolCalls(sessionId);
  return calls;
}

export function clearBufferedToolCalls(sessionId) {
  try {
    rmSync(bufferPath(sessionId));
  } catch {
    // best-effort cleanup
  }
}

export function loadTraceConfig() {
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

export function toolOutputFromInput(input) {
  return input?.tool_output ?? input?.tool_response ?? input?.tool_result ?? null;
}

export function toolSucceeded(call) {
  const out = call.toolResponse;
  if (out && typeof out === "object") {
    const exitCode = out.exit_code ?? out.exitCode ?? out.code;
    if (typeof exitCode === "number") return exitCode === 0;
    if (typeof out.success === "boolean") return out.success;
    if (typeof out.ok === "boolean") return out.ok;
  }
  return !call.toolError;
}
