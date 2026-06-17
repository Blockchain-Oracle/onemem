// GET /api/runtimes — known runtime metadata + real trace recency + local policy.
import { NextResponse } from "next/server";
import { fetchRuntimeInventory } from "@/lib/runtimes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, ...(await fetchRuntimeInventory()) });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }
}
