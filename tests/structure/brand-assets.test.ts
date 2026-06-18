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

const SOCIAL_ASSETS = {
  "packages/brand/og-images/x-banner.svg": "1500 500",
  "packages/brand/og-images/discord-banner.svg": "1920 480",
  "packages/brand/og-images/github-og.svg": "1200 630",
  "packages/brand/og-images/product-card.svg": "1080 1080",
  "packages/brand/og-images/demo-video-cover.svg": "1920 1080",
} as const;

const SOCIAL_PNG_EXPORTS = {
  "packages/brand/og-images/x-banner.png": [1500, 500],
  "packages/brand/og-images/discord-banner.png": [1920, 480],
  "packages/brand/og-images/github-og.png": [1200, 630],
  "packages/brand/og-images/product-card.png": [1080, 1080],
  "packages/brand/og-images/demo-video-cover.png": [1920, 1080],
} as const;

const CAMPAIGN_ASSETS = {
  "packages/brand/campaign/readme-hero.svg": [1400, 360],
  "packages/brand/campaign/x-header.svg": [1500, 500],
  "packages/brand/campaign/link-card.svg": [1200, 630],
  "packages/brand/campaign/tools-grid.svg": [1600, 900],
  "packages/brand/campaign/architecture.svg": [1920, 1080],
  "packages/brand/campaign/motion-storyboard.svg": [1920, 1080],
} as const;

const CAMPAIGN_PNG_EXPORTS = {
  "packages/brand/campaign/readme-hero.png": [1400, 360],
  "packages/brand/campaign/x-header.png": [1500, 500],
  "packages/brand/campaign/link-card.png": [1200, 630],
  "packages/brand/campaign/tools-grid.png": [1600, 900],
  "packages/brand/campaign/architecture.png": [1920, 1080],
  "packages/brand/campaign/motion-storyboard.png": [1920, 1080],
} as const;

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

function readBytes(rel: string): Buffer {
  return readFileSync(join(ROOT, rel));
}

function assertSvg(rel: string, minLength = 300) {
  assert.ok(exists(rel), `${rel} must exist`);
  const svg = read(rel);
  assert.match(svg, /<svg[\s>]/, `${rel} must be SVG`);
  assert.match(svg, /<\/svg>\s*$/, `${rel} must close the SVG root`);
  assert.ok(svg.length > minLength, `${rel} must not be an empty placeholder`);
  assert.doesNotMatch(svg, /TODO|placeholder|lorem/i, `${rel} must be production copy`);
}

