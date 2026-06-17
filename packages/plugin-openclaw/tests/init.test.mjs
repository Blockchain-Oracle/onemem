import { describe, expect, it } from "vitest";

import { applyInit, PLUGIN_ID, resolveConfigPath } from "../bin/init.mjs";

describe("resolveConfigPath", () => {
  const home = "/home/u";
  it("OPENCLAW_CONFIG_PATH wins over everything", () => {
    expect(resolveConfigPath(["--dev"], { OPENCLAW_CONFIG_PATH: "/x.json" }, home)).toBe("/x.json");
  });
  it("--profile beats --dev and default", () => {
    expect(resolveConfigPath(["--profile", "qa", "--dev"], {}, home)).toBe(
      "/home/u/.openclaw-qa/openclaw.json",
    );
  });
  it("--dev beats default", () => {
    expect(resolveConfigPath(["--dev"], {}, home)).toBe("/home/u/.openclaw-dev/openclaw.json");
  });
  it("defaults to ~/.openclaw", () => {
    expect(resolveConfigPath([], {}, home)).toBe("/home/u/.openclaw/openclaw.json");
  });
  it("--profile with no value falls through", () => {
    expect(resolveConfigPath(["--profile"], {}, home)).toBe("/home/u/.openclaw/openclaw.json");
  });
});

describe("applyInit", () => {
  it("sets the three opt-in keys on an empty config", () => {
    const cfg = applyInit({});
    expect(cfg.plugins.entries[PLUGIN_ID]).toEqual({
      enabled: true,
      hooks: { allowConversationAccess: true },
    });
    expect(cfg.plugins.allow).toEqual([PLUGIN_ID]);
  });

  it("preserves existing entries + allowlist and is idempotent", () => {
    const cfg = { plugins: { entries: { other: { enabled: true } }, allow: ["other"] } };
    applyInit(cfg);
    applyInit(cfg); // run twice
    expect(cfg.plugins.entries.other).toEqual({ enabled: true });
    expect(cfg.plugins.allow).toEqual(["other", PLUGIN_ID]); // no duplicate push
    expect(cfg.plugins.entries[PLUGIN_ID].hooks.allowConversationAccess).toBe(true);
  });
});
