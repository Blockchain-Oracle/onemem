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

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function assertSvg(rel: string) {
  assert.ok(exists(rel), `${rel} must exist`);
  const svg = read(rel);
  assert.match(svg, /<svg[\s>]/, `${rel} must be SVG`);
  assert.match(svg, /<\/svg>\s*$/, `${rel} must close the SVG root`);
  assert.ok(svg.length > 300, `${rel} must not be an empty placeholder`);
  assert.doesNotMatch(svg, /TODO|placeholder|lorem/i, `${rel} must be production copy`);
}

describe("brand package assets", () => {
  test("@onemem/brand exports populated logo and social asset directories", () => {
    const pkg = readJson<{ exports: Record<string, string>; files: string[] }>(
      "packages/brand/package.json",
    );
    assert.equal(pkg.exports["./logo/*"], "./logo/*");
    assert.equal(pkg.exports["./og-images/*"], "./og-images/*");
    assert.ok(pkg.files.includes("logo"));
    assert.ok(pkg.files.includes("og-images"));
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

  test("brand README documents inventory, identity, and raster boundary", () => {
    const readme = read("packages/brand/README.md");
    for (const rel of [...LOGO_ASSETS, ...Object.keys(SOCIAL_ASSETS)]) {
      assert.match(readme, new RegExp(basename(rel).replace(".", "\\.")), `${rel} missing`);
    }
    assert.match(readme, /onememe\.xyz/);
    assert.match(readme, /@OneMemAI/);
    assert.match(readme, /SVG source assets/);
    assert.match(readme, /PNG exports/);
  });
});
