import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { APPS, exists, HOSTED_DASHBOARD_ROUTES, isDir, ROOT, readJson } from "./helpers";

describe("OneMem monorepo structure", () => {
  describe("Codex plugin package", () => {
    test("packages/plugin-codex has Codex plugin entrypoints", () => {
      assert.ok(exists("packages/plugin-codex/.codex-plugin/plugin.json"));
      assert.ok(exists("packages/plugin-codex/.mcp.json"));
      assert.ok(exists("packages/plugin-codex/hooks/hooks.json"));
      assert.ok(exists("packages/plugin-codex/skills/onemem-codex/SKILL.md"));
      assert.ok(exists(".agents/plugins/marketplace.json"));
      assert.ok(exists(".agents/plugins/README.md"));
    });

    test("packages/plugin-codex manifest exposes bundled MCP and skill paths", () => {
      const manifest = readJson<{
        name?: string;
        skills?: string;
        mcpServers?: string;
      }>("packages/plugin-codex/.codex-plugin/plugin.json");
      assert.equal(manifest.name, "onemem-codex");
      assert.equal(manifest.skills, "./skills/");
      assert.equal(manifest.mcpServers, "./.mcp.json");
    });

    test("Codex plugin marketplace exposes onemem-codex", () => {
      const marketplace = readJson<{
        name?: string;
        plugins?: Array<{ name?: string; source?: { source?: string; path?: string } }>;
      }>(".agents/plugins/marketplace.json");
      assert.equal(marketplace.name, "onemem");
      const plugin = marketplace.plugins?.find((entry) => entry.name === "onemem-codex");
      assert.equal(plugin?.source?.source, "local");
      assert.equal(plugin?.source?.path, "./packages/plugin-codex");

      const readme = readFileSync(join(ROOT, ".agents/plugins/README.md"), "utf8");
      assert.match(readme, /marketplace snapshot/i);
      assert.match(readme, /not a user's local\s+checkout/i);
    });
  });

  describe("Claude Code plugin package", () => {
    test("packages/plugin-claude-code has Claude plugin entrypoints", () => {
      assert.ok(exists("packages/plugin-claude-code/.claude-plugin/plugin.json"));
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
      assert.equal(manifest.version, "0.1.0");
      assert.equal(manifest.license, "Apache-2.0");
    });

    test("Claude Code plugin marketplace exposes onemem", () => {
      const marketplace = readJson<{
        name?: string;
        plugins?: Array<{ name?: string; version?: string; source?: string }>;
      }>(".claude-plugin/marketplace.json");
      assert.equal(marketplace.name, "onemem");
      const plugin = marketplace.plugins?.find((entry) => entry.name === "onemem");
      assert.equal(plugin?.version, "0.1.0");
      assert.equal(plugin?.source, "./packages/plugin-claude-code");
    });
  });

  describe("plugin npm package metadata", () => {
    test("published plugin packages do not ship workspace protocol dependencies", () => {
      for (const rel of [
        "packages/plugin-codex/package.json",
        "packages/plugin-claude-code/package.json",
      ]) {
        const manifest = JSON.stringify(readJson(rel));
        assert.doesNotMatch(manifest, /workspace:/, `${rel} must be installable outside pnpm`);
      }
    });

    test("plugin unit tests do not rely on registry SDK internals", () => {
      for (const rel of [
        "packages/plugin-codex/tests/plugin.test.ts",
        "packages/plugin-claude-code/tests/plugin.test.ts",
      ]) {
        const source = readFileSync(join(ROOT, rel), "utf8");
        assert.match(
          source,
          /from "\.\.\/\.\.\/sdk-ts\/src\/runtime-controls\.ts"/,
          `${rel} must import repo-local runtime control helpers for test-only policy setup`,
        );
        assert.doesNotMatch(
          source,
          /from "@onemem\/sdk-ts\/runtime"/,
          `${rel} must not assume the published sdk runtime entry has repo-current test helpers`,
        );
      }
    });

    test("Claude Code hook runtime-control policy is plugin-local", () => {
      const source = readFileSync(
        join(ROOT, "packages/plugin-claude-code/scripts/onemem-lib.mjs"),
        "utf8",
      );
      assert.match(source, /function runtimeControlsPath\(\)/);
      assert.match(source, /ONEMEM_RUNTIME_CONTROLS_PATH/);
      assert.doesNotMatch(
        source,
        /@onemem\/sdk-ts\/runtime/,
        "Claude hook policy must not depend on an installed SDK runtime export",
      );
    });
  });

  describe("apps", () => {
    for (const app of APPS) {
      test(`apps/${app} exists`, () => {
        assert.ok(isDir(`apps/${app}`), `apps/${app}`);
      });
    }

    test("hosted-dashboard has all hosted-only routes", () => {
      for (const route of HOSTED_DASHBOARD_ROUTES) {
        assert.ok(
          exists(`apps/hosted-dashboard/app/${route}/page.tsx`),
          `route: apps/hosted-dashboard/app/${route}/page.tsx`,
        );
      }
    });

    test("hosted-dashboard has Walrus Sites mirror artifacts", () => {
      assert.ok(exists("apps/hosted-dashboard/walrus-sites/sites-config.yaml"));
      assert.ok(exists("apps/hosted-dashboard/walrus-sites/README.md"));
    });

    test("hosted-dashboard has hosted CLI pairing support", () => {
      assert.ok(exists("apps/hosted-dashboard/lib/hosted-state.ts"));
      assert.ok(exists("apps/hosted-dashboard/lib/cli-login.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/api/cli-login/memwal-account/route.ts"));
    });
  });

  describe("dashboard browser smoke", () => {
    test("dashboard exposes reusable browser smoke coverage", () => {
      const pkg = readJson<{
        scripts?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>("packages/dashboard/package.json");
      assert.equal(pkg.scripts?.["browser:smoke"], "node scripts/browser-smoke.mjs");
      assert.ok(pkg.devDependencies?.["playwright-core"], "dashboard must declare playwright-core");
      assert.ok(exists("packages/dashboard/scripts/browser-smoke.mjs"));
      assert.ok(exists("packages/dashboard/public/favicon.svg"));
    });

    test("hosted-dashboard exposes reusable browser smoke coverage", () => {
      const pkg = readJson<{
        scripts?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>("apps/hosted-dashboard/package.json");
      assert.equal(pkg.scripts?.["browser:smoke"], "node scripts/browser-smoke.mjs");
      assert.ok(
        pkg.devDependencies?.["playwright-core"],
        "hosted-dashboard must declare playwright-core",
      );
      assert.ok(exists("apps/hosted-dashboard/scripts/browser-smoke.mjs"));
      assert.ok(exists("apps/hosted-dashboard/app/icon.svg"));
      assert.ok(exists("apps/hosted-dashboard/lib/sponsored-provisioning.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/onboarding/SponsoredProvisioning.tsx"));
      assert.ok(exists("apps/hosted-dashboard/app/api/onboarding/sponsored/prepare/route.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/api/onboarding/sponsored/execute/route.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/share/HostedShareView.tsx"));
      assert.ok(exists("apps/hosted-dashboard/app/share/ShareHistoryPanel.tsx"));
      assert.ok(exists("apps/hosted-dashboard/app/share/[capability_id]/page.tsx"));
      assert.ok(
        exists("apps/hosted-dashboard/app/share/[capability_id]/ShareCapabilityAccountHint.tsx"),
      );
      assert.ok(exists("apps/hosted-dashboard/lib/share-capability.ts"));
      assert.ok(exists("apps/hosted-dashboard/lib/share-history.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/api/share/history/route.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/api/share/sponsored/prepare/route.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/api/share/sponsored/execute/route.ts"));
    });
  });
});
