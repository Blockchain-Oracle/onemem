import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildHtml } from "./media-kit-html.mjs";
import { buildMarkdown } from "./media-kit-markdown.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brandRoot = path.resolve(__dirname, "..");

const OUT_JSON = "media-kit/onemem-media-kit.generated.json";
const OUT_MD = "media-kit/onemem-media-kit.generated.md";
const OUT_HTML = "media-kit/onemem-media-kit.generated.html";

const identity = {
  product: "OneMem",
  domain: "onemem.xyz",
  docs: "docs.onemem.xyz",
  x: "x.com/OneMemAI",
  github: "github.com/Blockchain-Oracle/onemem",
  motto: "One memory layer for every agent.",
  socialLine: "Decentralized persistent memory for AI agents.",
};

const guardrails = [
  "Use OpenClaw spelling.",
  "Keep the story memory-first; proof is the confidence layer.",
  "Use third-party logos only for truthful identification, not endorsement.",
  "Do not use OneMem .ai domains.",
  "Do not claim WASI, Nautilus, or TEE as shipped behavior without implementation evidence.",
  "Do not call brand launch media final live proof.",
];

const groups = [
  {
    id: "designer-briefs",
    title: "Designer Briefs",
    use: "Prompt and product-truth briefing for designers, ChatGPT, and video agents.",
    assets: [
      asset("Full brand and asset brief", "briefs/one-mem-full-brand-and-asset-brief.md", "Copy/paste prompt and asset direction"),
      asset("Asset cleanup manifest", "ASSET_CLEANUP.md", "Canonical, deleted-output, reference-link, and disposable asset boundaries"),
    ],
  },
  {
    id: "brand-logo",
    title: "Brand Logo",
    use: "OneMem marks and lockups for product identity.",
    assets: [
      asset("OneMem mark", "logo/onemem-mark.svg", "Primary mark"),
      asset("OneMem wordmark", "logo/onemem-wordmark.svg", "Wordmark"),
      asset("Horizontal lockup", "logo/onemem-lockup-horizontal.svg", "Default lockup"),
      asset("Dark lockup", "logo/onemem-lockup-dark.svg", "Dark-surface lockup"),
      asset("Light lockup", "logo/onemem-lockup-light.svg", "Light-surface lockup"),
    ],
  },
  {
    id: "designer-campaign",
    title: "Designer Campaign Package",
    use: "Downloaded campaign source package, board previews, launch animatic, and sound spec.",
    assets: [
      asset("Designer campaign README", "designer-campaign/README.md", "How to use the imported package"),
      asset("Designer campaign manifest", "designer-campaign/manifest.json", "Hashes, boundaries, and target sizes"),
      asset("Raw campaign source zip", "designer-campaign/raw/one-mem-campaign-source.zip", "Exact downloaded runnable package"),
      asset("Brand Kit HTML", "designer-campaign/html/Brand Kit.html", "Five-board static campaign canvas"),
      asset("Launch Video HTML", "designer-campaign/html/Launch Video.html", "Silent 30-second launch animatic"),
      asset("Sound Design HTML", "designer-campaign/html/Sound Design.html", "Visual audio beat map"),
      asset("Original handoff HTML", "designer-campaign/html/OneMem Handoff Guide.html", "Downloaded package guide"),
      asset("Audio spec", "designer-campaign/video/OneMem Launch Video - Audio Spec.md", "Plain-text launch score direction"),
      asset("Silent audio placeholder", "designer-campaign/audio/onemem-launch-bed.wav", "Temporary silent WAV used by the launch MP4 pending a researched replacement"),
      asset("Audio provenance", "designer-campaign/AUDIO_PROVENANCE.generated.md", "Hashes, loudness, rejected-sound notes, and reference-only audio boundary"),
      asset("Audio provenance JSON", "designer-campaign/audio-provenance.generated.json", "Machine-readable launch-audio provenance"),
      asset("Sound research", "designer-campaign/SOUND_RESEARCH.md", "Rejected sound history and next sound-research brief"),
      asset("Reference benchmark", "designer-campaign/REFERENCE_BENCHMARK.generated.md", "Measured inspiration notes for the three reference videos"),
      asset("Reference benchmark JSON", "designer-campaign/reference-benchmark.generated.json", "Machine-readable reference/video loudness metrics"),
      asset("Export manifest", "designer-campaign/exports/manifest.json", "Generated board/video hashes, dimensions, and source patches"),
      asset("Export README", "designer-campaign/exports/README.md", "How to regenerate generated campaign exports"),
      asset("README hero PNG", "designer-campaign/exports/static/readme-hero.png", "Exact 1280x420 README banner"),
      asset("X header PNG", "designer-campaign/exports/static/x-header.png", "Exact 1500x500 X profile banner"),
      asset("Link card PNG", "designer-campaign/exports/static/link-card.png", "Exact 1200x630 social link card"),
      asset("Tools poster PNG", "designer-campaign/exports/static/tools-poster.png", "Exact 1600x900 tools and integrations board"),
      asset("Architecture PNG", "designer-campaign/exports/static/architecture.png", "Exact 1920x1080 designed architecture board"),
      asset("Launch video MP4", "designer-campaign/exports/video/onemem-launch-30s.mp4", "30-second 1920x1080 launch video with silent placeholder audio"),
      asset("Campaign export script", "designer-campaign/scripts/export-designer-campaign.mjs", "Regenerates static boards and the launch MP4 from the raw zip"),
      asset("Audio provenance script", "designer-campaign/scripts/generate-audio-provenance.mjs", "Regenerates launch-audio provenance without retaining reference audio"),
      asset("Reference benchmark script", "designer-campaign/scripts/generate-reference-benchmark.mjs", "Measures raw-zip reference videos without keeping copied MP4s"),
      asset("Brand kit preview", "designer-campaign/screenshots/kit-overview.png", "Preview only; export final boards from HTML"),
      asset("X header preview", "designer-campaign/screenshots/xheader.png", "Preview only; export final 1500x500 board from HTML"),
      asset("Link card preview", "designer-campaign/screenshots/linkcard.png", "Preview only; export final 1200x630 board from HTML"),
      asset("Tools poster preview", "designer-campaign/screenshots/poster.png", "Preview only; export final 1600x900 board from HTML"),
      asset("Architecture preview", "designer-campaign/screenshots/arch.png", "Preview only; export final 1920x1080 board from HTML"),
    ],
  },
];

