import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { ROOT } from "./helpers";

const migrateScript = () => readFileSync(join(ROOT, "scripts/migrate-contract.sh"), "utf8");
const verifyScript = () => readFileSync(join(ROOT, "scripts/verify-mainnet.sh"), "utf8");

describe("deployment scripts", () => {
  describe("contract migration safety", () => {
    test("migrate script supports explicit non-mutating dry runs", () => {
      const script = migrateScript();
      assert.match(script, /--dry-run/, "upgrade script must expose dry-run mode");
      assert.match(script, /DRY_RUN_ONLY/, "upgrade script must track dry-run-only mode");
      assert.match(
        script,
        /DRY_RUN_OUT="\$\(run_upgrade dry-run\)"/,
        "upgrade script must run the dry-run helper",
      );
      assert.match(
        script,
        /No repo files were updated\./,
        "dry-run mode must explicitly avoid local manifest updates",
      );

      const dryRunExit = script.indexOf('if [ "$DRY_RUN_ONLY" -eq 1 ]; then');
      const manifestUpdate = script.indexOf(".networks[$net].package_id = $pkg");
      assert.ok(dryRunExit > -1, "missing dry-run-only exit branch");
      assert.ok(
        manifestUpdate > dryRunExit,
        "manifest update must happen after dry-run exit branch",
      );
    });

    test("live upgrades run preflight before execution", () => {
      const script = migrateScript();
      const preflight = script.indexOf('DRY_RUN_OUT="$(run_upgrade dry-run)"');
      const live = script.indexOf('UPGRADE_OUT="$(run_upgrade live)"');
      assert.ok(preflight > -1, "missing dry-run preflight");
      assert.ok(live > preflight, "live upgrade must happen after dry-run preflight");
      assert.match(script, /sui "\$\{args\[@\]\}"/, "upgrade helper must preserve args array");
    });

    test("upgrade script reports the Sui CLI binary and version", () => {
      const script = migrateScript();
      assert.match(script, /SUI_BIN="\$\(command -v sui\)"/);
      assert.match(script, /SUI_VERSION="\$\(sui --version\)"/);
      assert.match(script, /==> Sui CLI: \$SUI_BIN \(\$SUI_VERSION\)/);
    });

    test("active Sui CLI environment is restored on exit", () => {
      const script = migrateScript();
      assert.match(script, /PREVIOUS_ENV="\$\(sui client active-env/);
      assert.match(script, /trap restore_env EXIT/);
      assert.match(
        script,
        /sui client switch --env "\$PREVIOUS_ENV"/,
        "restore hook must switch back to previous env",
      );
    });

    test("live upgrades update manifests and regenerate address artifacts", () => {
      const script = migrateScript();
      assert.match(
        script,
        /\.networks\[\$net\]\.package_id = \$pkg/,
        "config/networks.json package ID must be updated",
      );
      assert.match(script, /PUBLISHED_TOML/, "contracts/onemem/Published.toml must be updated");
      assert.match(script, /published-at/, "Published.toml update must refresh published-at");
      assert.match(
        script,
        /PUBLISHED_VERSION_BEFORE_UPGRADE/,
        "Published.toml package version must be captured before Sui CLI mutates it",
      );
      assert.match(
        script,
        /DESIRED_PUBLISHED_VERSION=\$\(\(PUBLISHED_VERSION_BEFORE_UPGRADE \+ 1\)\)/,
        "Published.toml package version must be pinned to previous + 1",
      );
      assert.doesNotMatch(
        script,
        /version \+ 1 if version else 1/,
        "Published.toml updater must not double-increment the Sui CLI updated value",
      );
      assert.match(
        script,
        /pnpm exec tsx scripts\/codegen-move-types\.ts/,
        "TypeScript generated addresses must refresh",
      );
      assert.match(
        script,
        /uv run python scripts\/codegen-move-python\.py/,
        "Python generated addresses must refresh",
      );
    });

    test("upgrade output parsing fails loudly on missing critical fields", () => {
      const script = migrateScript();
      assert.match(script, /extract_package_id\(\)/);
      assert.match(script, /extract_digest\(\)/);
      assert.match(script, /Could not parse new package ID/);
      assert.match(script, /Could not parse transaction digest/);
      assert.match(script, /Full JSON:/, "parse failures must show the raw Sui response");
    });

    test("verify script accepts upgraded shared object type origins", () => {
      const script = verifyScript();
      assert.match(script, /REG_TYPE_SUFFIX="::registry::OneMemRegistry"/);
      assert.match(script, /REG_TYPE_PACKAGE=/);
      assert.doesNotMatch(
        script,
        /EXPECTED_REG_TYPE="\$\{PACKAGE_ID\}::registry::OneMemRegistry"/,
        "shared registry objects keep their original package type after upgrades",
      );
    });
  });
});
