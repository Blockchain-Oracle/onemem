#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const campaignRoot = path.resolve(here, "..");
const brandRoot = path.resolve(campaignRoot, "..");
const sourceZip = path.join(campaignRoot, "raw/one-mem-campaign-source.zip");
const launchVideo = path.join(campaignRoot, "exports/video/onemem-launch-30s.mp4");
const outputJson = path.join(campaignRoot, "reference-benchmark.generated.json");
const outputMd = path.join(campaignRoot, "REFERENCE_BENCHMARK.generated.md");

const references = [
  {
    id: "sui-network",
    label: "Sui Network launch reference",
    zipEntry: "uploads/SuiNetwork_2065207200059109376_720.mp4",
    sourceUrl: "https://x.com/SuiNetwork/status/2065207200059109376",
    takeaways: [
      "Loud, music-led protocol energy.",
      "Fast center-stage reveal with sparse text.",
      "Use as an energy ceiling, not as an audio source.",
    ],
  },
  {
    id: "agentcard",
    label: "AgentCard product-card reference",
    zipEntry: "uploads/agentcardai_2032521033929076741_1080.mp4",
    sourceUrl: "https://x.com/agentcardai/status/2032521033929076741",
    takeaways: [
      "Clean product/card pacing with clear social copy.",
      "Contains baked-in voiceover, so it is visual-pacing reference only.",
      "Useful for readable cards and calm progression.",
    ],
  },
  {
    id: "triton-seal",
    label: "Triton / Seal protocol reference",
    zipEntry: "uploads/triton_one_2067661855162777600_720.mp4",
    sourceUrl: "https://x.com/triton_one/status/2067664813514281095",
    takeaways: [
      "Kinetic protocol-launch motion and dark technical contrast.",
      "Lower average loudness than Sui but still peaks at social-upload ceiling.",
      "Useful for stack/proof pacing, not for melody or samples.",
    ],
  },
];

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: "utf8" }).trim();
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function extractZipEntry(entry, outFile) {
  const fd = openSync(outFile, "w");
  try {
    const result = spawnSync("unzip", ["-p", sourceZip, entry], {
      stdio: ["ignore", fd, "pipe"],
      encoding: "utf8",
    });
    if (result.status !== 0) {
      throw new Error(`unzip failed for ${entry}:\n${result.stderr}`);
    }
  } finally {
    closeSync(fd);
  }
}

function probe(file) {
  const data = JSON.parse(
    run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels",
      "-of",
      "json",
      file,
    ]),
  );
  const video = data.streams.find((stream) => stream.codec_type === "video") ?? null;
  const audio = data.streams.find((stream) => stream.codec_type === "audio") ?? null;
  return {
    durationSeconds: Number(Number(data.format.duration).toFixed(3)),
    sizeBytes: Number(data.format.size),
    video,
    audio,
  };
}

function volume(file) {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-nostats", "-i", file, "-map", "0:a:0", "-af", "volumedetect", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(`ffmpeg volumedetect failed for ${file}:\n${result.stderr}`);
  }
  const output = `${result.stdout}\n${result.stderr}`;
  const mean = output.match(/mean_volume:\s*(-?\d+(?:\.\d+)?) dB/);
  const max = output.match(/max_volume:\s*(-?\d+(?:\.\d+)?) dB/);
  return {
    meanDb: mean ? Number(mean[1]) : null,
    maxDb: max ? Number(max[1]) : null,
  };
}

function measureCurrentLaunch() {
  const rel = path.relative(brandRoot, launchVideo).replaceAll(path.sep, "/");
  return {
    id: "onemem-launch",
    label: "OneMem launch video",
    file: rel,
    boundary: "OneMem generated video render with intentionally silent placeholder audio pending a researched replacement.",
    sha256: sha256(launchVideo),
    ...probe(launchVideo),
    volume: volume(launchVideo),
    takeaways: [
      "Matches the 30-second designer animatic duration.",
      "Currently uses silent placeholder audio because the prior sound beds were rejected.",
      "Keeps memory-first copy and generated export patches.",
    ],
  };
}

function measureReferences(tempDir) {
  return references.map((item) => {
    const out = path.join(tempDir, `${item.id}.mp4`);
    extractZipEntry(item.zipEntry, out);
    return {
      ...item,
      boundary: "Benchmark only; do not ship, sample, remix, or redistribute as OneMem media.",
      sha256: sha256(out),
      ...probe(out),
      volume: volume(out),
    };
  });
}

function renderMarkdown(manifest) {
  const row = (item) => {
    const video = item.video ?? {};
    const audio = item.audio ?? {};
    const mean = item.volume.meanDb === null ? "-" : `${item.volume.meanDb.toFixed(1)} dB`;
    const max = item.volume.maxDb === null ? "-" : `${item.volume.maxDb.toFixed(1)} dB`;
    const source = item.sourceUrl ? `[source](${item.sourceUrl})` : `\`${item.file}\``;
    return `| ${item.label} | ${source} | ${video.width}x${video.height} | ${item.durationSeconds.toFixed(2)}s | ${video.r_frame_rate ?? "-"} | ${audio.codec_name ?? "-"} | ${mean} | ${max} |`;
  };
  return [
    "# OneMem Reference Video Benchmark",
    "",
    "Generated from the three benchmark videos inside `raw/one-mem-campaign-source.zip` and the current OneMem launch export.",
    "",
    "## Boundary",
    "",
    manifest.boundary,
    "",
    "## Measurements",
    "",
    "| Video | Source | Size | Duration | Frame rate | Audio | Mean | Max |",
    "| --- | --- | ---: | ---: | ---: | --- | ---: | ---: |",
    ...manifest.references.map(row),
    row(manifest.currentLaunch),
    "",
    "## Creative Takeaways",
    "",
    ...manifest.references.flatMap((item) => [
      `### ${item.label}`,
      "",
      ...item.takeaways.map((takeaway) => `- ${takeaway}`),
      "",
    ]),
    "### OneMem Launch Cut",
    "",
    ...manifest.currentLaunch.takeaways.map((takeaway) => `- ${takeaway}`),
    "",
    "## Sound Direction",
    "",
    "- Current launch export is intentionally silent pending a researched replacement.",
    "- Keep the future OneMem bed no-beat, properly licensed, and documented.",
    "- Use the references for pacing, contrast, and loudness calibration only.",
    "- Do not copy melodies, voiceover, impacts, stems, or waveform structure.",
    "- Keep public social masters near `-14` to `-10` dB mean, then validate upload-specific headroom.",
    "",
  ].join("\n");
}

function main() {
  const tempDir = path.join(tmpdir(), `onemem-reference-benchmark-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });
  try {
    const manifest = {
      generatedAt: "2026-06-19",
      sourceZip: "raw/one-mem-campaign-source.zip",
      sourceZipSha256: sha256(sourceZip),
      boundary:
        "Reference videos are third-party benchmark inputs retained only inside the raw zip. The current OneMem export is silent; any future audio must be no-beat original/generated or properly licensed audio.",
      references: measureReferences(tempDir),
      currentLaunch: measureCurrentLaunch(),
    };
    writeFileSync(outputJson, `${JSON.stringify(manifest, null, 2)}\n`);
    writeFileSync(outputMd, renderMarkdown(manifest));
    console.log(`[reference-benchmark] wrote ${path.relative(campaignRoot, outputJson)}`);
    console.log(`[reference-benchmark] wrote ${path.relative(campaignRoot, outputMd)}`);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

main();
