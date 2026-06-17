import { describe, expect, it } from "vitest";
import { parseNetwork, parseTopK } from "../src/util/validate.js";

describe("parseNetwork", () => {
  it("passes through known networks", () => {
    expect(parseNetwork("testnet")).toBe("testnet");
    expect(parseNetwork("mainnet")).toBe("mainnet");
  });
  it("returns undefined when unset (so resolveNetwork can default)", () => {
    expect(parseNetwork(undefined)).toBeUndefined();
  });
  it("throws on a typo rather than silently using the wrong network", () => {
    expect(() => parseNetwork("mannet")).toThrow(/unknown network/);
  });
});

describe("parseTopK", () => {
  it("parses a positive integer", () => {
    expect(parseTopK("5")).toBe(5);
  });
  it("returns undefined when unset", () => {
    expect(parseTopK(undefined)).toBeUndefined();
  });
  it("rejects zero, negatives, and non-numbers", () => {
    expect(() => parseTopK("0")).toThrow(/positive integer/);
    expect(() => parseTopK("-1")).toThrow(/positive integer/);
    expect(() => parseTopK("abc")).toThrow(/positive integer/);
  });
});