const logoGroups = [
  {
    id: "core-stack",
    title: "Core Stack Logos",
    vendorIds: ["sui", "walrus", "seal", "memwal"],
  },
  {
    id: "native-runtimes",
    title: "Native Runtime Logos",
    vendorIds: ["claude-code", "codex", "openclaw", "hermes-agent"],
  },
  {
    id: "mcp-surface",
    title: "MCP And Client Logos",
    vendorIds: [
      "model-context-protocol",
      "cursor",
      "windsurf",
      "opencode",
      "cline",
      "github-copilot",
      "antigravity",
    ],
  },
  {
    id: "frameworks",
    title: "Framework And Provider Logos",
    vendorIds: ["vercel-ai-sdk", "openai-agents", "crewai", "livekit", "elevenlabs"],
  },
  {
    id: "distribution",
    title: "Distribution And Tooling Logos",
    vendorIds: ["github", "npm", "pypi", "python", "x"],
  },
  {
    id: "comparison",
    title: "Comparison Anchor",
    vendorIds: ["mem0"],
  },
];

function asset(label, file, use) {
  return { label, file, use };
}

function readJson(rel) {
  return JSON.parse(readFileSync(path.join(brandRoot, rel), "utf8"));
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
}

function enrichAsset(item) {
  const abs = path.join(brandRoot, item.file);
  const stat = statSync(abs);
  return {
    ...item,
    sizeBytes: stat.size,
    size: formatBytes(stat.size),
  };
}

function buildLogoGroup(group, vendorById) {
  const assets = group.vendorIds.map((id) => {
    const vendor = vendorById.get(id);
    if (!vendor) {
      throw new Error(`Missing vendor logo id: ${id}`);
    }
    const files = vendor.files.map((file) => {
      const rel = `vendor-logos/${file}`;
      statSync(path.join(brandRoot, rel));
      return rel;
    });
    return {
      id,
      label: vendor.label,
      category: vendor.category,
      files,
      preferredFile: files[0],
      sourceType: vendor.sourceType,
      notes: vendor.notes ?? "",
    };
  });
  return { ...group, assets };
}

function buildKit() {
  const vendorManifest = readJson("vendor-logos/manifest.json");
  const vendorById = new Map(vendorManifest.assets.map((asset) => [asset.id, asset]));
  const assetGroups = groups.map((group) => ({
    ...group,
    assets: group.assets.map(enrichAsset),
  }));

  return {
    generatedAt: "2026-06-19",
    source: "packages/brand/media-kit/generate-media-kit.mjs",
    identity,
    guardrails,
    assetGroups,
    logoGroups: logoGroups.map((group) => buildLogoGroup(group, vendorById)),
    proofBoundary:
      "Brand media is not final live proof. Use a separate approved capture and verification pass before making real-wallet, physical-device, or live-runtime proof claims.",
  };
}

function main() {
  const kit = buildKit();
  const jsonPath = path.join(brandRoot, OUT_JSON);
  const mdPath = path.join(brandRoot, OUT_MD);
  const htmlPath = path.join(brandRoot, OUT_HTML);
  mkdirSync(path.dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, `${JSON.stringify(kit, null, 2)}\n`);
  writeFileSync(mdPath, buildMarkdown(kit));
  writeFileSync(htmlPath, buildHtml(kit));
  console.log(`[media-kit] Wrote ${OUT_JSON}`);
  console.log(`[media-kit] Wrote ${OUT_MD}`);
  console.log(`[media-kit] Wrote ${OUT_HTML}`);
}

main();
