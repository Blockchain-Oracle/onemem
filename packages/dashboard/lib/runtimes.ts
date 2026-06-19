import {
  getRuntimeControl,
  listRuntimeControls,
  type RuntimeControl,
  type RuntimePermissions,
  runtimeControlsPath,
  setRuntimeControl,
} from "@onemem/sdk-ts/runtime";
import { fetchLocalWorker, type LocalSession } from "@/lib/local-worker";

const ONLINE_MS = 15 * 60 * 1000;
const IDLE_MS = 24 * 60 * 60 * 1000;

// Capability tier — what OneMem can HONESTLY do for an integration, driven by
// WHERE its code runs (execution location). Only location-A runtimes that read
// ~/.onemem/runtime-controls.json on this machine are controllable from this
// (local) dashboard. Framework adapters (Vercel AI, ElevenLabs, …) run on a
// deployed server — they are NOT local apps, get NO pause/trace toggles here,
// and are managed from the hosted dashboard. Showing them a toggle was theater.
export type RuntimeTier =
  | "native-hooks" // location A: hooks auto-capture this machine's tool calls
  | "trusted-hooks-required" // location A: same, after a one-time host trust step
  | "runtime-provider" // location A: native runtime/plugin
  | "hook-port-pending" // location A: ClaudeMem proves hooks exist; OneMem port not shipped yet
  | "mcp-tools-only" // location C: explicit OneMem tool calls only, no auto-capture
  | "deployed-adapter"; // location B: runs off-machine; read-only here

export type RuntimeSection = "local-runtimes" | "mcp-clients" | "environments";

const TIER_LABEL: Record<RuntimeTier, string> = {
  "native-hooks": "Native hooks",
  "trusted-hooks-required": "Trusted hooks required",
  "runtime-provider": "Runtime provider",
  "hook-port-pending": "Hook port pending",
  "mcp-tools-only": "MCP tools only",
  "deployed-adapter": "Deployed adapter",
};

function sectionFor(tier: RuntimeTier): RuntimeSection {
  if (tier === "mcp-tools-only") return "mcp-clients";
  if (tier === "deployed-adapter") return "environments";
  return "local-runtimes";
}

// Only location-A runtimes that actually read the local runtime-controls file can
// be paused / trace-toggled from the local dashboard. MCP clients and deployed
// adapters cannot — a toggle here would write a file their code never reads.
function isControllable(tier: RuntimeTier): boolean {
  return (
    tier === "native-hooks" || tier === "trusted-hooks-required" || tier === "runtime-provider"
  );
}

interface RuntimeMetadata {
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly installCommand: string;
  readonly tier: RuntimeTier;
}

const KNOWN_RUNTIMES: readonly RuntimeMetadata[] = [
  // Location A — laptop runtimes (real local controls)
  {
    id: "claude-code",
    name: "Claude Code",
    icon: "bolt",
    installCommand:
      "claude plugin marketplace add Blockchain-Oracle/onemem && claude plugin install onemem@onemem",
    tier: "native-hooks",
  },
  {
    id: "codex",
    name: "Codex",
    icon: "bolt",
    installCommand:
      "codex plugin marketplace add Blockchain-Oracle/onemem --json && codex plugin add onemem-codex@onemem --json",
    tier: "trusted-hooks-required",
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    icon: "branch",
    installCommand: "openclaw plugins install @onemem/oc-onemem && npx @onemem/oc-onemem init",
    tier: "runtime-provider",
  },
  {
    id: "hermes",
    name: "Hermes",
    icon: "cube",
    installCommand: "pip install hermes-onemem",
    tier: "runtime-provider",
  },
  // Location A hook-capable hosts proven by ClaudeMem. OneMem must port the
  // installers before showing controls/tracing as live, so these are local but
  // non-controllable until the hook bridge lands.
  {
    id: "cursor",
    name: "Cursor",
    icon: "apps",
    installCommand: "Port ClaudeMem cursor-hooks/ into OneMem before enabling capture",
    tier: "hook-port-pending",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    icon: "apps",
    installCommand: "Port ClaudeMem WindsurfHooksInstaller.ts into OneMem before enabling capture",
    tier: "hook-port-pending",
  },
  // Location C — MCP-only clients until equivalent native hooks are proven.
  { id: "cline", name: "Cline", icon: "apps", installCommand: "", tier: "mcp-tools-only" },
  { id: "opencode", name: "OpenCode", icon: "apps", installCommand: "", tier: "mcp-tools-only" },
  // Location B framework adapters (Vercel AI, OpenAI Agents, CrewAI, LiveKit,
  // ElevenLabs) are intentionally NOT listed here — they run on a deployed server,
  // not this machine. Their traces still appear (by environment) in Sessions and
  // are managed from the hosted dashboard. If one has written to a namespace it
  // surfaces below as a read-only "environment", never as a controllable app.
];

const METADATA = new Map(KNOWN_RUNTIMES.map((runtime) => [runtime.id, runtime]));

/**
 * True only for location-A runtimes that read the local runtime-controls file.
 * MCP clients, deployed adapters, and unknown on-chain environments return false
 * so no surface (UI or API) can pretend to pause/trace-toggle them locally.
 */
export function isRuntimeControllable(id: string): boolean {
  const meta = METADATA.get(id);
  return meta ? isControllable(meta.tier) : false;
}

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
  readonly tier: RuntimeTier;
  readonly tierLabel: string;
  readonly section: RuntimeSection;
  readonly controllable: boolean;
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

// Environments seen on-chain that we don't recognize are deployed/other adapters:
// read-only here, never controllable.
function unknownMetadata(id: string): RuntimeMetadata {
  return { id, name: id, icon: "cube", installCommand: "", tier: "deployed-adapter" };
}

function rowFor(
  id: string,
  stats: { count: number; lastMs: number } | undefined,
  control: RuntimeControl,
  now: number,
): RuntimeRow {
  const meta = METADATA.get(id) ?? unknownMetadata(id);
  const controllable = isControllable(meta.tier);
  const status = !controllable
    ? statusOf(stats?.lastMs ?? 0, now)
    : control.paused
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
    paused: controllable ? control.paused : false,
    traceCapture: controllable ? control.permissions.traceCapture : false,
    tier: meta.tier,
    tierLabel: TIER_LABEL[meta.tier],
    section: sectionFor(meta.tier),
    controllable,
  };
}

export async function fetchRuntimeInventory(): Promise<RuntimeInventory> {
  const now = Date.now();
  const byRuntime = new Map<string, { count: number; lastMs: number }>();
  let traceError: string | null = null;

  // Recency + counts come from the local worker's captured sessions.
  try {
    const res = await fetchLocalWorker("/api/sessions");
    if (!res.ok) throw new Error(`worker responded ${res.status}`);
    const data = (await res.json()) as { sessions?: LocalSession[] };
    for (const session of data.sessions ?? []) {
      const id = (session.runtime || "unknown").trim().toLowerCase();
      const prev = byRuntime.get(id) ?? { count: 0, lastMs: 0 };
      byRuntime.set(id, {
        count: prev.count + 1,
        lastMs: Math.max(prev.lastMs, session.startedAt),
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
