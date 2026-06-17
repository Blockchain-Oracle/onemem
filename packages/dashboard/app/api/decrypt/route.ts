// POST /api/decrypt — reveal a trace-call's plaintext. Local-mode only: decrypts
// with the user's own key on their own machine (see lib/decrypt.ts security note).

import { type NextRequest, NextResponse } from "next/server";
import { decryptCallContent } from "@/lib/decrypt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { walrusBlobId?: string; namespaceId?: string };
    if (!body.walrusBlobId || !body.namespaceId) {
      return NextResponse.json(
        { ok: false, error: "walrusBlobId and namespaceId are required" },
        { status: 400 },
      );
    }
    const plaintext = await decryptCallContent({
      walrusBlobId: body.walrusBlobId,
      namespaceId: body.namespaceId,
    });
    return NextResponse.json({ ok: true, plaintext });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }
}
