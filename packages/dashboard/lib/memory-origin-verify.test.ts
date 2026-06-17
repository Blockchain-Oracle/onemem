import { describe, expect, it, vi } from "vitest";
import { type VerifyFetch, verifyMemoryOrigin } from "./memory-origin-verify";

const okResponse = {
  ok: true,
  verifiedCount: 1,
  total: 1,
  results: [
    {
      sessionId: "0xsession-a",
      shortId: "0xsession-a",
      ok: true,
      callCount: 2,
      statusLabel: "Success",
      brokenAt: null,
      error: null,
    },
  ],
};

describe("verifyMemoryOrigin", () => {
  it("posts exactly the selected session id to the shared verify endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => okResponse,
    })) as unknown as VerifyFetch;

    await expect(verifyMemoryOrigin("0xsession-a", fetcher)).resolves.toEqual(okResponse);
    expect(fetcher).toHaveBeenCalledWith("/api/sessions/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionIds: ["0xsession-a"] }),
    });
  });

  it("surfaces API error messages", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ ok: false, error: "sessionIds must be an array" }),
    })) as unknown as VerifyFetch;

    await expect(verifyMemoryOrigin("0xsession-a", fetcher)).rejects.toThrow(
      /sessionIds must be an array/,
    );
  });
});
