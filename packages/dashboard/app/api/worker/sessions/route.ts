// GET /api/worker/sessions — same-origin proxy to the local OneMem worker's
// local session inventory. The memories page uses this to label readable
// observations with project/runtime context.

import { NextResponse } from "next/server";
import { fetchLocalWorker } from "@/lib/local-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetchLocalWorker("/api/sessions");
    if (!res.ok) throw new Error(`worker returned ${res.status}`);
    const body = (await res.json()) as unknown;
    return NextResponse.json({ ok: true, ...(body as object) });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      sessions: [],
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
