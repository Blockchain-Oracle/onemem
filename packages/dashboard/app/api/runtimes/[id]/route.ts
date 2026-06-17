// PATCH /api/runtimes/:id — update local runtime pause/trace policy.

import { RuntimeControlsValidationError } from "@onemem/sdk-ts/runtime";
import { type NextRequest, NextResponse } from "next/server";
import { updateRuntimeControl } from "@/lib/runtimes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RuntimePatchBody {
  readonly paused?: unknown;
  readonly permissions?: {
    readonly traceCapture?: unknown;
  };
}

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await _req.json()) as RuntimePatchBody;
    const paused = typeof body.paused === "boolean" ? body.paused : undefined;
    const traceCapture =
      typeof body.permissions?.traceCapture === "boolean"
        ? body.permissions.traceCapture
        : undefined;

    if (paused === undefined && traceCapture === undefined) {
      return NextResponse.json(
        { ok: false, error: "paused or permissions.traceCapture is required" },
        { status: 400 },
      );
    }

    const control = updateRuntimeControl(id, {
      paused,
      permissions: traceCapture === undefined ? undefined : { traceCapture },
    });
    return NextResponse.json({ ok: true, control });
  } catch (err) {
    const status = err instanceof RuntimeControlsValidationError ? 400 : 200;
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status },
    );
  }
}
