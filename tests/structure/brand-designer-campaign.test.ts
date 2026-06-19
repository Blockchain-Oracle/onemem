import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import type {
  DesignerCampaignExportManifest,
  DesignerCampaignManifest,
  DesignerReferenceBenchmark,
} from "./brand-designer-campaign.types";
import { exists, ROOT, readJson } from "./helpers";

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}
function assertPng(rel: string, width: number, height: number) {
  const png = readFileSync(join(ROOT, rel));
  assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", `${rel} signature`);
  assert.equal(png.readUInt32BE(16), width, `${rel} width`);
  assert.equal(png.readUInt32BE(20), height, `${rel} height`);
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("designer campaign package", () => {
  test("imports the downloaded campaign package and selected accessible files", () => {
    for (const rel of [
      "packages/brand/designer-campaign/README.md",
      "packages/brand/designer-campaign/manifest.json",
      "packages/brand/designer-campaign/SOUND_RESEARCH.md",
      "packages/brand/designer-campaign/raw/one-mem-campaign-source.zip",
      "packages/brand/designer-campaign/html/Brand Kit.html",
      "packages/brand/designer-campaign/html/Launch Video.html",
      "packages/brand/designer-campaign/html/Sound Design.html",
      "packages/brand/designer-campaign/html/OneMem Handoff Guide.html",
      "packages/brand/designer-campaign/video/OneMem Launch Video - Audio Spec.md",
      "packages/brand/designer-campaign/audio/onemem-launch-bed.wav",
      "packages/brand/designer-campaign/scripts/export-designer-campaign.mjs",
      "packages/brand/designer-campaign/scripts/generate-reference-benchmark.mjs",
      "packages/brand/designer-campaign/REFERENCE_BENCHMARK.generated.md",
      "packages/brand/designer-campaign/reference-benchmark.generated.json",
    ]) {
      assert.ok(exists(rel), `${rel} must exist`);
    }

    const pkg = readJson<{ scripts: Record<string, string> }>("packages/brand/package.json");
    assert.equal(
      pkg.scripts["designer-campaign:export"],
      "node designer-campaign/scripts/export-designer-campaign.mjs",
    );
    assert.equal(
      pkg.scripts["designer-campaign:benchmark"],
      "node designer-campaign/scripts/generate-reference-benchmark.mjs",
    );
  });

  test("manifest records board targets, launch audio, and hashes", () => {
    const manifest = readJson<DesignerCampaignManifest>(
      "packages/brand/designer-campaign/manifest.json",
    );
    assert.match(manifest.sourceDownload, /One Mem \(1\)\.zip$/);
    assert.match(manifest.boundary, /Screenshots are previews/i);
    assert.match(manifest.boundary, /intentional silent placeholder audio/i);
    assert.match(manifest.boundary, /does not reuse reference video audio/i);
    assert.deepEqual(manifest.staticBoardTargets, {
      readmeHero: "1280x420",
      xHeader: "1500x500",
      linkCard: "1200x630",
      toolsPoster: "1600x900",
      architecture: "1920x1080",
    });
    assert.equal(manifest.launchVideo.size, "1920x1080");
    assert.equal(manifest.launchVideo.durationSeconds, 30);
    assert.equal(manifest.launchVideo.audio, "audio/onemem-launch-bed.wav");
    assert.equal(manifest.launchVideo.silent, true);
    assert.deepEqual(manifest.launchVideo.beats, [
      "agents-forget",
      "one-namespace",
      "decentralized-stack",
      "runtime-proof",
      "runtime-surface",
      "close",
    ]);

    for (const file of manifest.files) {
      const rel = `packages/brand/designer-campaign/${file.path}`;
      assert.ok(exists(rel), `${file.path} missing`);
      const bytes = readFileSync(join(ROOT, rel));
      assert.ok(bytes.length > 0, `${file.path} must be non-empty`);
      assert.equal(file.sizeBytes, bytes.length, `${file.path} size drift`);
      assert.equal(file.sha256, sha256(bytes), `${file.path} hash drift`);
    }
    const ids = new Set(manifest.files.map((file) => file.id));
    assert.ok(ids.has("sound-research"));
    assert.ok(ids.has("raw-source"));
    assert.ok(ids.has("launch-video-html"));
  });

  test("screenshots are normalized PNG previews with stable dimensions", () => {
    for (const rel of [
      "packages/brand/designer-campaign/screenshots/arch.png",
      "packages/brand/designer-campaign/screenshots/kit-overview.png",
      "packages/brand/designer-campaign/screenshots/linkcard.png",
      "packages/brand/designer-campaign/screenshots/linkcard2.png",
      "packages/brand/designer-campaign/screenshots/poster.png",
      "packages/brand/designer-campaign/screenshots/xheader.png",
    ]) {
      assertPng(rel, 924, 540);
    }
  });

  test("generated campaign exports match target dimensions and video requirements", () => {
    const manifest = readJson<DesignerCampaignExportManifest>(
      "packages/brand/designer-campaign/exports/manifest.json",
    );
    assert.match(manifest.source.boundary, /generated from the designer HTML source/i);
    assert.ok(
      manifest.source.exportPatches.some((item: string) => /x\.com\/OneMemAI/.test(item)),
      "export patches must document the X URL copy fix",
    );
    assert.ok(
      manifest.source.exportPatches.some((item: string) => /border-box/.test(item)),
      "export patches must document the clipping fix",
    );

    const boardTargets = new Map([
      ["readme-hero", [1280, 420]],
      ["x-header", [1500, 500]],
      ["link-card", [1200, 630]],
      ["tools-poster", [1600, 900]],
      ["architecture", [1920, 1080]],
    ]);
    assert.equal(manifest.staticBoards.length, boardTargets.size);
    for (const board of manifest.staticBoards) {
      const expected = boardTargets.get(board.id);
      assert.ok(expected, `${board.id} must be an expected board`);
      assert.equal(board.width, expected[0]);
      assert.equal(board.height, expected[1]);
      assert.ok(board.sizeBytes > 10_000, `${board.id} must be a real image`);
      assert.match(board.sha256, /^[a-f0-9]{64}$/);
      assertPng(`packages/brand/designer-campaign/${board.file}`, expected[0], expected[1]);
    }

    assert.equal(manifest.launchVideos.length, 1);
    const video = manifest.launchVideos[0];
    assert.equal(video.id, "launch-video-landscape");
    assert.equal(video.width, 1920);
    assert.equal(video.height, 1080);
    assert.equal(video.fps, 30);
    assert.equal(video.frameRate, "30/1");
    assert.equal(video.audioFile, "audio/onemem-launch-bed.wav");
    assert.match(video.audioSha256, /^[a-f0-9]{64}$/);
    assert.ok(video.sizeBytes > 1_000_000, "launch MP4 must be populated");
    assert.match(video.sha256, /^[a-f0-9]{64}$/);

    assert.ok(video.durationSeconds >= 29.9);
    assert.ok(video.durationSeconds <= 30.2);
    assert.ok(exists(`packages/brand/designer-campaign/${video.file}`));

    const script = read("packages/brand/designer-campaign/scripts/export-designer-campaign.mjs");
    assert.match(script, /designer-campaign\/audio|audio\/onemem-launch-bed\.wav|campaignRoot/);
    assert.doesNotMatch(script, /video\/onemem-demo/);
    assert.match(script, /replaceAll\("@OneMemAI", "x\.com\/OneMemAI"\)/);
    assert.match(script, /agent-native/);
    assert.match(script, /format=yuv420p/);
  });

  test("reference benchmark measures the three raw-zip videos without packaging copies", () => {
    const benchmark = readJson<DesignerReferenceBenchmark>(
      "packages/brand/designer-campaign/reference-benchmark.generated.json",
    );
    assert.match(benchmark.boundary, /third-party benchmark inputs/i);
    assert.equal(benchmark.references.length, 3);
    const ids = new Set(benchmark.references.map((item) => item.id));
    for (const id of ["sui-network", "agentcard", "triton-seal"]) {
      assert.ok(ids.has(id), `${id} reference must be benchmarked`);
    }
    for (const item of benchmark.references) {
      assert.match(item.sourceUrl, /^https:\/\/x\.com\//);
      assert.match(item.zipEntry, /^uploads\/.*\.mp4$/);
      assert.match(item.boundary, /Benchmark only/i);
      assert.ok(item.durationSeconds > 20, `${item.id} must have measured duration`);
      assert.ok(item.video.width >= 720, `${item.id} width must be measured`);
      assert.equal(item.video.r_frame_rate, "30/1");
      assert.equal(item.audio.codec_name, "aac");
      assert.notEqual(item.volume.meanDb, null);
      assert.notEqual(item.volume.maxDb, null);
      assert.ok(item.takeaways.some((takeaway) => /not|only|reference/i.test(takeaway)));
    }

    assert.equal(benchmark.currentLaunch.id, "onemem-launch");
    assert.match(benchmark.currentLaunch.file, /exports\/video\/onemem-launch-30s\.mp4$/);
    assert.equal(benchmark.currentLaunch.video.width, 1920);
    assert.equal(benchmark.currentLaunch.video.height, 1080);
    assert.equal(benchmark.currentLaunch.audio.codec_name, "aac");
    assert.ok(
      benchmark.currentLaunch.takeaways.some((item) => /silent placeholder audio/i.test(item)),
    );

    const md = read("packages/brand/designer-campaign/REFERENCE_BENCHMARK.generated.md");
    assert.match(md, /Do not copy melodies, voiceover, impacts, stems, or waveform structure/);
    assert.match(md, /OneMem launch video/);
    assert.doesNotMatch(md, /OpenClaude|onemem\.ai|docs\.onemem\.ai/i);
  });

  test("raw zip keeps the runnable HTML package and source files intact", () => {
    const zipPath = join(ROOT, "packages/brand/designer-campaign/raw/one-mem-campaign-source.zip");
    const listing = execFileSync("unzip", ["-l", zipPath], { encoding: "utf8" });
    for (const expected of [
      "Brand Kit.html",
      "Launch Video.html",
      "Sound Design.html",
      "OneMem Handoff Guide.html",
      "animations.jsx",
      "design-canvas.jsx",
      "kit/assets-a.jsx",
      "kit/assets-b.jsx",
      "kit/parts.jsx",
      "video/scenes.jsx",
      "video/audio.jsx",
      "video/OneMem Launch Video - Audio Spec.md",
      "uploads/SuiNetwork_2065207200059109376_720.mp4",
      "uploads/agentcardai_2032521033929076741_1080.mp4",
      "uploads/triton_one_2067661855162777600_720.mp4",
    ]) {
      assert.match(listing, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  });

  test("campaign docs keep current identity and source boundaries", () => {
    const readme = read("packages/brand/designer-campaign/README.md");
    const audioSpec = read(
      "packages/brand/designer-campaign/video/OneMem Launch Video - Audio Spec.md",
    );
    const soundResearch = read("packages/brand/designer-campaign/SOUND_RESEARCH.md");
    assert.match(readme, /designer-provided campaign direction/i);
    assert.match(readme, /1280 x 420/);
    assert.match(readme, /Launch Video\.html/);
    assert.match(readme, /Do not restore the old deleted `packages\/brand\/campaign\/` images/);
    assert.match(readme, /onemem\.xyz/);
    assert.match(readme, /docs\.onemem\.xyz/);
    assert.match(readme, /x\.com\/OneMemAI/);
    assert.match(readme, /designer-campaign:benchmark/);
    assert.match(audioSpec, /low mechanical pulse/i);
    assert.match(audioSpec, /No voiceover/i);
    assert.match(soundResearch, /REFERENCE_BENCHMARK\.generated\.md/);
    assert.match(soundResearch, /BigSoundBank/);
    assert.match(
      soundResearch,
      /Current package state: `audio\/onemem-launch-bed\.wav` is 30 seconds of digital/,
    );
    assert.match(soundResearch, /no drums, beat grid, tempo, looped pulse/i);
    assert.match(soundResearch, /Material Design/);
    assert.match(soundResearch, /ElevenLabs is not used/i);
    assert.match(soundResearch, /current bed is digital\s+silence/i);
    assert.match(soundResearch, /Pixabay/);
    assert.match(soundResearch, /H\.264 MP4 with AAC audio/);
    assert.doesNotMatch(soundResearch, /Tempo 92 BPM|mechanical pulse, filtered/i);
    assert.doesNotMatch(
      `${readme}\n${audioSpec}\n${soundResearch}`,
      /OpenClaude|onemem\.ai|docs\.onemem\.ai/i,
    );
  });
});
