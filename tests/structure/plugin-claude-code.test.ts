import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { exists, readJson } from "./helpers";

describe("Claude Code plugin package", () => {
  test("packages/plugin-claude-code has Claude plugin entrypoints", () => {
    assert.ok(exists("packages/plugin-claude-code/.claude-plugin/plugin.json"));
    assert.ok(exists("packages/plugin-claude-code/.mcp.json"));
    assert.ok(exists("packages/plugin-claude-code/hooks/hooks.json"));
    assert.ok(exists("packages/plugin-claude-code/scripts/inject.js"));
    assert.ok(exists("packages/plugin-claude-code/scripts/observe.js"));
    assert.ok(exists("packages/plugin-claude-code/scripts/summarize.js"));
    assert.ok(exists("packages/plugin-claude-code/skills/onemem-claude-code/SKILL.md"));
  });

  test("packages/plugin-claude-code manifest matches package identity", () => {
    const manifest = readJson<{ name?: string; version?: string; license?: string }>(
      "packages/plugin-claude-code/.claude-plugin/plugin.json",
    );
    assert.equal(manifest.name, "onemem");
    assert.equal(manifest.version, "0.1.1");
    assert.equal(manifest.license, "Apache-2.0");
  });

  test("Claude Code plugin marketplace exposes onemem", () => {
    const marketplace = readJson<{
      name?: string;
      plugins?: Array<{ name?: string; version?: string; source?: string }>;
    }>(".claude-plugin/marketplace.json");
    assert.equal(marketplace.name, "onemem");
    const plugin = marketplace.plugins?.find((entry) => entry.name === "onemem");
    assert.equal(plugin?.version, "0.1.1");
    assert.equal(plugin?.source, "./packages/plugin-claude-code");
  });

  test("Claude Code plugin flushes traces on Stop, not SessionEnd", () => {
    const hooks = readJson<{ hooks?: Record<string, unknown> }>(
      "packages/plugin-claude-code/hooks/hooks.json",
    );
    assert.ok(hooks.hooks?.SessionStart);
    assert.ok(hooks.hooks?.PostToolUse);
    assert.ok(hooks.hooks?.Stop);
    assert.equal(hooks.hooks?.SessionEnd, undefined);
  });

  test("Claude Code plugin bundles the OneMem MCP server", () => {
    const mcp = readJson<{ mcpServers?: { onemem?: { command?: string; args?: string[] } } }>(
      "packages/plugin-claude-code/.mcp.json",
    );
    assert.equal(mcp.mcpServers?.onemem?.command, "npx");
    assert.deepEqual(mcp.mcpServers?.onemem?.args, ["-y", "@onemem/mcp@latest"]);
  });
});
