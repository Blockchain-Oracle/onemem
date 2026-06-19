// Dashboard stats — derived from the local worker's SQLite feed (the alive
// local source of truth). Powers /overview + the /api/overview route.

import { fetchLocalWorker, type LocalSession } from "./local-worker";

export interface RuntimeStat {
  name: string;
  count: number;
  /** Last session-started timestamp (ms) for this runtime; 0 if unknown. */
  lastMs: number;
}

export interface DashboardStats {
  sessions: number;
  runtimes: number;
  observations: number;
  runtimeBreakdown: RuntimeStat[];
}

async function localSessions(): Promise<LocalSession[]> {
  try {
    const res = await fetchLocalWorker("/api/sessions");
    if (!res.ok) return [];
    const data = (await res.json()) as { sessions?: LocalSession[] };
    return data.sessions ?? [];
  } catch {
    return [];
  }
}

async function localObservationCount(): Promise<number> {
  try {
    const res = await fetchLocalWorker("/api/observations");
    if (!res.ok) return 0;
    const data = (await res.json()) as { observations?: unknown[] };
    return data.observations?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function fetchStats(): Promise<DashboardStats> {
  const [sessions, observations] = await Promise.all([localSessions(), localObservationCount()]);

  const byRuntime = new Map<string, RuntimeStat>();
  for (const s of sessions) {
    const name = s.runtime || "unknown";
    const prev = byRuntime.get(name) ?? { name, count: 0, lastMs: 0 };
    byRuntime.set(name, {
      name,
      count: prev.count + 1,
      lastMs: Math.max(prev.lastMs, s.startedAt),
    });
  }
  const runtimeBreakdown = [...byRuntime.values()].sort((a, b) => b.count - a.count);

  return {
    sessions: sessions.length,
    runtimes: runtimeBreakdown.length,
    observations,
    runtimeBreakdown,
  };
}
