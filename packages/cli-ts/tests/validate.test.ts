import { describe, expect, it } from "vitest";
import { parseMetadata, parseNetwork, parseTopK } from "../src/util/validate.js";

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

describe("parseMetadata", () => {
  it("parses a JSON object", () => {
    expect(parseMetadata('{"topic":"prefs","n":3}')).toEqual({ topic: "prefs", n: 3 });
  });
  it("returns undefined when unset", () => {
    expect(parseMetadata(undefined)).toBeUndefined();
  });
  it("rejects invalid JSON", () => {
    expect(() => parseMetadata("{not json")).toThrow(/valid JSON/);
  });
  it("rejects non-object JSON (arrays, scalars, null)", () => {
    expect(() => parseMetadata("[1,2]")).toThrow(/JSON object/);
    expect(() => parseMetadata("42")).toThrow(/JSON object/);
    expect(() => parseMetadata("null")).toThrow(/JSON object/);
  });
});
