#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const campaignRoot = path.resolve(here, "..");
const audioFile = path.join(campaignRoot, "audio/onemem-launch-bed.wav");
const videoFile = path.join(campaignRoot, "exports/video/onemem-launch-30s.mp4");
const jsonOut = path.join(campaignRoot, "audio-provenance.generated.json");
const mdOut = path.join(campaignRoot, "AUDIO_PROVENANCE.generated.md");

const references = [
  {
    id: "sui-network",
    label: "Sui Network launch reference",
    sourceUrl: "https://x.com/SuiNetwork/status/2065207200059109376",
    zipEntry: "uploads/SuiNetwork_2065207200059109376_720.mp4",
  },
  {
    id: "agentcard",
    label: "AgentCard product-card reference",
    sourceUrl: "https://x.com/agentcardai/status/2032521033929076741",
    zipEntry: "uploads/agentcardai_2032521033929076741_1080.mp4",
  },
  {
    id: "triton-seal",
    label: "Triton / Seal protocol reference",
    sourceUrl: "https://x.com/triton_one/status/2067664813514281095",
    zipEntry: "uploads/triton_one_2067661855162777600_720.mp4",
  },
];

const sourceAssets = [
  {
    id: "silent-placeholder",
    label: "Digital silence placeholder",
    pageUrl: null,
    directContentUrl: null,
    author: "OneMem",
    license: "Project-generated placeholder",
    use:
      "Current 30-second WAV is intentionally silent so the rejected sound bed is removed from the launch video pending a researched replacement.",
  },
];

const processingNotes = [
  "No ElevenLabs output is used.",
  "The previous pulse/click-style generated bed was rejected by Abu because it sounded like a repetitive beat.",
  "The later CC0 wind ambience attempt was also rejected by Abu and has been removed from the launch export.",
  "The current audio file is 30 seconds of stereo 48 kHz PCM silence generated with ffmpeg anullsrc.",
  "The replacement brief remains: no drums, BPM grid, click loop, synthetic memory-write ticks, or repeated pulse layer.",
];

function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${cmd} failed:\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout.trim() || result.stderr.trim();
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function rel(file) {
  return path.relative(campaignRoot, file).replaceAll(path.sep, "/");
}

function volume(file) {
  const output = run("ffmpeg", [
    "-hide_banner",
    "-nostats",
    "-i",
    file,
    "-af",
    "volumedetect",
    "-f",
    "null",
    "-",
  ]);
  return {
    meanDb: parseDb(output, /mean_volume:\s*(-?\d+(?:\.\d+)?) dB/),
    maxDb: parseDb(output, /max_volume:\s*(-?\d+(?:\.\d+)?) dB/),
  };
}

function parseDb(output, regex) {
  const match = output.match(regex);
  return match ? Number(match[1]) : null;
}

function probe(file) {
  const raw = run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=codec_type,codec_name,sample_rate,channels,width,height,r_frame_rate",
    "-of",
    "json",
    file,
  ]);
  const data = JSON.parse(raw);
  return {
    durationSeconds: Number(Number(data.format.duration).toFixed(3)),
    streams: data.streams,
  };
}

function mediaAsset(file) {
  const probed = probe(file);
  return {
    file: rel(file),
    sizeBytes: statSync(file).size,
    sha256: sha256(file),
    durationSeconds: probed.durationSeconds,
    streams: probed.streams,
    volume: volume(file),
  };
}

