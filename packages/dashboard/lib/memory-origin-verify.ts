import type { VerifySessionsResponse } from "./sessions";

export type VerifyFetch = (
  input: string,
  init: {
    method: "POST";
    headers: { "content-type": "application/json" };
    body: string;
  },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export async function verifyMemoryOrigin(
  sessionId: string,
  fetchImpl: VerifyFetch = fetch,
): Promise<VerifySessionsResponse> {
  const res = await fetchImpl("/api/sessions/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionIds: [sessionId] }),
  });
  const body = await res.json();
  if (!res.ok || !isVerifyResponse(body)) {
    throw new Error(errorMessage(body) ?? `HTTP ${res.status}`);
  }
  return body;
}

export function isVerifyResponse(value: unknown): value is VerifySessionsResponse {
  return Boolean(value && typeof value === "object" && "results" in value);
}

function errorMessage(value: unknown): string | null {
  if (value && typeof value === "object" && "error" in value) {
    const error = (value as { error?: unknown }).error;
    return typeof error === "string" ? error : null;
  }
  return null;
}
