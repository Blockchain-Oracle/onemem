// GET /api/memories[?namespaceId=] — memory inventory derived from on-chain
// memwal_write ActionCalls (MemWal 0.0.5 has no list endpoint).
import { type NextRequest, NextResponse } from "next/server";
import { fetchMemories } from "@/lib/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const ns = req.nextUrl.searchParams.get("namespaceId") ?? undefined;
    return NextResponse.json({ ok: true, memories: await fetchMemories(ns) });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }
}
