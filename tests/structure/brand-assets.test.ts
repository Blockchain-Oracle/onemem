import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, test } from "node:test";
import { exists, ROOT, readJson } from "./helpers";

const LOGO_ASSETS = [
  "packages/brand/logo/onemem-mark.svg",
  "packages/brand/logo/onemem-mark-mono.svg",
  "packages/brand/logo/onemem-wordmark.svg",
  "packages/brand/logo/onemem-lockup-horizontal.svg",
  "packages/brand/logo/onemem-lockup-dark.svg",
  "packages/brand/logo/onemem-lockup-light.svg",
] as const;

const REMOVED_OUTPUTS = [
  "packages/brand/campaign",
  "packages/brand/og-images",
  "packages/brand/video",
  "packages/brand/video/onemem-intro",
  "packages/brand/video/onemem-demo",
  "packages/brand/video/scripts",
] as const;

const REQUIRED_VENDOR_IDS = [
  "sui",
  "walrus",
  "seal",
  "memwal",
  "claude-code",
  "codex",
  "openclaw",
  "hermes-agent",
  "model-context-protocol",
  "vercel-ai-sdk",
  "openai-agents",
  "crewai",
  "livekit",
  "elevenlabs",
] as const;

type VendorManifest = {
  purpose: string;
  usageCaution: string;
  assets: Array<{
    id: string;
    label: string;
    category: string;
    files: string[];
    sourceType: string;
    source: string;
  }>;
};

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function assertSvg(rel: string, minLength = 300) {
  assert.ok(exists(rel), `${rel} must exist`);
  const svg = read(rel);
  assert.match(svg, /<svg[\s>]/, `${rel} must be SVG`);
  assert.match(svg, /<\/svg>\s*$/, `${rel} must close the SVG root`);
  assert.ok(svg.length > minLength, `${rel} must not be an empty placeholder`);
  assert.doesNotMatch(svg, /TODO|placeholder|lorem/i, `${rel} must be production copy`);
}

describe("brand package assets", () => {
  test("@onemem/brand exports kept source directories only", () => {
    const pkg = readJson<{ exports: Record<string, string>; files: string[] }>(
      "packages/brand/package.json",
    );
    assert.equal(pkg.exports["./logo/*"], "./logo/*");
    assert.equal(pkg.exports["./vendor-logos/*"], "./vendor-logos/*");
    assert.equal(pkg.exports["./media-kit/*"], "./media-kit/*");
    assert.equal(pkg.exports["./briefs/*"], "./briefs/*");
    assert.equal(pkg.exports["./designer-campaign/*"], "./designer-campaign/*");
    assert.equal(pkg.exports["./ASSET_CLEANUP.md"], "./ASSET_CLEANUP.md");
    assert.ok(pkg.files.includes("logo"));
    assert.ok(pkg.files.includes("vendor-logos"));
    assert.ok(pkg.files.includes("media-kit"));
    assert.ok(pkg.files.includes("briefs"));
    assert.ok(pkg.files.includes("designer-campaign"));
    assert.ok(pkg.files.includes("ASSET_CLEANUP.md"));
    assert.equal(pkg.exports["./campaign/*"], undefined);
    assert.equal(pkg.exports["./og-images/*"], undefined);
    assert.equal(pkg.files.includes("campaign"), false);
    assert.equal(pkg.files.includes("og-images"), false);
  });

  test("old generated campaign images, OG cards, and video workspaces are removed", () => {
    for (const rel of REMOVED_OUTPUTS) {
      assert.equal(exists(rel), false, `${rel} should stay removed after cleanup`);
    }

    for (const rel of [
      "packages/brand/video/onemem-demo/public/footage/switch-laptops-runtime-continuity.mp4",
      "packages/brand/video/onemem-demo/public/footage/agent-sends-money.mp4",
      "packages/brand/video/onemem-demo/public/footage/verifiable-research-agent.mp4",
      "packages/brand/video/onemem-demo/public/footage/multi-agent-coordination.mp4",
    ]) {
      assert.equal(exists(rel), false, `${rel} should not be checked in`);
    }
  });

  test("canonical logo SVGs exist and use the cube memory/proof mark", () => {
    for (const rel of LOGO_ASSETS) {
      assertSvg(rel);
      const svg = read(rel);
      assert.match(svg, /OneMem/i, `${basename(rel)} must identify OneMem`);
    }

    const mark = read("packages/brand/logo/onemem-mark.svg");
    assert.match(mark, /#ffffff/i, "mark must preserve cream-first app icon base");
    assert.match(mark, /#0a924b/i, "mark must preserve cdr-kit verify green");
    assert.match(mark, /#3959da/i, "mark must preserve cdr-kit indigo trace");
    assert.match(mark, /M18 22\.5 32 15l14 7\.5/, "mark must preserve cube geometry");
  });

  test("brand README documents identity and cleanup boundary", () => {
    const readme = read("packages/brand/README.md");
    for (const rel of LOGO_ASSETS) {
      assert.match(readme, new RegExp(basename(rel).replace(".", "\\.")), `${rel} missing`);
    }
    assert.match(readme, /onemem\.xyz/);
    assert.match(readme, /docs\.onemem\.xyz/);
    assert.match(readme, /x\.com\/OneMemAI/);
    assert.match(readme, /campaign\/` and `og-images\/` folders were removed/);
    assert.match(readme, /Old video workspaces are also not packaged/);
    assert.match(readme, /designer-campaign\/audio\/onemem-launch-bed\.wav/);
    assert.match(readme, /designer-campaign\/exports\/video\/onemem-launch-30s\.mp4/);
    assert.match(readme, /ASSET_CLEANUP\.md/);
    assert.match(readme, /reference-only/);
    assert.doesNotMatch(readme, /video\/onemem-demo\/public\/audio/);
    assert.doesNotMatch(readme, /OpenClaude|onemem\.ai|docs\.onemem\.ai/i);
  });

  test("designer campaign keeps current video and audio without stale video packages", () => {
    for (const rel of [
      "packages/brand/designer-campaign/audio/onemem-launch-bed.wav",
      "packages/brand/designer-campaign/exports/video/onemem-launch-30s.mp4",
      "packages/brand/designer-campaign/exports/manifest.json",
      "packages/brand/designer-campaign/scripts/export-designer-campaign.mjs",
    ]) {
      assert.ok(exists(rel), `${rel} must exist`);
    }

    const cleanup = read("packages/brand/ASSET_CLEANUP.md");
    assert.match(cleanup, /`video\/onemem-intro\/` - old HyperFrames intro workspace/);
    assert.match(
      cleanup,
      /`video\/onemem-demo\/` - old Remotion demo\/launch\/live-proof workspace/,
    );
    assert.doesNotMatch(cleanup, /video\/onemem-demo\/public\/audio\/\*\.wav/);
  });

  test("vendor manifest includes supported runtime, protocol, and framework logos", () => {
    const manifest = readJson<VendorManifest>("packages/brand/vendor-logos/manifest.json");
    const ids = new Set(manifest.assets.map((asset) => asset.id));
    for (const id of REQUIRED_VENDOR_IDS) {
      assert.ok(ids.has(id), `missing vendor id ${id}`);
    }

    for (const asset of manifest.assets) {
      for (const file of asset.files) {
        assert.ok(exists(`packages/brand/vendor-logos/${file}`), `${asset.id} file missing`);
      }
    }
    assert.match(manifest.usageCaution, /truthful/i);
  });
});