function buildManifest() {
  for (const file of [audioFile, videoFile]) {
    if (!existsSync(file)) throw new Error(`Missing media file: ${file}`);
  }
  return {
    generatedAt: "2026-06-19",
    boundary:
      "The current launch audio is an intentionally silent placeholder. The rejected sound bed has been removed; third-party reference videos remain benchmark inputs only and must not be shipped, sampled, or recreated too closely.",
    sourceAssets,
    processingNotes,
    ownedAudio: mediaAsset(audioFile),
    renderedLaunchVideo: mediaAsset(videoFile),
    references: references.map((reference) => ({
      ...reference,
      use: "Benchmark pacing, contrast, and loudness only; do not use audio as source material.",
    })),
    scoringPrompt:
      "Research and source a new 30-second sound bed for OneMem; calm infrastructure, warm trust, quiet continuity; no beat, BPM, drums, click loop, mechanical pulse, repeated transient pattern, obvious melody, vocals, trailer impact, artist imitation, or famous-track style. The current shipped WAV is silence until the new source is approved.",
    releaseChecks: [
      "Keep source WAV and rendered MP4 hashes in this manifest current.",
      "Do not replace the silent placeholder until the source/license and no-beat direction are documented.",
      "Check that any future rendered bed has no repeated pulse, click loop, or beat-like transient pattern.",
      "Keep third-party reference videos inside the raw zip or as links only.",
      "Re-run reference and audio provenance after replacing the score.",
      "Public masters should be checked for upload-specific loudness/headroom.",
    ],
  };
}

function audioStreamLabel(asset) {
  const stream = asset.streams.find((item) => item.codec_type === "audio");
  if (!stream) return "none";
  const sampleRate = stream.sample_rate ? `${stream.sample_rate} Hz` : "unknown rate";
  const channels = stream.channels ? `${stream.channels} ch` : "unknown channels";
  return `${stream.codec_name}, ${sampleRate}, ${channels}`;
}

function writeMarkdown(manifest) {
  const lines = [
    "# OneMem Launch Audio Provenance",
    "",
    `Generated: ${manifest.generatedAt}`,
    "",
    "## Boundary",
    "",
    manifest.boundary,
    "",
    "## Kept OneMem Audio",
    "",
    `- Source WAV: \`${manifest.ownedAudio.file}\``,
    `- SHA-256: \`${manifest.ownedAudio.sha256}\``,
    `- Duration: ${manifest.ownedAudio.durationSeconds.toFixed(2)}s`,
    `- Audio: ${audioStreamLabel(manifest.ownedAudio)}`,
    `- Volume: mean ${manifest.ownedAudio.volume.meanDb} dB, max ${manifest.ownedAudio.volume.maxDb} dB`,
    "",
    "## Audio Source",
    "",
    ...manifest.sourceAssets.map((item) => {
      const label = item.pageUrl ? `[${item.label}](${item.pageUrl})` : item.label;
      return `- ${label} - ${item.license}; author: ${item.author}; ${item.use}`;
    }),
    "",
    "## Processing Notes",
    "",
    ...manifest.processingNotes.map((item) => `- ${item}`),
    "",
    "## Rendered Launch Video",
    "",
    `- MP4: \`${manifest.renderedLaunchVideo.file}\``,
    `- SHA-256: \`${manifest.renderedLaunchVideo.sha256}\``,
    `- Duration: ${manifest.renderedLaunchVideo.durationSeconds.toFixed(2)}s`,
    `- Audio: ${audioStreamLabel(manifest.renderedLaunchVideo)}`,
    `- Volume: mean ${manifest.renderedLaunchVideo.volume.meanDb} dB, max ${manifest.renderedLaunchVideo.volume.maxDb} dB`,
    "",
    "## Reference Videos",
    "",
    ...manifest.references.map(
      (item) => `- [${item.label}](${item.sourceUrl}) - \`${item.zipEntry}\` - ${item.use}`,
    ),
    "",
    "## Scoring Prompt",
    "",
    manifest.scoringPrompt,
    "",
    "## Release Checks",
    "",
    ...manifest.releaseChecks.map((item) => `- ${item}`),
    "",
  ];
  writeFileSync(mdOut, lines.join("\n"));
}

const manifest = buildManifest();
writeFileSync(jsonOut, `${JSON.stringify(manifest, null, 2)}\n`);
writeMarkdown(manifest);
console.log(`[audio-provenance] wrote ${rel(jsonOut)}`);
console.log(`[audio-provenance] wrote ${rel(mdOut)}`);
