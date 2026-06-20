import { describe, expect, it } from "vitest";
import { shortId } from "./memory-view";

describe("shortId", () => {
  it("shortens long ids without changing short values", () => {
    expect(shortId("0xabcdef", 4, 2)).toBe("0xabcdef");
    expect(shortId("0x1234567890abcdef", 6, 4)).toBe("0x1234...cdef");
  });

  it("returns a dash for empty/nullish values", () => {
    expect(shortId(null)).toBe("-");
    expect(shortId(undefined)).toBe("-");
    expect(shortId("")).toBe("-");
  });
});
