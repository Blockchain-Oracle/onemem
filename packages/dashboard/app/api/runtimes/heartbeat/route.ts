// Runtime heartbeats.
//   GET  → per-runtime status, merging (a) last captured local-worker session
//          activity with (b) any live process heartbeats POSTed by running plugins.
//   POST { runtime } → record a live heartbeat (in-memory; process-local).
//
// Status is derived from REAL recency — never a hardcoded "online".

import { type NextRequest, NextResponse } from "next/server";
import { fetchLocalWorker, type LocalSession } from "@/lib/local-worker";

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
  const captured = new Map<string, number>();
  try {
    const res = await fetchLocalWorker("/api/sessions");
    if (res.ok) {
      const data = (await res.json()) as { sessions?: LocalSession[] };
      for (const s of data.sessions ?? []) {
        const name = s.runtime || "unknown";
        captured.set(name, Math.max(captured.get(name) ?? 0, s.startedAt));
      }
    }
  } catch {
    // worker read failed — still report any live beats below
  }
  const names = new Set<string>([...captured.keys(), ...beats.keys()]);
  const runtimes = [...names].map((name) => {
    const lastCaptureMs = captured.get(name) ?? 0;
    const lastBeatMs = beats.get(name) ?? 0;
    const lastMs = Math.max(lastCaptureMs, lastBeatMs);
    return { name, lastCaptureMs, lastBeatMs, lastMs, status: statusFor(lastMs, now) };
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
