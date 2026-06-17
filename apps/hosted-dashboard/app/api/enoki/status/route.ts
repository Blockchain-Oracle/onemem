// GET /api/enoki/status — report Enoki readiness for the hosted sign-in flow.
//
// Uses the server-side ENOKI_PRIVATE_KEY (never exposed to the client) to read
// the app config from the Enoki API, then reports exactly what's wired vs. what
// still needs Developer-Portal setup. This makes the deploy self-diagnosing:
// zkLogin sign-in works once an authentication provider (e.g. Google OAuth) and
// the allowed origins/domains are configured at portal.enoki.mystenlabs.com.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ENOKI_API = "https://api.enoki.mystenlabs.com/v1/app";

export async function GET() {
  const key = process.env.ENOKI_PRIVATE_KEY;
  if (!key) {
    return NextResponse.json(
      { ok: false, configured: false, reason: "ENOKI_PRIVATE_KEY not set" },
      { status: 200 },
    );
  }
  try {
    const res = await fetch(ENOKI_API, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, configured: false, reason: `Enoki API ${res.status}` },
        { status: 200 },
      );
    }
    const body = (await res.json()) as {
      data?: {
        authenticationProviders?: unknown[];
        allowedOrigins?: unknown[];
        domains?: unknown[];
      };
    };
    const app = body.data ?? {};
    const providers = Array.isArray(app.authenticationProviders) ? app.authenticationProviders : [];
    const origins = Array.isArray(app.allowedOrigins) ? app.allowedOrigins : [];
    // The key is valid (we got app config). zkLogin is "ready" only once an auth
    // provider is registered; report the precise gap rather than a bare boolean.
    const signInReady = providers.length > 0 && origins.length > 0;
    return NextResponse.json(
      {
        ok: true,
        keyValid: true,
        signInReady,
        authProviders: providers.length,
        allowedOrigins: origins.length,
        next: signInReady
          ? null
          : "Register an authentication provider (e.g. Google OAuth) + allowed origins at portal.enoki.mystenlabs.com, then set the enoki_public_* key + provider client id.",
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : String(err) },
      { status: 200 },
    );
  }
}
