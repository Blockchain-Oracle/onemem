import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

import { ROOT } from "./helpers";

function readText(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("registry-aware docs", () => {
  test("public install docs expose the current registry boundary", () => {
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
        /pnpm registry:status/,
        `${doc} must point readers at live registry status before publication claims`,
      );
    }

    const cliReference = readText("apps/docs/reference/cli.mdx");
    for (const missingPackage of ["@onemem/cli", "@onemem/dashboard", "onemem-cli"]) {
      assert.match(
        cliReference,
        new RegExp(missingPackage),
        `CLI docs must name ${missingPackage}`,
      );
    }
  });

  test("missing or drifted package READMEs contain publication notes", () => {
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
      assert.match(content, /Publication note, 2026-06-18|Publication\/proof note, 2026-06-18/);
      assert.match(content, /pnpm registry:status/, `${doc} must cite registry status`);
    }
  });

  test("provider docs distinguish source helpers from stale registry artifacts", () => {
    const providers = readText("apps/docs/integrations/providers.mdx");
    assert.match(providers, /explicit memory helper APIs/);
    assert.match(providers, /pending publish/);
    assert.match(providers, /before claiming npm\/PyPI install proof/);

    const architecture = readText("docs/05-our-architecture/04-frameworks/README.md");
    assert.match(architecture, /source is ahead of published artifacts/);
    assert.match(architecture, /do\s+not contain the explicit memory helper APIs/);
  });

  test("runtime docs keep marketplace install, npm publication, and hook proof separate", () => {
    const runtimes = readText("docs/05-our-architecture/03-runtimes/README.md");
    assert.match(runtimes, /Repository marketplace\s+install is current/);
    assert.match(runtimes, /missing on\s+npm/);
    assert.match(runtimes, /script-level hook\s+proof/);

    const claude = readText("packages/plugin-claude-code/README.md");
    assert.match(claude, /current install surface/);
    assert.match(claude, /missing from npm/);
    assert.match(
      claude,
      /trusted live Claude Code client hook session is a\s+separate proof boundary/,
    );
  });

  test("MCP README treats the published package as the primary public path", () => {
    const readme = readText("packages/mcp-server/README.md");
    assert.match(readme, /claude mcp add onemem -- npx -y @onemem\/mcp@latest/);
    assert.match(readme, /development checkout/);
    assert.doesNotMatch(readme, /once published:\s+claude mcp add onemem -- npx/);
  });
});
