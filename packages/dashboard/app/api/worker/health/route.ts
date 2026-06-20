// GET /api/worker/health — same-origin proxy to the local OneMem worker's health,
// so the feed knows whether durable MemWal storage is active (honest upload state).

import { NextResponse } from "next/server";
import { fetchLocalWorker } from "@/lib/local-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetchLocalWorker("/health");
    if (!res.ok) throw new Error(`worker returned ${res.status}`);
    const body = (await res.json()) as unknown;
    return NextResponse.json({ ok: true, ...(body as object) });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      durable: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
