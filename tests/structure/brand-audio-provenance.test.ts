import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";
import { exists, ROOT, readJson } from "./helpers";

type ExportManifest = {
  launchVideos: Array<{
    audioFile: string;
    audioSha256: string;
  }>;
};

type AudioProvenance = {
  boundary: string;
  sourceAssets: Array<{ id: string; pageUrl: string | null; license: string; use: string }>;
  processingNotes: string[];
  ownedAudio: { file: string; sha256: string; durationSeconds: number };
  renderedLaunchVideo: { file: string; sha256: string; durationSeconds: number };
  references: Array<{ id: string; sourceUrl: string; use: string }>;
  scoringPrompt: string;
};

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function sha256(rel: string): string {
  return createHash("sha256")
    .update(readFileSync(join(ROOT, rel)))
    .digest("hex");
}

describe("designer campaign audio provenance", () => {
  test("launch audio provenance exists and matches current media hashes", () => {
    const audioRel = "packages/brand/designer-campaign/audio/onemem-launch-bed.wav";
    const videoRel = "packages/brand/designer-campaign/exports/video/onemem-launch-30s.mp4";
    assert.ok(exists(audioRel), `${audioRel} must exist`);
    const wav = readFileSync(join(ROOT, audioRel));
    assert.ok(wav.length > 500_000, "launch audio must be a real generated WAV");
    assert.equal(wav.subarray(0, 4).toString("utf8"), "RIFF");
    assert.equal(wav.subarray(8, 12).toString("utf8"), "WAVE");

    const manifest = readJson<ExportManifest>(
      "packages/brand/designer-campaign/exports/manifest.json",
    );
    assert.equal(manifest.launchVideos[0].audioFile, "audio/onemem-launch-bed.wav");
    assert.equal(manifest.launchVideos[0].audioSha256, sha256(audioRel));

    const provenance = readJson<AudioProvenance>(
      "packages/brand/designer-campaign/audio-provenance.generated.json",
    );
    assert.match(provenance.boundary, /intentionally silent placeholder/i);
    assert.ok(
      provenance.sourceAssets.some(
        (item) => /silent-placeholder/i.test(item.id) && /placeholder/i.test(item.license),
      ),
      "audio provenance must record the silent placeholder source",
    );
    assert.ok(
      provenance.processingNotes.some((item) => /No ElevenLabs output is used/i.test(item)),
      "audio provenance must record that ElevenLabs is not used",
    );
    assert.ok(
      provenance.processingNotes.some((item) =>
        /wind ambience attempt was also rejected/i.test(item),
      ),
      "audio provenance must record the rejected wind attempt",
    );
    assert.ok(
      provenance.processingNotes.some((item) =>
        /30 seconds of stereo 48 kHz PCM silence/i.test(item),
      ),
      "audio provenance must record the current silent placeholder",
    );
    assert.equal(provenance.ownedAudio.file, "audio/onemem-launch-bed.wav");
    assert.equal(provenance.ownedAudio.sha256, sha256(audioRel));
    assert.equal(provenance.renderedLaunchVideo.file, "exports/video/onemem-launch-30s.mp4");
    assert.equal(provenance.renderedLaunchVideo.sha256, sha256(videoRel));
    assert.equal(provenance.references.length, 3);
    assert.equal(provenance.ownedAudio.durationSeconds, 30);
    assert.match(provenance.scoringPrompt, /current shipped WAV is silence/i);
    assert.match(provenance.scoringPrompt, /no beat, BPM, drums, click loop/i);
    assert.doesNotMatch(provenance.scoringPrompt, /92 BPM/i);
  });

  test("sound docs keep third-party reference videos benchmark-only", () => {
    const soundResearch = read("packages/brand/designer-campaign/SOUND_RESEARCH.md");
    const benchmark = read("packages/brand/designer-campaign/REFERENCE_BENCHMARK.generated.md");
    const cleanup = read("packages/brand/ASSET_CLEANUP.md");

    for (const doc of [soundResearch, benchmark, cleanup]) {
      assert.match(doc, /Do not ship|do not ship|Reference Links Only|benchmark/i);
      assert.doesNotMatch(doc, /OpenClaude|onemem\.ai|docs\.onemem\.ai/i);
    }

    assert.match(
      benchmark,
      /Do not copy melodies, voiceover, impacts, stems, or waveform structure/,
    );
    assert.match(cleanup, /designer-campaign\/audio\/onemem-launch-bed\.wav/);
    assert.match(cleanup, /AUDIO_PROVENANCE\.generated\.md/);
    assert.match(cleanup, /video\/onemem-demo\/.*old Remotion/i);

    const provenanceMd = read("packages/brand/designer-campaign/AUDIO_PROVENANCE.generated.md");
    assert.match(provenanceMd, /Reference Videos/);
    assert.match(provenanceMd, /Audio Source/);
    assert.match(provenanceMd, /Digital silence placeholder/);
    assert.match(provenanceMd, /No ElevenLabs output is used/);
    assert.match(provenanceMd, /wind ambience attempt was also rejected/i);
    assert.match(provenanceMd, /do not use audio as source material/i);
  });

  test("media kit exposes the kept audio and excludes deleted audio packages", () => {
    const mediaKitMd = read("packages/brand/media-kit/onemem-media-kit.generated.md");
    const mediaKitHtml = read("packages/brand/media-kit/onemem-media-kit.generated.html");

    for (const content of [mediaKitMd, mediaKitHtml]) {
      assert.match(content, /designer-campaign\/audio\/onemem-launch-bed\.wav/);
      assert.match(content, /designer-campaign\/AUDIO_PROVENANCE\.generated\.md/);
      assert.doesNotMatch(content, /video\/onemem-demo\/public\/audio/);
      assert.doesNotMatch(content, /generated-sfx/);
    }
  });

  test("package exposes the audio provenance refresh command", () => {
    const pkg = readJson<{ scripts: Record<string, string> }>("packages/brand/package.json");
    assert.equal(
      pkg.scripts["designer-campaign:audio-provenance"],
      "node designer-campaign/scripts/generate-audio-provenance.mjs",
    );
  });
});
