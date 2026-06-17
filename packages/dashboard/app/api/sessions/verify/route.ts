// POST /api/sessions/verify — verify a dashboard-derived group of sessions.
import { type NextRequest, NextResponse } from "next/server";
import { verifySessions } from "@/lib/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionIds?: unknown };
    if (!Array.isArray(body.sessionIds)) {
      return NextResponse.json(
        { ok: false, error: "sessionIds must be an array" },
        { status: 400 },
      );
    }
    const sessionIds = body.sessionIds.filter((id): id is string => typeof id === "string");
    return NextResponse.json(await verifySessions(sessionIds));
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }
}
