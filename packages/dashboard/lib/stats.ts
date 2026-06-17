// Dashboard stats — derived from real on-chain events (no count endpoint exists
// in MemWal/OneMem, so everything is computed from TraceSession + memwal_write
// ActionCall events). Powers /overview + the /api/overview route.

import { fetchMemories } from "./memory";
import { fetchRecentSessions } from "./trace";

export interface RuntimeStat {
  name: string;
  count: number;
  /** Last session-opened timestamp (ms) for this runtime; 0 if unknown. */
  lastMs: number;
}

export interface DashboardStats {
  sessions: number;
  runtimes: number;
  memories: number;
  runtimeBreakdown: RuntimeStat[];
}

export async function fetchStats(sessionLimit = 50, memoryLimit = 100): Promise<DashboardStats> {
  const [sessions, memories] = await Promise.all([
    fetchRecentSessions(sessionLimit),
    fetchMemories(undefined, memoryLimit).catch(() => []),
  ]);

  const byRuntime = new Map<string, RuntimeStat>();
  for (const s of sessions) {
    const name = s.environment || s.agentId || "unknown";
    const prev = byRuntime.get(name) ?? { name, count: 0, lastMs: 0 };
    byRuntime.set(name, {
      name,
      count: prev.count + 1,
      lastMs: Math.max(prev.lastMs, s.openedAtMs),
    });
  }
  const runtimeBreakdown = [...byRuntime.values()].sort((a, b) => b.count - a.count);

  return {
    sessions: sessions.length,
    runtimes: runtimeBreakdown.length,
    memories: memories.length,
    runtimeBreakdown,
  };
}
