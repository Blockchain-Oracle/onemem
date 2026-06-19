import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DEFAULT_RUNTIME_CONTROLS_FILE = join(homedir(), ".onemem", "runtime-controls.json");
const DEFAULT_WORKER_URL = "http://127.0.0.1:4041";
const PREVIEW_LIMIT = 2_000;

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

export function sessionIdFromInput(input) {
  return input?.session_id || input?.sessionId || input?.conversation_id || null;
}

export function workerUrl() {
  return (process.env.ONEMEM_WORKER_URL || DEFAULT_WORKER_URL).replace(/\/+$/, "");
}

export async function postWorker(path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 800);
  try {
    const res = await fetch(`${workerUrl()}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function workerHealthy() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300);
  try {
    const res = await fetch(`${workerUrl()}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function ensureWorker() {
  if (await workerHealthy()) return true;
  if (process.env.ONEMEM_WORKER_AUTOSTART === "0") return false;
  try {
    const command = process.env.ONEMEM_WORKER_COMMAND || "onemem-worker";
    const child = spawn(command, [], {
      detached: true,
      shell: true,
      stdio: "ignore",
      env: process.env,
    });
    child.unref();
  } catch {
    return false;
  }
  const deadline = Date.now() + 2_500;
  while (Date.now() < deadline) {
    if (await workerHealthy()) return true;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return false;
}

export function preview(value) {
  if (value == null) return null;
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > PREVIEW_LIMIT ? `${text.slice(0, PREVIEW_LIMIT)}…` : text;
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
