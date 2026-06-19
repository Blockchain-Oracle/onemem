// GET /api/worker/observations — same-origin proxy to the local OneMem worker.
// The worker is the readable, instant path; chain-derived memory receipts remain
// the proof path below it.

import { NextResponse } from "next/server";
import { fetchLocalWorker } from "@/lib/local-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetchLocalWorker("/api/observations");
    if (!res.ok) throw new Error(`worker returned ${res.status}`);
    const body = (await res.json()) as unknown;
    return NextResponse.json({ ok: true, ...(body as object) });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      observations: [],
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
