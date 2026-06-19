import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { exists, ROOT, readJson } from "./helpers";

type ExportManifest = {
  launchVideos: Array<{
    file: string;
    audioFile: string;
    audioSha256: string;
    width: number;
    height: number;
    fps: number;
  }>;
};

const REMOVED_VIDEO_PATHS = [
  "packages/brand/video",
  "packages/brand/video/onemem-intro",
  "packages/brand/video/onemem-demo",
  "packages/brand/video/scripts",
  "packages/brand/video/onemem-intro/renders/onemem-intro.mp4",
  "packages/brand/video/onemem-demo/renders/onemem-demo-30s.mp4",
  "packages/brand/video/onemem-demo/renders/onemem-launch-30s.mp4",
  "packages/brand/video/onemem-demo/public/audio/onemem-launch-bed.wav",
  "packages/brand/video/onemem-demo/public/media/onemem-intro.mp4",
  "packages/brand/video/onemem-demo/public/footage/agent-sends-money.mp4",
] as const;

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function assertWav(rel: string) {
  assert.ok(exists(rel), `${rel} must exist`);
  const wav = readFileSync(join(ROOT, rel));
  assert.ok(wav.length > 500_000, `${rel} must be a real audio bed`);
  assert.equal(wav.subarray(0, 4).toString("utf8"), "RIFF", `${rel} RIFF header`);
  assert.equal(wav.subarray(8, 12).toString("utf8"), "WAVE", `${rel} WAVE header`);
}

function assertMp4(rel: string) {
  assert.ok(exists(rel), `${rel} must exist`);
  const mp4 = readFileSync(join(ROOT, rel));
  assert.ok(mp4.length > 1_000_000, `${rel} must be a populated launch video`);
  assert.equal(mp4.subarray(4, 8).toString("utf8"), "ftyp", `${rel} MP4 ftyp box`);
}

describe("brand video cleanup boundary", () => {
  test("old video workspaces and generated cuts are removed", () => {
    for (const rel of REMOVED_VIDEO_PATHS) {
      assert.equal(exists(rel), false, `${rel} should stay removed after cleanup`);
    }
  });

  test("designer campaign keeps the only current launch video and source audio", () => {
    assertMp4("packages/brand/designer-campaign/exports/video/onemem-launch-30s.mp4");
    assertWav("packages/brand/designer-campaign/audio/onemem-launch-bed.wav");

    const manifest = readJson<ExportManifest>(
      "packages/brand/designer-campaign/exports/manifest.json",
    );
    assert.equal(manifest.launchVideos.length, 1);
    const launch = manifest.launchVideos[0];
    assert.equal(launch.file, "exports/video/onemem-launch-30s.mp4");
    assert.equal(launch.audioFile, "audio/onemem-launch-bed.wav");
    assert.equal(launch.width, 1920);
    assert.equal(launch.height, 1080);
    assert.equal(launch.fps, 30);
    assert.match(launch.audioSha256, /^[a-f0-9]{64}$/);
  });

  test("docs and exporter do not reference deleted video workspaces", () => {
    const combined = [
      read("packages/brand/README.md"),
      read("packages/brand/ASSET_CLEANUP.md"),
      read("packages/brand/designer-campaign/README.md"),
      read("packages/brand/designer-campaign/scripts/export-designer-campaign.mjs"),
      read("packages/brand/media-kit/onemem-media-kit.generated.md"),
      read("packages/brand/media-kit/onemem-media-kit.generated.html"),
    ].join("\n");

    assert.match(combined, /designer-campaign\/audio\/onemem-launch-bed\.wav/);
    assert.doesNotMatch(combined, /video\/onemem-demo\/public\/audio/);
    assert.doesNotMatch(combined, /video\/onemem-intro\/notes|video\/onemem-demo\/notes/);
    assert.doesNotMatch(combined, /OpenClaude|onemem\.ai|docs\.onemem\.ai/i);
  });
});
