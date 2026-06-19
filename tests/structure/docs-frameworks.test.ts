import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { exists, ROOT } from "./helpers";

describe("OneMem monorepo structure", () => {
  describe("overview docs", () => {
    const OVERVIEW = "docs/05-our-architecture/00-overview";
    test("TESTING_STRATEGY.md exists in 00-overview", () => {
      assert.ok(
        exists(`${OVERVIEW}/TESTING_STRATEGY.md`),
        "TESTING_STRATEGY.md missing — it's the canonical two-tier testing policy",
      );
    });
    test("AGENTS.md routes to Context Engineering artifacts", () => {
      const agents = readFileSync(join(ROOT, "AGENTS.md"), "utf8");
      assert.ok(
        agents.includes(".thoughts/"),
        "AGENTS.md must point at the active Context Engineering artifact root",
      );
    });

    test("root README package count matches packages directory", () => {
      const packageCount = readdirSync(join(ROOT, "packages")).filter((entry) =>
        statSync(join(ROOT, "packages", entry)).isDirectory(),
      ).length;
      const readme = readFileSync(join(ROOT, "README.md"), "utf8");
      assert.ok(
        readme.includes(`packages/\` — ${packageCount} libraries`),
        `README.md package count must match packages/ (${packageCount})`,
      );
    });

    test("current docs entrypoints do not route to missing parent research files", () => {
      const currentEntrypoints = [
        "README.md",
        "docs/README.md",
        "docs/INDEX.md",
        "docs/03-target-runtimes/README.md",
        "docs/04-framework-providers/README.md",
        "docs/05-our-architecture/README.md",
      ];
      const missingParentRefs =
        /\.\.\/(?:WEDGE|DEEP_DIVE|MEM0_DEEP_DIVE|TRACE_AND_PROVIDERS|BRAND_AND_SURFACES_LEGACY)|\.\.\/\.\.\/(?:WEDGE|DEEP_DIVE|MEM0_DEEP_DIVE|TRACE_AND_PROVIDERS|BRAND_AND_SURFACES_LEGACY)/;

      for (const entrypoint of currentEntrypoints) {
        const body = readFileSync(join(ROOT, entrypoint), "utf8");
        assert.doesNotMatch(
          body,
          missingParentRefs,
          `${entrypoint} must route to files that exist in this checkout`,
        );
      }
    });

    test("framework provider overview documents shipped explicit memory helpers", () => {
      const overview = readFileSync(join(ROOT, "docs/04-framework-providers/README.md"), "utf8");
      const helpers = [
        ["@onemem/vercel-ai-provider", "createOneMemMemory"],
        ["@onemem/openai-agents", "createOneMemMemory"],
        ["onemem-crewai", "create_onemem_memory"],
        ["onemem-livekit", "create_onemem_memory"],
        ["onemem-elevenlabs", "create_onemem_memory"],
      ];
      for (const [pkg, helper] of helpers) {
        const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.match(
          overview,
          new RegExp(`\\|[^\\n]*\`${escaped}\`[^\\n]*${helper}`, "i"),
          `framework overview must mention ${helper} for ${pkg}`,
        );
      }
      assert.doesNotMatch(overview, /Python provider memory helpers remain follow-up work/i);
      assert.doesNotMatch(
        overview,
        /Memory recall\/capture helpers inside CrewAI, LiveKit, and ElevenLabs/i,
      );
    });

    test("framework architecture status does not mark built providers pending", () => {
      const architecture = readFileSync(
        join(ROOT, "docs/05-our-architecture/04-frameworks/README.md"),
        "utf8",
      );
      const builtProviders = [
        "@onemem/vercel-ai-provider",
        "@onemem/openai-agents",
        "onemem-crewai",
        "onemem-livekit",
        "onemem-elevenlabs",
      ];

      for (const provider of builtProviders) {
        const escaped = provider.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.doesNotMatch(
          architecture,
          new RegExp(`\\|\\s*\`${escaped}\`[^\\n]*\\|\\s*⏳ pending`, "i"),
          `framework architecture README must not mark built provider ${provider} as pending`,
        );
      }
      assert.match(
        architecture,
        /Current provider package[\s>]+READMEs and source are the API truth/,
        "framework architecture README must route readers to current package READMEs",
      );
      assert.match(
        architecture,
        /Python providers now ship matching explicit\s+`create_onemem_memory\(\.\.\.\)` helpers/,
        "framework architecture README must state Python explicit memory helpers are current",
      );
      assert.match(
        architecture,
        /original Mem0-style\/native provider\s+ergonomics remain tracked follow-ups/,
        "framework architecture README must keep native provider boundary explicit",
      );
    });

    test("public provider docs do not overclaim publication proof", () => {
      const providers = readFileSync(join(ROOT, "apps/docs/integrations/providers.mdx"), "utf8");
      assert.doesNotMatch(providers, /All published and live-tested on testnet/);
    });

    test("dashboard README does not mark built routes as pending", () => {
      const readme = readFileSync(
        join(ROOT, "docs/05-our-architecture/06-dashboard/README.md"),
        "utf8",
      );
      const builtRows = [
        "/",
        "/memories",
        "/apps",
        "/trace/[session_id]",
        "/sessions",
        "/share",
        "/settings",
        "/login",
        "/cli-login",
        "/onboarding",
        "/verify/[session_id]",
      ];
      for (const route of builtRows) {
        const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.doesNotMatch(
          readme,
          new RegExp(`\\|\\s*\`${escaped}\`[^\\n]*\\|\\s*⏳ pending`, "i"),
          `dashboard README must not mark built route ${route} as pending`,
        );
      }
    });

    test("CLI command surface does not advertise deferred commands as current", () => {
      const surface = readFileSync(
        join(ROOT, "docs/05-our-architecture/05-cli/command-surface.md"),
        "utf8",
      );
      const deferredCurrentHeadings = [
        "onemem logout",
        "onemem get",
        "onemem update",
        "onemem delete",
        "onemem list",
        "onemem history",
        "onemem export",
        "onemem namespace create",
        "onemem namespace list",
        "onemem namespace get",
        "onemem namespace deactivate",
        "onemem namespace reactivate",
        "onemem trace tree",
        "onemem trace end",
        "onemem replay",
        "onemem stats",
        "onemem set-namespace",
        "onemem set-agent",
        "onemem install --runtime",
        "onemem uninstall --runtime",
      ];
      for (const command of deferredCurrentHeadings) {
        const escaped = command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        assert.doesNotMatch(
          surface,
          new RegExp(`^###\\s+\`${escaped}`, "m"),
          `CLI command surface must not advertise deferred command as current: ${command}`,
        );
      }
    });

    test("CLI docs expose current dashboard launcher", () => {
      const docs = [
        "docs/05-our-architecture/05-cli/command-surface.md",
        "packages/cli-ts/README.md",
        "apps/docs/reference/cli.mdx",
      ];
      for (const doc of docs) {
        const content = readFileSync(join(ROOT, doc), "utf8");
        assert.match(content, /onemem dashboard/, `${doc} must document onemem dashboard`);
      }

      const surface = readFileSync(
        join(ROOT, "docs/05-our-architecture/05-cli/command-surface.md"),
        "utf8",
      );
      assert.doesNotMatch(surface, /-\s+`onemem dashboard`/);
      assert.match(surface, /onemem-dashboard/);
    });

    test("CLI docs expose current namespace commands and local network", () => {
      const docs = [
        "docs/05-our-architecture/05-cli/command-surface.md",
        "packages/cli-ts/README.md",
        "apps/docs/reference/cli.mdx",
      ];
      for (const doc of docs) {
        const content = readFileSync(join(ROOT, doc), "utf8");
        for (const command of [
          "onemem namespace share",
          "onemem namespace revoke",
          "onemem namespace admin-revoke",
          "onemem namespace capabilities",
        ]) {
          assert.match(content, new RegExp(command), `${doc} must document ${command}`);
        }
        assert.match(content, /local/, `${doc} must include the local network option`);
      }
    });

    test("CLI historical design docs are clearly marked", () => {
      const historicalDocs = [
        "docs/05-our-architecture/05-cli/cli-typescript-impl.md",
        "docs/05-our-architecture/05-cli/cli-python-impl.md",
        "docs/05-our-architecture/05-cli/output-design.md",
      ];
      for (const doc of historicalDocs) {
        const content = readFileSync(join(ROOT, doc), "utf8");
        assert.match(content, /Historical note, 2026-06-17/, `${doc} needs a historical note`);
        assert.match(
          content,
          /command-surface\.md/,
          `${doc} must route current truth to command-surface.md`,
        );
      }

      const loginFlow = readFileSync(
        join(ROOT, "docs/05-our-architecture/05-cli/login-flow.md"),
        "utf8",
      );
      assert.match(
        loginFlow,
        /Current implementation note, 2026-06-17/,
        "login-flow.md must state current implementation assumptions",
      );
      assert.doesNotMatch(
        loginFlow,
        /12340|onemem logout/,
        "login-flow.md must not advertise fixed callback ports or current logout",
      );
    });
  });
});
