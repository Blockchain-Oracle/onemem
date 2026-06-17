import {
  getRuntimeControl,
  listRuntimeControls,
  type RuntimeControl,
  type RuntimePermissions,
  runtimeControlsPath,
  setRuntimeControl,
} from "@onemem/sdk-ts/runtime";
import { fetchRecentSessions } from "@/lib/trace";

const ONLINE_MS = 15 * 60 * 1000;
const IDLE_MS = 24 * 60 * 60 * 1000;

export type RuntimeControlCoverage = "enforced" | "stored";

interface RuntimeMetadata {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly installCommand: string;
  readonly coverage: RuntimeControlCoverage;
}

const KNOWN_RUNTIMES: readonly RuntimeMetadata[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    icon: "bolt",
    installCommand:
      "claude plugin marketplace add Blockchain-Oracle/onemem && claude plugin install onemem@onemem",
    coverage: "enforced",
  },
  {
    id: "codex",
    name: "Codex",
    icon: "bolt",
    installCommand:
      "codex plugin marketplace add Blockchain-Oracle/onemem --json && codex plugin add onemem-codex@onemem --json",
    coverage: "enforced",
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    icon: "branch",
    installCommand: "openclaw plugins install @onemem/oc-onemem && npx @onemem/oc-onemem init",
    coverage: "enforced",
  },
  {
    id: "hermes",
    name: "Hermes",
    icon: "cube",
    installCommand: "pip install hermes-onemem",
    coverage: "enforced",
  },
  {
    id: "crewai",
    name: "CrewAI",
    icon: "branch",
    installCommand: "pip install onemem-crewai",
    coverage: "enforced",
  },
  {
    id: "livekit",
    name: "LiveKit",
    icon: "apps",
    installCommand: "pip install onemem-livekit",
    coverage: "enforced",
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    icon: "apps",
    installCommand: "pip install onemem-elevenlabs",
    coverage: "enforced",
  },
  {
    id: "vercel-ai",
    name: "Vercel AI",
    icon: "bolt",
    installCommand: "npm i @onemem/vercel-ai-provider",
    coverage: "enforced",
  },
  {
    id: "openai-agents",
    name: "OpenAI Agents",
    icon: "bolt",
    installCommand: "npm i @onemem/openai-agents",
    coverage: "enforced",
  },
];

const METADATA = new Map(KNOWN_RUNTIMES.map((runtime) => [runtime.id, runtime]));

export interface RuntimeRow {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly installCommand: string | null;
  readonly sessions: number;
  readonly lastMs: number;
  readonly statusClass: string;
  readonly statusLabel: string;
  readonly paused: boolean;
  readonly traceCapture: boolean;
  readonly coverage: RuntimeControlCoverage;
}

export interface RuntimeInventory {
  readonly controlsFile: string;
  readonly traceError: string | null;
  readonly runtimes: RuntimeRow[];
}

function statusOf(lastMs: number, now: number): { cls: string; label: string } {
  if (!lastMs) return { cls: "sdot-offline", label: "no sessions" };
  const age = now - lastMs;
  if (age < ONLINE_MS) return { cls: "sdot-online", label: "active now" };
  if (age < IDLE_MS) return { cls: "sdot-idle", label: "active today" };
  const days = Math.max(1, Math.floor(age / (24 * 60 * 60 * 1000)));
  return { cls: "sdot-offline", label: `${days}d ago` };
}

function unknownMetadata(id: string): RuntimeMetadata {
  return {
    id,
    name: id,
    icon: "cube",
    installCommand: "",
    coverage: "stored",
  };
}

function rowFor(
  id: string,
  stats: { count: number; lastMs: number } | undefined,
  control: RuntimeControl,
  now: number,
): RuntimeRow {
  const meta = METADATA.get(id) ?? unknownMetadata(id);
  const status = control.paused
    ? { cls: "sdot-offline", label: "paused" }
    : control.permissions.traceCapture
      ? statusOf(stats?.lastMs ?? 0, now)
      : { cls: "sdot-offline", label: "trace off" };
  return {
    id,
    name: meta.name,
    icon: meta.icon,
    installCommand: meta.installCommand || null,
    sessions: stats?.count ?? 0,
    lastMs: stats?.lastMs ?? 0,
    statusClass: status.cls,
    statusLabel: status.label,
    paused: control.paused,
    traceCapture: control.permissions.traceCapture,
    coverage: meta.coverage,
  };
}

export async function fetchRuntimeInventory(): Promise<RuntimeInventory> {
  const now = Date.now();
  const byRuntime = new Map<string, { count: number; lastMs: number }>();
  let traceError: string | null = null;

  try {
    for (const session of await fetchRecentSessions(100)) {
      const id = (session.environment || session.agentId || "unknown").trim().toLowerCase();
      const prev = byRuntime.get(id) ?? { count: 0, lastMs: 0 };
      byRuntime.set(id, {
        count: prev.count + 1,
        lastMs: Math.max(prev.lastMs, session.openedAtMs),
      });
    }
  } catch (error) {
    traceError = error instanceof Error ? error.message : String(error);
  }

  const controls = new Map(listRuntimeControls().map((control) => [control.runtime, control]));
  const ids = new Set<string>([
    ...KNOWN_RUNTIMES.map((runtime) => runtime.id),
    ...byRuntime.keys(),
    ...controls.keys(),
  ]);

  const runtimes = [...ids]
    .map((id) => rowFor(id, byRuntime.get(id), controls.get(id) ?? getRuntimeControl(id), now))
    .sort((a, b) => {
      if (b.sessions !== a.sessions) return b.sessions - a.sessions;
      return a.name.localeCompare(b.name);
    });

  return {
    controlsFile: runtimeControlsPath(),
    traceError,
    runtimes,
  };
}

export function updateRuntimeControl(
  runtime: string,
  patch: {
    readonly paused?: boolean;
    readonly permissions?: Partial<RuntimePermissions>;
  },
): RuntimeControl {
  return setRuntimeControl(runtime, patch);
}
