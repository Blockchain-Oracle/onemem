import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import {
  EXPECTED_CLAUDE_MD,
  exists,
  GH_WORKFLOWS,
  isDir,
  ROOT,
  ROOT_CONFIGS,
  readJson,
  SCRIPTS,
} from "./helpers";

describe("OneMem monorepo structure", () => {
  describe("top-level dirs", () => {
    for (const d of [
      "packages",
      "apps",
      "contracts/onemem",
      "services",
      "demos",
      "scripts",
      "docs",
      ".thoughts",
      ".agents/plugins",
      ".github/workflows",
      ".changeset",
    ]) {
      test(`dir exists: ${d}`, () => {
        assert.ok(isDir(d), `expected dir: ${d}`);
      });
    }
  });

  describe("root configs", () => {
    for (const f of ROOT_CONFIGS) {
      test(`file exists: ${f}`, () => {
        assert.ok(exists(f), `expected file: ${f}`);
      });
    }
  });

  describe("GitHub workflows", () => {
    for (const w of GH_WORKFLOWS) {
      test(`workflow exists: ${w}`, () => {
        assert.ok(exists(`.github/workflows/${w}`), `expected workflow: ${w}`);
      });
    }

    test("release workflow uses provenance-aware TS publish script", () => {
      const workflow = readFileSync(join(ROOT, ".github/workflows/release.yml"), "utf8");
      assert.match(
        workflow,
        /NPM_TOKEN:\s*\$\{\{\s*secrets\.NPM_TOKEN\s*\}\}/,
        "release workflow must map NPM_TOKEN into job env before conditions",
      );
      assert.match(
        workflow,
        /PYPI_TOKEN:\s*\$\{\{\s*secrets\.PYPI_TOKEN\s*\}\}/,
        "release workflow must map PYPI_TOKEN into job env before conditions",
      );
      assert.match(
        workflow,
        /ONEMEM_NPM_TRUSTED_PUBLISHING:\s*\$\{\{\s*vars\.ONEMEM_NPM_TRUSTED_PUBLISHING\s*\}\}/,
        "release workflow must expose an explicit trusted-publishing opt-in",
      );
      assert.match(
        workflow,
        /publish:\s*bash scripts\/publish-all\.sh ts/,
        "Changesets release must route TS publishing through scripts/publish-all.sh",
      );
      assert.match(
        workflow,
        /PUBLISH_ALL_NPM_PROVENANCE:\s*"1"/,
        "release workflow must opt npm publishing into provenance",
      );
      assert.match(
        workflow,
        /NPM_CONFIG_ACCESS:\s*public/,
        "release workflow must preserve public scoped package publishing",
      );
      assert.match(
        workflow,
        /NODE_AUTH_TOKEN:\s*\$\{\{\s*env\.NPM_TOKEN\s*\}\}/,
        "release workflow must support token-based npm publishing",
      );
    });

    test("release workflow gates registry publishing on credentials", () => {
      const workflow = readFileSync(join(ROOT, ".github/workflows/release.yml"), "utf8");
      const changesetsActionCount = [...workflow.matchAll(/uses:\s*changesets\/action@v1/g)].length;
      assert.equal(
        changesetsActionCount,
        2,
        "release workflow must keep separate version-only and publish-capable Changesets paths",
      );
      const versionStart = workflow.indexOf("- name: Create Release PR without npm publish");
      const publishStart = workflow.indexOf("- name: Create Release PR or publish to npm");
      const pypiNoticeStart = workflow.indexOf("- name: Report PyPI publish disabled");
      assert.ok(versionStart > -1, "missing version-only Changesets step");
      assert.ok(publishStart > versionStart, "missing publish-capable Changesets step");
      assert.ok(pypiNoticeStart > publishStart, "missing PyPI notice step");

      const versionOnlyStep = workflow.slice(versionStart, publishStart);
      const publishStep = workflow.slice(publishStart, pypiNoticeStart);
      assert.match(
        versionOnlyStep,
        /if:\s*\$\{\{\s*env\.NPM_TOKEN == '' && env\.ONEMEM_NPM_TRUSTED_PUBLISHING != '1' && env\.ONEMEM_NPM_TRUSTED_PUBLISHING != 'true'\s*\}\}/,
        "version-only Changesets path must run only when npm publish is disabled",
      );
      assert.doesNotMatch(
        versionOnlyStep,
        /publish:\s/,
        "version-only Changesets path must not include a publish input",
      );
      assert.match(
        publishStep,
        /if:\s*\$\{\{\s*env\.NPM_TOKEN != '' \|\| env\.ONEMEM_NPM_TRUSTED_PUBLISHING == '1' \|\| env\.ONEMEM_NPM_TRUSTED_PUBLISHING == 'true'\s*\}\}/,
        "publish Changesets path must require token auth or explicit trusted-publishing opt-in",
      );
      assert.match(publishStep, /publish:\s*bash scripts\/publish-all\.sh ts/);
      assert.match(
        publishStep,
        /NODE_AUTH_TOKEN:\s*\$\{\{\s*env\.NPM_TOKEN\s*\}\}/,
        "release workflow must support token-based npm publishing",
      );
      assert.match(
        workflow,
        /if:\s*\$\{\{\s*steps\.changesets\.outputs\.published == 'true' && env\.PYPI_TOKEN != ''\s*\}\}/,
        "Python publish must require successful TS publish and a PyPI token",
      );
      assert.match(
        workflow,
        /UV_PUBLISH_TOKEN:\s*\$\{\{\s*env\.PYPI_TOKEN\s*\}\}/,
        "Python publish must pass the mapped PyPI token to uv",
      );
    });

    test("CI exposes deterministic demo matrix gate", () => {
      const workflow = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");
      assert.match(workflow, /Verify deterministic demo matrix/);
      assert.match(workflow, /pnpm test:demo-matrix/);
    });
  });

  describe("scripts", () => {
    for (const s of SCRIPTS) {
      test(`scripts/${s} exists`, () => {
        assert.ok(exists(`scripts/${s}`));
      });
    }

    test("shell scripts have executable bit", () => {
      for (const s of SCRIPTS.filter((x) => x.endsWith(".sh"))) {
        const stat = statSync(join(ROOT, `scripts/${s}`));
        // Owner-execute bit (0o100): non-zero means executable for owner.
        assert.ok((stat.mode & 0o100) !== 0, `scripts/${s} must be executable (chmod +x)`);
      }
    });

    test("publish-all fails honestly on Python publish errors", () => {
      const script = readFileSync(join(ROOT, "scripts/publish-all.sh"), "utf8");
      assert.match(script, /PUBLISH_ALL_DRY_RUN/, "publish-all needs a dry-run gate");
      assert.match(script, /--trusted-publishing never/, "dry runs must not probe OIDC");
      assert.match(
        script,
        /uv build "\$pkg" --out-dir "\$pkg\/dist" --clear/,
        "uv build must use explicit package dist",
      );
      assert.match(
        script,
        /uv publish "\$\{publish_args\[@\]\}"/,
        "uv publish must use args array",
      );
      assert.doesNotMatch(script, /uv publish\s*\|\|/, "uv publish errors must not be swallowed");
      assert.doesNotMatch(script, /skeleton/, "publish script must not claim PyPI is skeleton");
    });

    test("publish-all configures TS npm public access and optional provenance", () => {
      const script = readFileSync(join(ROOT, "scripts/publish-all.sh"), "utf8");
      assert.match(
        script,
        /NPM_CONFIG_ACCESS="\$\{NPM_CONFIG_ACCESS:-public\}"/,
        "TS npm publish must default to public access for first-time scoped packages",
      );
      assert.match(
        script,
        /NODE_AUTH_TOKEN="\$NPM_TOKEN"/,
        "TS npm publish must forward NPM_TOKEN for token-based releases",
      );
      assert.match(
        script,
        /PUBLISH_ALL_NPM_PROVENANCE:-0/,
        "TS npm publish must have an explicit provenance switch",
      );
      assert.match(
        script,
        /NPM_CONFIG_PROVENANCE="\$\{NPM_CONFIG_PROVENANCE:-true\}"/,
        "provenance switch must set npm provenance config",
      );
    });

    test("registry status preflight checks npm and PyPI without publishing", () => {
      const manifest = readJson<{ scripts?: Record<string, string> }>("package.json");
      assert.equal(
        manifest.scripts?.["registry:status"],
        "python scripts/check-registry-status.py",
      );

      const script = readFileSync(join(ROOT, "scripts/check-registry-status.py"), "utf8");
      assert.match(script, /https:\/\/registry\.npmjs\.org/);
      assert.match(script, /https:\/\/pypi\.org\/pypi/);
      assert.match(script, /tomllib/, "script must parse pyproject.toml structurally");
      assert.match(script, /--strict/, "script must support exact publication checks");
      assert.doesNotMatch(
        script,
        /(?:npm|uv|twine)\s+publish/,
        "status preflight must not upload packages",
      );
    });

    test("root package exposes deterministic demo matrix script", () => {
      const manifest = readJson<{ scripts?: Record<string, string> }>("package.json");
      assert.equal(
        manifest.scripts?.["test:demo-matrix"],
        "turbo run test typecheck lint build --filter=./demos/*",
      );
    });
  });

  describe("CLAUDE.md inventory", () => {
    test("exactly 5 CLAUDE.md files (root + 4 load-bearing per-package)", () => {
      const present = EXPECTED_CLAUDE_MD.filter(exists);
      assert.equal(
        present.length,
        EXPECTED_CLAUDE_MD.length,
        `expected: ${EXPECTED_CLAUDE_MD.join(", ")} — present: ${present.join(", ")}`,
      );
    });

    test("root CLAUDE.md stays lean (≤ 80 lines)", () => {
      const lines = readFileSync(join(ROOT, "CLAUDE.md"), "utf8").split("\n").length;
      assert.ok(
        lines <= 80,
        `root CLAUDE.md is ${lines} lines — keep it ≤80 to avoid context bloat (loaded every interaction)`,
      );
    });
  });
});
