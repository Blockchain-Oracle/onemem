import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, test } from "node:test";
import { exists, ROOT, readJson } from "./helpers";

type MediaKit = {
  identity: Record<string, string>;
  guardrails: string[];
  assetGroups: Array<{
    id: string;
    assets: Array<{ label: string; file: string; sizeBytes: number }>;
  }>;
  logoGroups: Array<{
    id: string;
    assets: Array<{ id: string; label: string; preferredFile: string; files: string[] }>;
  }>;
  proofBoundary: string;
};

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function assertBrandFile(rel: string) {
  assert.ok(exists(`packages/brand/${rel}`), `${rel} must exist`);
}

describe("brand media kit", () => {
  test("package exports the generated media kit", () => {
    const pkg = readJson<{
      exports: Record<string, string>;
      files: string[];
      scripts: Record<string, string>;
    }>("packages/brand/package.json");
    assert.equal(pkg.exports["./ASSET_CLEANUP.md"], "./ASSET_CLEANUP.md");
    assert.equal(pkg.exports["./media-kit/*"], "./media-kit/*");
    assert.equal(pkg.exports["./briefs/*"], "./briefs/*");
    assert.ok(pkg.files.includes("media-kit"));
    assert.ok(pkg.files.includes("briefs"));
    assert.ok(pkg.files.includes("ASSET_CLEANUP.md"));
    assert.equal(pkg.scripts["media-kit:generate"], "node media-kit/generate-media-kit.mjs");
  });

  test("generated media kit indexes brand, video, and logo assets", () => {
    assertBrandFile("media-kit/generate-media-kit.mjs");
    assertBrandFile("media-kit/onemem-media-kit.generated.json");
    assertBrandFile("media-kit/onemem-media-kit.generated.md");
    assertBrandFile("media-kit/onemem-media-kit.generated.html");

    const kit = readJson<MediaKit>("packages/brand/media-kit/onemem-media-kit.generated.json");
    assert.equal(kit.identity.domain, "onemem.xyz");
    assert.equal(kit.identity.docs, "docs.onemem.xyz");
    assert.equal(kit.identity.x, "x.com/OneMemAI");
    assert.match(kit.proofBoundary, /Brand media is not final live proof/i);
    assert.ok(kit.guardrails.some((item) => /OpenClaw/.test(item)));
    assert.ok(kit.guardrails.some((item) => /memory-first/.test(item)));

    for (const groupId of ["designer-briefs", "brand-logo", "designer-campaign"]) {
      const group = kit.assetGroups.find((item) => item.id === groupId);
      assert.ok(group, `${groupId} group must exist`);
      assert.ok(group.assets.length > 0, `${groupId} must have assets`);
      for (const asset of group.assets) {
        assert.ok(asset.sizeBytes > 0, `${asset.label} must be non-empty`);
        assertBrandFile(asset.file);
      }
    }

    const logoIds = new Set(
      kit.logoGroups.flatMap((group) => group.assets.map((asset) => asset.id)),
    );
    for (const id of [
      "sui",
      "walrus",
      "seal",
      "memwal",
      "claude-code",
      "codex",
      "openclaw",
      "hermes-agent",
      "model-context-protocol",
      "cursor",
      "windsurf",
      "vercel-ai-sdk",
      "openai-agents",
      "crewai",
      "livekit",
      "elevenlabs",
      "mem0",
    ]) {
      assert.ok(logoIds.has(id), `media kit must include ${id}`);
    }

    for (const group of kit.logoGroups) {
      for (const asset of group.assets) {
        assertBrandFile(asset.preferredFile);
        for (const file of asset.files) {
          assertBrandFile(file);
        }
      }
    }
  });

  test("media kit docs preserve current copy guardrails", () => {
    const md = read("packages/brand/media-kit/onemem-media-kit.generated.md");
    const html = read("packages/brand/media-kit/onemem-media-kit.generated.html");
    for (const expected of [
      "One memory layer for every agent.",
      "Decentralized persistent memory for AI agents.",
      "onemem.xyz",
      "docs.onemem.xyz",
      "x.com/OneMemAI",
      "briefs/one-mem-full-brand-and-asset-brief.md",
      "designer-campaign/raw/one-mem-campaign-source.zip",
      "designer-campaign/html/Brand Kit.html",
      "designer-campaign/html/Launch Video.html",
      "designer-campaign/video/OneMem Launch Video - Audio Spec.md",
      "designer-campaign/audio/onemem-launch-bed.wav",
      "designer-campaign/AUDIO_PROVENANCE.generated.md",
      "designer-campaign/audio-provenance.generated.json",
      "designer-campaign/SOUND_RESEARCH.md",
      "designer-campaign/REFERENCE_BENCHMARK.generated.md",
      "designer-campaign/reference-benchmark.generated.json",
      "designer-campaign/exports/manifest.json",
      "designer-campaign/exports/static/readme-hero.png",
      "designer-campaign/exports/static/x-header.png",
      "designer-campaign/exports/static/link-card.png",
      "designer-campaign/exports/static/tools-poster.png",
      "designer-campaign/exports/static/architecture.png",
      "designer-campaign/exports/video/onemem-launch-30s.mp4",
      "designer-campaign/scripts/export-designer-campaign.mjs",
      "designer-campaign/scripts/generate-audio-provenance.mjs",
      "designer-campaign/scripts/generate-reference-benchmark.mjs",
      "designer-campaign/screenshots/xheader.png",
      "ASSET_CLEANUP.md",
      "Prompt and product-truth briefing",
      "Canonical, deleted-output, reference-link, and disposable asset boundaries",
      "OpenClaw",
      "Brand media is not final live proof.",
      "vendor-logos/svg/windsurf.svg",
      "vendor-logos/svg/vercel-ai-sdk.svg",
      "vendor-logos/svg/mem0-light.svg",
    ]) {
      assert.match(
        md,
        new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${basename(expected)} missing`,
      );
      assert.match(
        html,
        new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${basename(expected)} missing in HTML gallery`,
      );
    }
    assert.doesNotMatch(md, /OpenClaude|onemem\.ai|docs\.onemem\.ai/i);
    assert.doesNotMatch(html, /OpenClaude|onemem\.ai|docs\.onemem\.ai/i);
    assert.doesNotMatch(
      md,
      /campaign\/readme-hero|og-images\/x-banner|renders\/x-upload\/onemem-launch|video\/onemem-demo|video\/onemem-intro/i,
    );
    assert.doesNotMatch(
      html,
      /campaign\/readme-hero|og-images\/x-banner|renders\/x-upload\/onemem-launch|video\/onemem-demo|video\/onemem-intro/i,
    );
    assert.match(html, /<audio src="\.\.\/designer-campaign\/audio\/onemem-launch-bed\.wav"/);
  });

  test("asset cleanup manifest separates canonical assets from stale downloads", () => {
    const cleanup = read("packages/brand/ASSET_CLEANUP.md");
    for (const expected of [
      "Canonical Source Assets",
      "Deleted Generated Outputs",
      "Reference Links Only",
      "AUDIO_PROVENANCE.generated.md",
      "REFERENCE_BENCHMARK.generated.md",
      "External Downloads",
      "Cleaned Or Disposable Local Caches",
      "campaign/",
      "og-images/",
      "video/onemem-demo/",
      "video/onemem-intro/",
      "video/reference/x-videos/*.mp4",
      "/Users/abu/Downloads/API Design System Scope (1)",
      "/Users/abu/Downloads/One Mem",
      "onemem.xyz",
      "docs.onemem.xyz",
      "x.com/OneMemAI",
      "OpenClaw",
    ]) {
      assert.match(cleanup, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.match(cleanup, /Avoid:[\s\S]*Incorrect OpenClaw spelling/);
    assert.match(cleanup, /Avoid:[\s\S]*Etherscan for AI agents/);
  });
});
