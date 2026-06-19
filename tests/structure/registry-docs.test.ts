import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { ROOT } from "./helpers";

function readText(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("registry-aware docs", () => {
  test("public install docs expose the current registry proof boundary", () => {
    const docs = [
      "README.md",
      "apps/docs/quickstart.mdx",
      "apps/docs/reference/cli.mdx",
      "apps/docs/integrations/providers.mdx",
      "apps/docs/integrations/runtimes.mdx",
    ];

    for (const doc of docs) {
      assert.match(
        readText(doc),
        /pnpm registry:status --strict/,
        `${doc} must point readers at strict registry status before publication claims`,
      );
    }

    const cliReference = readText("apps/docs/reference/cli.mdx");
    for (const packageName of ["@onemem/cli", "@onemem/dashboard", "onemem-cli"]) {
      assert.match(cliReference, new RegExp(packageName), `CLI docs must name ${packageName}`);
    }
  });

  test("published package READMEs contain registry proof notes", () => {
    const packageReadmes = [
      "packages/cli-ts/README.md",
      "packages/dashboard/README.md",
      "packages/cli-python/README.md",
      "packages/sdk-python/README.md",
      "packages/plugin-claude-code/README.md",
      "packages/plugin-hermes/README.md",
      "packages/provider-vercel-ai/README.md",
      "packages/provider-openai-agents/README.md",
      "packages/provider-crewai/README.md",
      "packages/provider-livekit/README.md",
      "packages/provider-elevenlabs/README.md",
    ];

    for (const doc of packageReadmes) {
      const content = readText(doc);
      assert.match(
        content,
        /Publication note, 2026-06-(18|19)|Publication\/proof note, 2026-06-18/,
      );
      if (doc === "packages/cli-ts/README.md") {
        assert.match(content, /@onemem\/cli@0\.6\.3/);
        assert.match(content, /npm exec --yes --package @onemem\/cli@0\.6\.3 --/);
      } else {
        assert.match(
          content,
          /current on\s+(npm|PyPI)/,
          `${doc} must state current registry status`,
        );
      }
      assert.match(
        content,
        /pnpm registry:status\s+--strict/,
        `${doc} must cite strict registry status`,
      );
    }
  });

  test("provider docs state helper APIs are in current registry artifacts", () => {
    const providers = readText("apps/docs/integrations/providers.mdx");
    assert.match(providers, /explicit memory helper APIs/);
    assert.match(providers, /current on public\s+registry artifacts/);
    assert.match(providers, /pnpm registry:status --strict/);

    const architecture = readText("docs/05-our-architecture/04-frameworks/README.md");
    assert.match(architecture, /current on\s+public registries/);
    assert.match(architecture, /with explicit memory helper/);
  });

  test("runtime docs keep marketplace install, npm publication, and hook proof separate", () => {
    const runtimes = readText("docs/05-our-architecture/03-runtimes/README.md");
    assert.match(runtimes, /Repository marketplace\s+install is current/);
    assert.match(runtimes, /runtime npm\/PyPI packages are current/);
    assert.match(runtimes, /Trusted Codex\/Claude\s+hook proof is recorded/);

    const claude = readText("packages/plugin-claude-code/README.md");
    assert.match(claude, /marketplace path is current/);
    assert.match(claude, /current on npm/);
    assert.match(claude, /trusted live Claude Code session emitted testnet TraceSession/);
  });

  test("MCP README treats the published package as the primary public path", () => {
    const readme = readText("packages/mcp-server/README.md");
    assert.match(readme, /claude mcp add onemem -- npx -y @onemem\/mcp@latest/);
    assert.match(readme, /development checkout/);
    assert.doesNotMatch(readme, /once published:\s+claude mcp add onemem -- npx/);
  });
});
