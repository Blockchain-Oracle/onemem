import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { ONEMEM_DIR } from "./credentials.js";

export const DEFAULT_RUNTIME_CONTROLS_FILE = join(ONEMEM_DIR, "runtime-controls.json");
const RUNTIME_CONTROLS_VERSION = 1;
const PRIVATE_FILE_MODE = 0o600;
const PRIVATE_DIR_MODE = 0o700;
const RUNTIME_ID_RE = /^[a-z0-9][a-z0-9._-]{0,79}$/;

export type RuntimePermissionKey = "captureEnabled";

export interface RuntimePermissions {
  readonly captureEnabled: boolean;
}

export interface RuntimeControl {
  readonly runtime: string;
  readonly paused: boolean;
  readonly permissions: RuntimePermissions;
  readonly updatedAt: string | null;
}

interface StoredRuntimeControl {
  readonly paused?: unknown;
  readonly permissions?: Record<string, unknown>;
  readonly updatedAt?: unknown;
}

export interface RuntimeControlsFile {
  readonly version: number;
  readonly runtimes: Record<string, StoredRuntimeControl>;
}

export class RuntimeControlsParseError extends Error {
  constructor(
    readonly path: string,
    options?: ErrorOptions,
  ) {
    super(`could not parse ${path} as OneMem runtime controls JSON`, options);
    this.name = "RuntimeControlsParseError";
  }
}

export class RuntimeControlsValidationError extends Error {
  constructor(readonly runtime: string) {
    super(`invalid OneMem runtime id: ${runtime}`);
    this.name = "RuntimeControlsValidationError";
  }
}

export function runtimeControlsPath(env: NodeJS.ProcessEnv = process.env): string {
  return env.ONEMEM_RUNTIME_CONTROLS_PATH || DEFAULT_RUNTIME_CONTROLS_FILE;
}

export function normalizeRuntimeId(runtime: string): string {
  const normalized = runtime.trim().toLowerCase();
  if (!RUNTIME_ID_RE.test(normalized)) {
    throw new RuntimeControlsValidationError(runtime);
  }
  return normalized;
}

function emptyControls(): RuntimeControlsFile {
  return { version: RUNTIME_CONTROLS_VERSION, runtimes: {} };
}

function normalizeControl(runtime: string, stored?: StoredRuntimeControl): RuntimeControl {
  const permissions = stored?.permissions ?? {};
  const captureEnabled =
    typeof permissions.captureEnabled === "boolean" ? permissions.captureEnabled : true;
  return {
    runtime,
    paused: stored?.paused === true,
    permissions: { captureEnabled },
    updatedAt: typeof stored?.updatedAt === "string" ? stored.updatedAt : null,
  };
}

function storedFromControl(control: RuntimeControl): StoredRuntimeControl {
  return {
    paused: control.paused,
    permissions: { captureEnabled: control.permissions.captureEnabled },
    updatedAt: control.updatedAt,
  };
}

function readFile(path: string): RuntimeControlsFile {
  try {
    statSync(path);
  } catch {
    return emptyControls();
  }
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<RuntimeControlsFile>;
    return {
      version: typeof parsed.version === "number" ? parsed.version : RUNTIME_CONTROLS_VERSION,
      runtimes:
        parsed.runtimes && typeof parsed.runtimes === "object" && !Array.isArray(parsed.runtimes)
          ? parsed.runtimes
          : {},
    };
  } catch (error) {
    throw new RuntimeControlsParseError(path, { cause: error });
  }
}

function writeFile(path: string, value: RuntimeControlsFile): void {
  mkdirSync(dirname(path), { recursive: true, mode: PRIVATE_DIR_MODE });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2), { mode: PRIVATE_FILE_MODE });
  renameSync(tmp, path);
}

export function readRuntimeControls(path = runtimeControlsPath()): RuntimeControlsFile {
  return readFile(path);
}

export function listRuntimeControls(path = runtimeControlsPath()): RuntimeControl[] {
  const file = readFile(path);
  return Object.entries(file.runtimes)
    .map(([runtime, control]) => normalizeControl(runtime, control))
    .sort((a, b) => a.runtime.localeCompare(b.runtime));
}

export function getRuntimeControl(runtime: string, path = runtimeControlsPath()): RuntimeControl {
  const id = normalizeRuntimeId(runtime);
  return normalizeControl(id, readFile(path).runtimes[id]);
}

export function setRuntimeControl(
  runtime: string,
  patch: {
    readonly paused?: boolean;
    readonly permissions?: Partial<RuntimePermissions>;
  },
  path = runtimeControlsPath(),
): RuntimeControl {
  const id = normalizeRuntimeId(runtime);
  const file = readFile(path);
  const current = normalizeControl(id, file.runtimes[id]);
  const next: RuntimeControl = {
    runtime: id,
    paused: patch.paused ?? current.paused,
    permissions: {
      captureEnabled: patch.permissions?.captureEnabled ?? current.permissions.captureEnabled,
    },
    updatedAt: new Date().toISOString(),
  };
  writeFile(path, {
    version: RUNTIME_CONTROLS_VERSION,
    runtimes: {
      ...file.runtimes,
      [id]: storedFromControl(next),
    },
  });
  return next;
}

export function setRuntimePaused(
  runtime: string,
  paused: boolean,
  path = runtimeControlsPath(),
): RuntimeControl {
  return setRuntimeControl(runtime, { paused }, path);
}

export function setRuntimePermission(
  runtime: string,
  key: RuntimePermissionKey,
  value: boolean,
  path = runtimeControlsPath(),
): RuntimeControl {
  return setRuntimeControl(runtime, { permissions: { [key]: value } }, path);
}

export function shouldCaptureRuntime(runtime: string, path = runtimeControlsPath()): boolean {
  const control = getRuntimeControl(runtime, path);
  return !control.paused && control.permissions.captureEnabled;
}
