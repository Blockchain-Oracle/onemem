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

    test("packages/plugin-codex manifest exposes bundled MCP, skill, and hook paths", () => {
      const manifest = readJson<{
        name?: string;
        skills?: string;
        mcpServers?: string;
        hooks?: string;
      }>("packages/plugin-codex/.codex-plugin/plugin.json");
      assert.equal(manifest.name, "onemem-codex");
      assert.equal(manifest.skills, "./skills/");
      assert.equal(manifest.mcpServers, "./.mcp.json");
      assert.equal(manifest.hooks, "./hooks/hooks.json");
    });

    test("packages/plugin-codex keeps hook proof claims bounded", () => {
      const hooks = readJson<{
        description?: string;
        hooks?: { SessionStart?: Array<{ matcher?: string }> };
      }>("packages/plugin-codex/hooks/hooks.json");
      assert.equal(
        hooks.description,
        undefined,
        "Codex CLI 0.140 rejects top-level description in plugin hooks config",
      );
      assert.equal(hooks.hooks?.SessionStart?.[0]?.matcher, "");

      const readme = readFileSync(join(ROOT, "packages/plugin-codex/README.md"), "utf8");
      assert.doesNotMatch(readme, /SessionStart opens a OneMem `TraceSession`/);
      assert.match(readme, /`codex exec` tests on Codex CLI 0\.140 still did not run hooks/);
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

    test("hosted-dashboard Enoki status points to real production setup knobs", () => {
      const source = readFileSync(
        join(ROOT, "apps/hosted-dashboard/app/api/enoki/status/route.ts"),
        "utf8",
      );
      assert.match(source, /NEXT_PUBLIC_ENOKI_API_KEY/);
      assert.match(source, /NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID/);
      assert.match(source, /https:\/\/app\.onemem\.xyz/);
      assert.match(source, /missingOrigins/);
      assert.doesNotMatch(source, /enoki_public_\*/i);
    });

    test("hosted-dashboard exposes a reusable Enoki readiness preflight", () => {
      const pkg = readJson<{ scripts?: Record<string, string> }>(
        "apps/hosted-dashboard/package.json",
      );
      assert.equal(pkg.scripts?.["enoki:readiness"], "node scripts/check-enoki-readiness.mjs");
      assert.ok(exists("apps/hosted-dashboard/scripts/check-enoki-readiness.mjs"));
      const source = readFileSync(
        join(ROOT, "apps/hosted-dashboard/scripts/check-enoki-readiness.mjs"),
        "utf8",
      );
      assert.match(source, /NEXT_PUBLIC_ENOKI_API_KEY/);
      assert.match(source, /NEXT_PUBLIC_ENOKI_GOOGLE_CLIENT_ID/);
      assert.match(source, /https:\/\/app\.onemem\.xyz/);
      assert.match(source, /hasGoogleProvider/);
      assert.doesNotMatch(source, /console\.log\(.*privateKey/s);
    });

    test("hosted-dashboard hub only links to routes served by the hosted shell", () => {
      const source = readFileSync(
        join(ROOT, "apps/hosted-dashboard/app/dashboard/page.tsx"),
        "utf8",
      );
      assert.doesNotMatch(
        source,
        /href:\s*"\/(memories|sessions|apps|settings)"/,
        "hosted /dashboard must not link to root-level local dashboard routes",
      );
      assert.doesNotMatch(
        source,
        /NEXT_PUBLIC_DASHBOARD_URL/,
        "hosted /dashboard must not rely on an env prefix that can make card links drift",
      );
      for (const href of ["/dashboard", "/share", "/onboarding", "/login"]) {
        assert.match(source, new RegExp(`href:\\s*"${href}"`));
      }
      assert.match(
        source,
        /loadHostedProvisioningState/,
        "hosted /dashboard should reflect saved provisioning state",
      );

      const onboarding = readFileSync(
        join(ROOT, "apps/hosted-dashboard/app/onboarding/page.tsx"),
        "utf8",
      );
      assert.doesNotMatch(
        onboarding,
        /localhost:4040/,
        "hosted onboarding completion must not route production users to localhost",
      );
      assert.match(
        onboarding,
        /loadHostedProvisioningState/,
        "hosted onboarding should reuse saved provisioning state instead of prompting duplicate namespace creation",
      );
      assert.match(
        onboarding,
        /Already provisioned/,
        "hosted onboarding should render an already-provisioned state before offering a new namespace mutation",
      );
      assert.match(onboarding, /href="\/dashboard"/);
    });

    test("hosted-dashboard has Walrus Sites mirror artifacts", () => {
      assert.ok(exists("apps/hosted-dashboard/walrus-sites/sites-config.yaml"));
      assert.ok(exists("apps/hosted-dashboard/walrus-sites/README.md"));
    });

    test("hosted-dashboard has hosted CLI pairing support", () => {
      assert.ok(exists("apps/hosted-dashboard/lib/hosted-state.ts"));
      assert.ok(exists("apps/hosted-dashboard/lib/cli-login.ts"));
      assert.ok(exists("apps/hosted-dashboard/app/api/cli-login/memwal-account/route.ts"));
      const source = readFileSync(
        join(ROOT, "apps/hosted-dashboard/app/cli-login/page.tsx"),
        "utf8",
      );
      assert.match(source, /activeRunRef/);
      assert.match(source, /Cancel wallet request/);
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