function assertPng(rel: string, width: number, height: number) {
  assert.ok(exists(rel), `${rel} must exist`);
  const png = readBytes(rel);
  assert.ok(png.length > 1000, `${rel} must not be an empty placeholder`);
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${rel} signature`);
  assert.equal(png.readUInt32BE(16), width, `${rel} width must be ${width}`);
  assert.equal(png.readUInt32BE(20), height, `${rel} height must be ${height}`);
}

describe("brand package assets", () => {
  test("@onemem/brand exports populated logo and social asset directories", () => {
    const pkg = readJson<{ exports: Record<string, string>; files: string[] }>(
      "packages/brand/package.json",
    );
    assert.equal(pkg.exports["./logo/*"], "./logo/*");
    assert.equal(pkg.exports["./og-images/*"], "./og-images/*");
    assert.equal(pkg.exports["./campaign/*"], "./campaign/*");
    assert.equal(pkg.exports["./vendor-logos/*"], "./vendor-logos/*");
    assert.ok(pkg.files.includes("logo"));
    assert.ok(pkg.files.includes("og-images"));
    assert.ok(pkg.files.includes("campaign"));
    assert.ok(pkg.files.includes("vendor-logos"));
  });

  test("canonical logo SVGs exist and use the cube memory/proof mark", () => {
    for (const rel of LOGO_ASSETS) {
      assertSvg(rel);
      const svg = read(rel);
      assert.match(svg, /OneMem/i, `${basename(rel)} must identify OneMem`);
    }

    const mark = read("packages/brand/logo/onemem-mark.svg");
    assert.match(mark, /#171717/i, "mark must preserve dark app icon base");
    assert.match(mark, /#d4ff5e/i, "mark must preserve verify lime");
    assert.match(mark, /#8f7cff/i, "mark must preserve violet trace");
    assert.match(mark, /M18 22\.5 32 15l14 7\.5/, "mark must preserve cube geometry");
  });

  test("social SVG templates have fixed target dimensions and public identity", () => {
    for (const [rel, dims] of Object.entries(SOCIAL_ASSETS)) {
      assertSvg(rel);
      const svg = read(rel);
      const [width, height] = dims.split(" ");
      assert.match(svg, new RegExp(`width="${width}"`), `${rel} width must be ${width}`);
      assert.match(svg, new RegExp(`height="${height}"`), `${rel} height must be ${height}`);
      assert.match(svg, /onememe\.xyz/, `${rel} must use the active public domain`);
      assert.match(svg, /OneMemAI/, `${rel} must use the active X handle`);
    }
  });

  test("social PNG exports exist and match source dimensions", () => {
    for (const [rel, [width, height]] of Object.entries(SOCIAL_PNG_EXPORTS)) {
      assertPng(rel, width, height);
    }
  });

  test("campaign SVG and PNG assets are generated with fixed dimensions", () => {
    for (const [rel, [width, height]] of Object.entries(CAMPAIGN_ASSETS)) {
      assertSvg(rel);
      const svg = read(rel);
      assert.match(svg, new RegExp(`width="${width}"`), `${rel} width must be ${width}`);
      assert.match(svg, new RegExp(`height="${height}"`), `${rel} height must be ${height}`);
      assert.match(svg, /OneMem/, `${rel} must identify OneMem`);
      assert.match(svg, /x\.com\/OneMemAI/, `${rel} must include the X profile URL`);
      assert.doesNotMatch(svg, /OpenClaude|Stop trusting|Etherscan for AI agents/i);
    }

    for (const [rel, [width, height]] of Object.entries(CAMPAIGN_PNG_EXPORTS)) {
      assertPng(rel, width, height);
    }

    const campaignReadme = read("packages/brand/campaign/README.md");
    assert.match(campaignReadme, /One memory layer for every agent/);
    assert.match(campaignReadme, /onememe\.xyz/);
    assert.match(campaignReadme, /@OneMemAI/);
    assert.match(campaignReadme, /x\.com\/OneMemAI/);
    assert.match(campaignReadme, /OpenClaw/);
    assert.doesNotMatch(campaignReadme, /OpenClaude/);
  });

  test("brand README documents inventory, identity, and raster boundary", () => {
    const readme = read("packages/brand/README.md");
    for (const rel of [
      ...LOGO_ASSETS,
      ...Object.keys(SOCIAL_ASSETS),
      ...Object.keys(SOCIAL_PNG_EXPORTS),
    ]) {
      assert.match(readme, new RegExp(basename(rel).replace(".", "\\.")), `${rel} missing`);
    }
    assert.match(readme, /onememe\.xyz/);
    assert.match(readme, /@OneMemAI/);
    assert.match(readme, /SVG source assets/);
    assert.match(readme, /platform-ready PNG exports/i);
  });

  test("vendor logo manifest maps supported ecosystem marks to checked-in files", () => {
    assert.ok(exists("packages/brand/vendor-logos/README.md"));
    const manifest = readJson<VendorManifest>("packages/brand/vendor-logos/manifest.json");

    assert.match(manifest.purpose, /OneMem social assets/);
    assert.match(manifest.usageCaution, /Third-party logos are trademarks/);
    assert.ok(manifest.assets.length >= 30, "vendor inventory must be broad enough for launch art");

    const ids = new Set<string>();
    for (const asset of manifest.assets) {
      assert.ok(asset.id, "vendor asset id is required");
      assert.ok(asset.label, `${asset.id} label is required`);
      assert.ok(asset.category, `${asset.id} category is required`);
      assert.ok(asset.sourceType, `${asset.id} sourceType is required`);
      assert.ok(asset.source, `${asset.id} source is required`);
      assert.ok(asset.files.length > 0, `${asset.id} must list at least one file`);
      assert.equal(ids.has(asset.id), false, `${asset.id} must be unique`);
      ids.add(asset.id);

      for (const file of asset.files) {
        assert.doesNotMatch(file, /\.\./, `${asset.id} file paths must stay in vendor-logos`);
        assert.match(file, /^(svg|png)\/.+\.(svg|png)$/);
        const rel = `packages/brand/vendor-logos/${file}`;
        assert.ok(exists(rel), `${rel} must exist`);
        if (file.endsWith(".svg")) {
          assertSvg(rel, 100);
        } else {
          const png = readBytes(rel);
          assert.ok(png.length > 1000, `${rel} must not be an empty placeholder`);
          assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${rel} signature`);
        }
      }
    }

    for (const id of REQUIRED_VENDOR_IDS) {
      assert.ok(ids.has(id), `vendor logo manifest must include ${id}`);
    }
  });
});
