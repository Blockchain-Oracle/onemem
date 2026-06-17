// Runtime heartbeats.
//   GET  → per-runtime status, merging (a) last on-chain trace activity with
//          (b) any live process heartbeats POSTed by running plugins.
//   POST { runtime } → record a live heartbeat (in-memory; process-local).
//
// Status is derived from REAL recency — never a hardcoded "online".

import { type NextRequest, NextResponse } from "next/server";
import { fetchRecentSessions } from "@/lib/trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONLINE_MS = 15 * 60 * 1000;
const IDLE_MS = 24 * 60 * 60 * 1000;

// Process-local live-heartbeat store (runtime name → last POST epoch ms).
const beats = new Map<string, number>();

function statusFor(lastMs: number, now: number): string {
  if (!lastMs) return "unknown";
  const age = now - lastMs;
  if (age < ONLINE_MS) return "online";
  if (age < IDLE_MS) return "idle";
  return "offline";
}

export async function GET() {
  const now = Date.now();
  const onChain = new Map<string, number>();
  try {
    for (const s of await fetchRecentSessions(100)) {
      const name = s.environment || s.agentId || "unknown";
      onChain.set(name, Math.max(onChain.get(name) ?? 0, s.openedAtMs));
    }
  } catch {
    // chain read failed — still report any live beats below
  }
  const names = new Set<string>([...onChain.keys(), ...beats.keys()]);
  const runtimes = [...names].map((name) => {
    const lastTraceMs = onChain.get(name) ?? 0;
    const lastBeatMs = beats.get(name) ?? 0;
    const lastMs = Math.max(lastTraceMs, lastBeatMs);
    return { name, lastTraceMs, lastBeatMs, lastMs, status: statusFor(lastMs, now) };
  });
  return NextResponse.json({ ok: true, now, runtimes });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { runtime?: string };
    if (!body.runtime) {
      return NextResponse.json({ ok: false, error: "runtime is required" }, { status: 400 });
    }
    beats.set(body.runtime, Date.now());
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }
}
