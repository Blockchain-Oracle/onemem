import { fetchRecentSessions, fetchSession, type SessionListItem, statusLabel } from "./trace";

const MIN_BAR_WIDTH = 7;
const MAX_VERIFY_IDS = 25;

export interface UnifiedSessionItem {
  sessionId: string;
  shortId: string;
  agentId: string;
  runtime: string;
  namespaceId: string;
  startedAtMs: number;
  startedLabel: string;
  href: string;
  laneLeftPct: number;
  laneWidthPct: number;
}

export interface UnifiedRuntimeLane {
  runtime: string;
  className: string;
  sessions: UnifiedSessionItem[];
}

export interface UnifiedSessionGroup {
  dayKey: string;
  dayLabel: string;
  title: string;
  runtimeCount: number;
  sessionCount: number;
  windowLabel: string;
  startedAtMs: number;
  endedAtMs: number;
  lanes: UnifiedRuntimeLane[];
  sessions: UnifiedSessionItem[];
}

export interface VerifySessionResult {
  sessionId: string;
  shortId: string;
  ok: boolean;
  callCount: number;
  statusLabel: string;
  brokenAt: number | null;
  error: string | null;
}

export interface VerifySessionsResponse {
  ok: boolean;
  verifiedCount: number;
  total: number;
  results: VerifySessionResult[];
}

export async function fetchUnifiedSessionGroups(limit = 100): Promise<UnifiedSessionGroup[]> {
  return groupSessions(await fetchRecentSessions(limit));
}

export function groupSessions(sessions: SessionListItem[]): UnifiedSessionGroup[] {
  const byDay = new Map<string, SessionListItem[]>();
  for (const session of sessions) {
    const startedAtMs = session.startedAtMs || session.openedAtMs;
    const key = dayKey(startedAtMs);
    byDay.set(key, [...(byDay.get(key) ?? []), session]);
  }

  return [...byDay.entries()]
    .map(([key, daySessions]) => buildGroup(key, daySessions))
    .sort((a, b) => b.startedAtMs - a.startedAtMs);
}

export async function verifySessions(sessionIds: string[]): Promise<VerifySessionsResponse> {
  const ids = [...new Set(sessionIds.map((id) => id.trim()).filter(Boolean))].slice(
    0,
    MAX_VERIFY_IDS,
  );
  const results = await Promise.all(ids.map(verifyOneSession));
  const verifiedCount = results.filter((result) => result.ok).length;
  return {
    ok: results.length > 0 && verifiedCount === results.length,
    verifiedCount,
    total: results.length,
    results,
  };
}

async function verifyOneSession(sessionId: string): Promise<VerifySessionResult> {
  const result = await fetchSession(sessionId);
  if ("error" in result) {
    return {
      sessionId,
      shortId: shortId(sessionId),
      ok: false,
      callCount: 0,
      statusLabel: "Unavailable",
      brokenAt: null,
      error: result.error,
    };
  }

  return {
    sessionId,
    shortId: shortId(sessionId),
    ok: result.verify.ok,
    callCount: result.verify.callCount,
    statusLabel: statusLabel(Number(result.verify.sessionStatus)),
    brokenAt: result.verify.brokenAt,
    error: null,
  };
}

function buildGroup(dayKeyValue: string, sessions: SessionListItem[]): UnifiedSessionGroup {
  const ordered = sessions
    .map(toUnifiedItemBase)
    .sort((a, b) => a.startedAtMs - b.startedAtMs || a.sessionId.localeCompare(b.sessionId));
  const startedAtMs = ordered[0]?.startedAtMs ?? 0;
  const endedAtMs = ordered[ordered.length - 1]?.startedAtMs ?? startedAtMs;
  const span = Math.max(1, endedAtMs - startedAtMs);
  const items = ordered.map((item) => ({
    ...item,
    laneLeftPct: clamp(((item.startedAtMs - startedAtMs) / span) * (100 - MIN_BAR_WIDTH), 0, 93),
    laneWidthPct: MIN_BAR_WIDTH,
  }));

  const lanes = [...groupByRuntime(items).entries()]
    .map(([runtime, laneSessions]) => ({
      runtime,
      className: runtimeClass(runtime),
      sessions: laneSessions,
    }))
    .sort((a, b) => a.runtime.localeCompare(b.runtime));

  return {
    dayKey: dayKeyValue,
    dayLabel: dayLabel(dayKeyValue),
    title: titleFor(dayKeyValue, lanes.length),
    runtimeCount: lanes.length,
    sessionCount: items.length,
    windowLabel: windowLabel(startedAtMs, endedAtMs),
    startedAtMs,
    endedAtMs,
    lanes,
    sessions: items,
  };
}

function toUnifiedItemBase(
  session: SessionListItem,
): Omit<UnifiedSessionItem, "laneLeftPct" | "laneWidthPct"> {
  const startedAtMs = session.startedAtMs || session.openedAtMs;
  return {
    sessionId: session.sessionId,
    shortId: shortId(session.sessionId),
    agentId: session.agentId || "agent",
    runtime: session.environment || "unknown",
    namespaceId: session.namespaceId || "",
    startedAtMs,
    startedLabel: timeLabel(startedAtMs),
    href: `/trace/${session.sessionId}`,
  };
}

function runtimeClass(runtime: string): string {
  const key = runtime.toLowerCase();
  if (key.includes("hermes")) return "rt-hermes";
  if (key.includes("mcp") || key.includes("cursor")) return "rt-mcp";
  return "rt-claude";
}

function dayKey(ms: number): string {
  if (!ms) return "unknown";
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayLabel(key: string): string {
  if (key === "unknown") return "Unknown date";
  const d = dateFromKey(key);
  const today = dayKey(Date.now());
  const yesterday = dayKey(Date.now() - 24 * 60 * 60 * 1000);
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
}

function titleFor(key: string, runtimes: number): string {
  const label = dayLabel(key).toLowerCase();
  if (label === "today")
    return `Today's work across ${runtimes} runtime${runtimes === 1 ? "" : "s"}`;
  if (label === "yesterday") {
    return `Yesterday's work across ${runtimes} runtime${runtimes === 1 ? "" : "s"}`;
  }
  return `${dayLabel(key)} work across ${runtimes} runtime${runtimes === 1 ? "" : "s"}`;
}

function windowLabel(start: number, end: number): string {
  if (!start) return "unknown";
  if (start === end) return timeLabel(start);
  return `${timeLabel(start)} -> ${timeLabel(end)}`;
}

function timeLabel(ms: number): string {
  if (!ms) return "--:--";
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function shortId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function dateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function groupByRuntime(items: UnifiedSessionItem[]): Map<string, UnifiedSessionItem[]> {
  const byRuntime = new Map<string, UnifiedSessionItem[]>();
  for (const item of items) {
    byRuntime.set(item.runtime, [...(byRuntime.get(item.runtime) ?? []), item]);
  }
  return byRuntime;
}
