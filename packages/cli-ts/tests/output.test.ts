import { describe, expect, it } from "vitest";
import { shortHex, shortId } from "../src/util/output.js";

describe("shortHex", () => {
  it("renders a byte array as 0x-prefixed hex, truncated", () => {
    expect(shortHex([0x2e, 0xc8, 0xc2, 0x2d], 8)).toBe("0x2ec8c22d");
  });
  it("accepts a Uint8Array", () => {
    expect(shortHex(new Uint8Array([255, 0, 16]), 6)).toBe("0xff0010");
  });
  it("returns empty string for undefined", () => {
    expect(shortHex(undefined)).toBe("");
  });
});

describe("shortId", () => {
  it("truncates long ids with an ellipsis", () => {
    expect(shortId("0x0123456789abcdef", 10)).toBe("0x01234567…");
  });
  it("leaves short ids intact", () => {
    expect(shortId("0xabc", 10)).toBe("0xabc");
  });
});
