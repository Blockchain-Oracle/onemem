// Shared helpers for the OneMem Claude Code hook scripts.
//
// Hooks run as separate short-lived processes. Everything here is DEFENSIVE: a
// OneMem failure must never break the user's Claude Code session, so callers
// always exit 0. The hooks capture readable tool observations to the local
// OneMem worker (127.0.0.1:4041); the worker streams them to the dashboard.

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const DEFAULT_RUNTIME_CONTROLS_FILE = join(homedir(), ".onemem", "runtime-controls.json");
const DEFAULT_WORKER_URL = "http://127.0.0.1:4041";
const PREVIEW_LIMIT = 2_000;

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
