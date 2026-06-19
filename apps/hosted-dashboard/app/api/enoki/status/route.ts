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
const REQUIRED_ORIGINS = ["https://app.onemem.xyz"] as const;

function publicEnvStatus() {
  const missing = [
    process.env.NEXT_PUBLIC_ENOKI_API_KEY ? null : "NEXT_PUBLIC_ENOKI_API_KEY",
    process.env.NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      ? null
      : "NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID",
  ].filter((value): value is string => value !== null);

  return {
    configured: missing.length === 0,
    missing,
  };
}

export async function GET() {
  const key = process.env.ENOKI_PRIVATE_KEY;
  const publicEnv = publicEnvStatus();
  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        reason: "ENOKI_PRIVATE_KEY not set",
        publicEnv,
        requiredOrigins: REQUIRED_ORIGINS,
      },
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
    const missingOrigins = REQUIRED_ORIGINS.filter((origin) => !origins.includes(origin));
    const hasGoogleProvider = providers.some(
      (provider) =>
        provider &&
        typeof provider === "object" &&
        "providerType" in provider &&
        provider.providerType === "google",
    );
    // The key is valid (we got app config). zkLogin is "ready" only once an auth
    // provider is registered; report the precise gap rather than a bare boolean.
    const signInReady = hasGoogleProvider && missingOrigins.length === 0 && publicEnv.configured;
    const nextSteps = [
      hasGoogleProvider ? null : "Register a Google auth provider in Enoki Developer Portal",
      publicEnv.missing.length > 0
        ? `Set ${publicEnv.missing.join(", ")} in Vercel production and redeploy`
        : null,
      missingOrigins.length > 0
        ? `Add ${missingOrigins.join(", ")} to Enoki allowed origins`
        : null,
    ].filter((step): step is string => step !== null);
    return NextResponse.json(
      {
        ok: true,
        keyValid: true,
        signInReady,
        authProviders: providers.length,
        allowedOrigins: origins.length,
        hasGoogleProvider,
        publicEnv,
        requiredOrigins: REQUIRED_ORIGINS,
        missingOrigins,
        next: signInReady ? null : nextSteps.join("; "),
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
