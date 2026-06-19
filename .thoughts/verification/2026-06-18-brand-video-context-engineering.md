# Verification Audit: OneMem Brand And Video Context Engineering

## Verdict

Conditional pass for the brand/video slice.

The static campaign kit, HyperFrames emotional intro, Remotion 30-second
dashboard-capture demo package, and 30-second Remotion launch-mode cuts are
present and verified. The launch outputs now include landscape, square, and
vertical social masters plus X-upload-safe 720p derivatives. The launch audio is
an explicit sound-design mix: deterministic base bed, generated SFX impacts,
risers, UI bursts, bass pulses, and a final logo hit. The current cuts are
honest marketing/demo footage, not proof of physical laptop switching, a live
wallet payment, live web research, or real runtime hooks.
WASI/Nautilus/TEE must remain future/stretch copy until implementation is
confirmed.

## Artifacts Checked

- `.thoughts/design/2026-06-18-one-mem-campaign-designer-brief.md`
- `.thoughts/design/2026-06-18-onemem-emotional-video-brief.md`
- `.thoughts/design/2026-06-18-onemem-launch-mode-video-spec.md`
- `.thoughts/plans/2026-06-18-one-mem-campaign-assets.md`
- `.thoughts/plans/2026-06-18-onemem-emotional-intro-video.md`
- `.thoughts/research/2026-06-18-x-video-reference-benchmark.md`
- `.thoughts/research/2026-06-18-final-video-current-reality.md`
- `.thoughts/specs/2026-06-18-final-emotional-proof-video.md`
- `packages/brand/README.md`
- `packages/brand/briefs/one-mem-full-brand-and-asset-brief.md`
- `packages/brand/campaign/`
- `packages/brand/og-images/`
- `packages/brand/vendor-logos/`
- `packages/brand/video/onemem-intro/`
- `packages/brand/video/onemem-demo/`
- `tests/structure/brand-assets.test.ts`
- `tests/structure/brand-video-assets.test.ts`

## Requirement Traceability

| Requirement | Evidence | Status |
| --- | --- | --- |
| Use current OneMem cream-first visual identity, not the earlier brown/neon look. | Campaign SVG/PNG assets, HyperFrames `DESIGN.md`, Remotion CSS tokens, visual still checks. | Passed |
| Use correct public links. | Brand README, campaign assets, intro video, demo package use `onemem.xyz`, `docs.onemem.xyz`, `x.com/OneMemAI`. | Passed |
| Use OpenClaw spelling. | Structure tests reject bad spelling in campaign copy and demo source; docs use OpenClaw guardrails. | Passed |
| Build README/social/banner/link/architecture/tools assets. | `packages/brand/campaign/*.svg` and `*.png`, OG assets, and generated media-kit entries. | Passed |
| Provide a designer/ChatGPT prompt that explains the product, surfaces, supported runtimes, brand rules, and asset asks. | `packages/brand/briefs/one-mem-full-brand-and-asset-brief.md`, `packages/brand/media-kit/onemem-media-kit.generated.json`, `packages/brand/media-kit/onemem-media-kit.generated.md`, and `packages/brand/media-kit/onemem-media-kit.generated.html`. | Passed |
| Use relevant ecosystem logos and make them easy for agents to find. | `packages/brand/vendor-logos/manifest.json`, copied render assets for intro/demo packages, `packages/brand/media-kit/onemem-media-kit.generated.json`, `packages/brand/media-kit/onemem-media-kit.generated.md`, and `packages/brand/media-kit/onemem-media-kit.generated.html`. | Passed |
| Build emotional intro video with sound and handoff. | `packages/brand/video/onemem-intro/renders/onemem-intro.mp4`, bumper, vertical teaser, audio bed, `scripts/generate-intro-handoff.mjs`, and `notes/intro-handoff.generated.md`. | Passed |
| Download and inspect the supplied X reference videos. | `packages/brand/video/reference/x-videos/` contains downloaded MP4s, metadata, thumbnails, waveforms, contact sheets, and the research benchmark. | Passed |
| Build a sharper 30-second launch-mode cut. | `packages/brand/video/onemem-demo/renders/onemem-launch-30s.mp4`, `src/LaunchVideo.tsx`, `src/data/launchVideo.ts`, and `public/audio/onemem-launch-bed.wav`. | Passed |
| Make the launch cut audibly sound-designed, not silent/flat. | `public/audio/onemem-launch-base.wav`, `public/audio/onemem-launch-bed.wav`, `public/audio/generated-sfx/*.mp3`, `scripts/mix-launch-audio.mjs`, `scripts/apply-launch-audio-headroom.mjs`, `renders/onemem-launch-waveform.png`, and final MP4 `ffmpeg volumedetect` results at `-14.0 dB` mean / `-1.1 dB` max. | Passed |
| Provide X/social formats and handoff copy. | 1080p masters: `renders/onemem-launch-30s.mp4`, `renders/onemem-launch-square-30s.mp4`, `renders/onemem-launch-vertical-30s.mp4`. X-upload-safe derivatives: `renders/x-upload/onemem-launch-x-720p.mp4`, `renders/x-upload/onemem-launch-square-x-720p.mp4`, `renders/x-upload/onemem-launch-vertical-x-720p.mp4`. `notes/launch-handoff.generated.md` records actual MP4 metadata, upload uses, X copy, alt text, links, and proof boundary. | Passed |
| Keep video memory-first, not verify-first. | Video brief, intro README, and scene copy center `MemoryNamespace`, add/search/share/revoke, persistence, and recall. | Passed |
| Avoid unsupported WASI/Nautilus/TEE shipped claims. | Intro README, demo README, recording script, and design brief keep this as future/stretch only. | Passed |
| Prepare 30-second demo-video path. | `packages/brand/video/onemem-demo/` Remotion package with 30-second landscape and vertical timelines, generated evidence data, dashboard capture script, real footage mode, and rendered outputs. | Passed |
| Render current dashboard-capture demo cuts. | `renders/onemem-demo-30s.mp4` and `renders/onemem-demo-vertical-30s.mp4` render from `public/footage/*.mp4` dashboard trace-page clips. | Passed |
| Provide final video direction for follow-up Remotion/HyperFrames agents. | `.thoughts/research/2026-06-18-final-video-current-reality.md`, `.thoughts/specs/2026-06-18-final-emotional-proof-video.md`, `packages/brand/video/onemem-demo/notes/final-video-producer-brief.md`, and generated media-kit entries. | Passed |
| Provide a live-proof intake and render gate for the final recording pass. | `scripts/verify-live-proof-footage.mjs`, `scripts/live-proof-sui-rpc.mjs`, `scripts/live-proof-preflight.mjs`, `scripts/live-proof-operator.mjs`, `scripts/prepare-live-proof-footage.mjs`, `scripts/generate-live-proof-shotlist.mjs`, `scripts/generate-live-proof-recording-pack.mjs`, `public/footage/live-proof-manifest.example.json`, `notes/live-proof-shotlist.generated.md`, `notes/live-proof-recording-pack.generated.md`, `notes/live-proof-readiness.generated.json`, `public/footage/live/.gitkeep`, `src/data/liveProofFootage.generated.ts`, `OneMemDemoLiveProof`, `OneMemDemoLiveProofVertical`, and `npm run footage:verify-live:schema`. | Passed |
| Finish live screen-recorded proof demo. | Live recordings for a real wallet transfer, physical laptop switch, live web research, and real runtime hooks are not present. | Incomplete |

## Acceptance Criteria Coverage

- HyperFrames intro exists with final landscape, bumper, and vertical MP4s.
- HyperFrames intro handoff exists with probed render metadata, required local
  assets, suggested social copy, alt text, and proof-boundary copy.
- Remotion package refreshes evidence data from the four demo `latest-trace.json`
  files.
- Remotion package generates dashboard trace-page MP4 footage slots from those
  checked-in demo trace artifacts.
- Remotion package defaults to `footageMode: "real"` and uses those footage
  clips for the runtime/research/payment/multi-agent chapters.
- Remotion package has `live-proof` compositions that use only filenames
  generated from a strict live-proof manifest. If the live map is not prepared,
  the live-proof composition shows a gate card instead of falling back to
  dashboard proof panels.
- Remotion package uses a generated 30-second WAV bed for the current rendered
  cuts.
- Remotion package typechecks with `npm run typecheck`.
- Remotion stills render for intro and vertical close-frame checks.
- Final landscape and vertical demo MP4s are 900 video frames at 30fps, with
  audio present.
- Launch-mode landscape, square, and vertical MP4s are 900 video frames at
  30fps, with AAC audio streams and the corrected launch sound-design bed.
- X-upload-safe derivatives exist at 1280 x 720, 720 x 720, and 720 x 1280,
  with H.264 High Profile, AAC-LC audio, 30fps, and `yuv420p` limited-range
  video.
- Launch handoff exists with probed render metadata, static campaign asset
  checks, suggested X copy, alt text, posting checklist, and an explicit
  live-proof boundary.
- Generated media kit exists with machine-readable JSON, human-readable
  Markdown, and a static HTML gallery covering the package-local designer
  brief, final video producer brief, logos, static campaign images, intro cuts, launch cuts,
  demo/live-proof workflow assets, public links, and copy/proof guardrails.
- Final-video Context Engineering research/spec and package-local producer
  brief exist, with explicit current-cut inventory, Remotion/HyperFrames tool
  split, final live-proof gate commands, and WASI/Nautilus/TEE shipped-claim
  boundary.
- Generated live-proof recording pack exists with current readiness, exact live
  clip filenames, required proof fields, final commands, and a machine-readable
  go/no-go JSON that currently reports `ready: false`.
- Live-proof operator command exists and refreshes the recording pack and
  shotlist, reports missing final inputs, supports draft-manifest initialization,
  lists ffmpeg capture devices, and records a named clip only when a real screen
  input is supplied. It also prints paste-ready `recording.mediaSha256` values
  for externally recorded MP4s through `--hash=<path>` and for the expected live
  clip set through `--hash-live-clips`.
- Live-proof manifest validation requires per-clip recording provenance and
  compares each `recording.mediaSha256` value against the actual final MP4
  bytes before a live-proof render can be prepared.
- Live-proof manifest validation also requires canonical `0x` plus 64-hex Sui
  namespace/session/address IDs and base58 Sui transaction digests for proof
  fields before a live-proof render can be prepared.
- Live-proof manifest validation resolves namespace/session objects and
  transaction blocks against the configured Sui RPC before a live-proof render
  can be prepared.
- HyperFrames bumper starts on the opening story beat, not the old middle
  section.
- Visual inspection found and fixed the old close-frame placeholder and a
  vertical close-panel clipping issue.
- Structure tests cover campaign assets, video package docs, Remotion chapter data,
  public links, footage slot names, evidence files, generated capture metadata,
  and final MP4 handoff files.

## Quality Gates

Commands run:

```sh
npx ctx7@latest library Remotion "Create a Remotion video project with Composition, Series, Sequence, staticFile assets, defaultProps, and render scripts"
npx ctx7@latest docs /remotion-dev/remotion "Composition defaultProps Series Sequence AbsoluteFill staticFile Img Video Audio interpolate useCurrentFrame useVideoConfig render scripts Remotion 4 project structure"
npx ctx7@latest library yt-dlp "download X Twitter video locally with metadata thumbnail and best MP4 quality"
npx ctx7@latest docs /yt-dlp/yt-dlp "download X Twitter video locally with metadata thumbnail and best MP4 quality"
cd packages/brand/video && yt-dlp --no-playlist --write-info-json --write-thumbnail --output "reference/x-videos/%(uploader)s_%(id)s_%(height)sp.%(ext)s" "<reference X URLs>"
cd packages/brand/video/onemem-demo && npm install --no-package-lock
cd packages/brand/video/onemem-demo && npm run audio:generate
cd packages/brand/video/onemem-demo && npm run audio:generate:launch
cd packages/brand/video/onemem-demo && npm run audio:mix:launch
cd packages/brand/video/onemem-demo && npm run evidence:refresh
cd packages/brand/video/onemem-demo && ONEMEM_DASHBOARD_CAPTURE_BASE_URL=http://127.0.0.1:4040 npm run footage:capture
cd packages/brand/video/onemem-demo && npm run typecheck
cd packages/brand/video/onemem-demo && npx remotion still src/index.tsx OneMemLaunch --frame=0 --output=renders/onemem-launch-frame0.png
cd packages/brand/video/onemem-demo && npx remotion still src/index.tsx OneMemLaunch --frame=120 --output=renders/onemem-launch-frame120.png
cd packages/brand/video/onemem-demo && npx remotion still src/index.tsx OneMemLaunch --frame=330 --output=renders/onemem-launch-frame330.png
cd packages/brand/video/onemem-demo && npx remotion still src/index.tsx OneMemLaunch --frame=540 --output=renders/onemem-launch-frame540.png
cd packages/brand/video/onemem-demo && npx remotion still src/index.tsx OneMemLaunch --frame=810 --output=renders/onemem-launch-frame810.png
cd packages/brand/video/onemem-demo && npx remotion still src/index.tsx OneMemLaunch --frame=660 --output=renders/onemem-launch-surface-check.png
cd packages/brand/video/onemem-demo && npx remotion still src/index.tsx OneMemDemo --frame=0 --output=renders/onemem-demo-frame0.png
cd packages/brand/video/onemem-demo && npx remotion still src/index.tsx OneMemDemo --frame=150 --output=renders/onemem-demo-frame150.png
cd packages/brand/video/onemem-demo && npx remotion still src/index.tsx OneMemDemoVertical --frame=450 --output=renders/onemem-demo-vertical-frame.png
cd packages/brand/video/onemem-demo && npx remotion still src/index.tsx OneMemDemoVertical --frame=840 --output=renders/onemem-demo-vertical-close-check.png
cd packages/brand/video/onemem-demo && npm run render
cd packages/brand/video/onemem-demo && npm run render:launch
cd packages/brand/video/onemem-demo && npm run render:launch:square
cd packages/brand/video/onemem-demo && npm run render:launch:vertical
cd packages/brand/video/onemem-demo && npm run audio:headroom:launch
cd packages/brand/video/onemem-demo && npm run export:x:upload
cd packages/brand/video/onemem-demo && npm run launch:handoff
cd packages/brand/video/onemem-demo && npm run footage:shotlist
cd packages/brand/video/onemem-demo && npm run footage:recording-pack
cd packages/brand/video/onemem-demo && npm run footage:operator
cd packages/brand/video/onemem-demo && node scripts/live-proof-operator.mjs --hash-live-clips --json
cd packages/brand && npm run media-kit:generate
cd packages/brand/video/onemem-demo && npm run footage:verify-live:schema
cd packages/brand/video/onemem-demo && npm run footage:live-preflight
cd packages/brand/video/onemem-demo && npm run footage:prepare-live
cd packages/brand/video/onemem-demo && npm run render:vertical
cd packages/brand/video/onemem-intro && npm run check
cd packages/brand/video/onemem-intro && npm run intro:handoff
cd packages/brand/video/onemem-demo && ffprobe -v error -show_entries format=duration,size:stream=index,codec_type,width,height,duration,nb_frames,r_frame_rate -of json renders/onemem-launch-30s.mp4
cd packages/brand/video/onemem-demo && ffprobe -v error -show_entries format=duration,size:stream=index,codec_type,width,height,duration,nb_frames,r_frame_rate -of json renders/onemem-launch-square-30s.mp4
cd packages/brand/video/onemem-demo && ffprobe -v error -show_entries format=duration,size:stream=index,codec_type,width,height,duration,nb_frames,r_frame_rate -of json renders/onemem-launch-vertical-30s.mp4
cd packages/brand/video/onemem-demo && ffprobe -v error -show_entries format=duration,size:stream=index,codec_type,width,height,pix_fmt,color_range,duration,nb_frames,r_frame_rate -of json renders/x-upload/onemem-launch-x-720p.mp4
cd packages/brand/video/onemem-demo && ffprobe -v error -show_entries format=duration,size:stream=index,codec_type,width,height,pix_fmt,color_range,duration,nb_frames,r_frame_rate -of json renders/x-upload/onemem-launch-square-x-720p.mp4
cd packages/brand/video/onemem-demo && ffprobe -v error -show_entries format=duration,size:stream=index,codec_type,width,height,pix_fmt,color_range,duration,nb_frames,r_frame_rate -of json renders/x-upload/onemem-launch-vertical-x-720p.mp4
cd packages/brand/video/onemem-demo && ffprobe -v error -show_entries format=duration,size:stream=codec_type,width,height,duration,nb_frames,r_frame_rate -of json renders/onemem-demo-30s.mp4
cd packages/brand/video/onemem-demo && ffprobe -v error -show_entries format=duration,size:stream=codec_type,width,height,duration,nb_frames,r_frame_rate -of json renders/onemem-demo-vertical-30s.mp4
ffprobe -v error -show_entries format=duration,size:stream=index,codec_type,width,height,duration,nb_frames,r_frame_rate -of json packages/brand/video/onemem-intro/renders/onemem-intro-bumper.mp4
ffmpeg -hide_banner -nostats -i packages/brand/video/onemem-demo/renders/onemem-launch-30s.mp4 -af volumedetect -f null - 2>&1 | rg "mean_volume|max_volume"
ffmpeg -hide_banner -nostats -i packages/brand/video/onemem-demo/renders/onemem-launch-square-30s.mp4 -af volumedetect -f null - 2>&1 | rg "mean_volume|max_volume"
ffmpeg -hide_banner -nostats -i packages/brand/video/onemem-demo/renders/onemem-launch-vertical-30s.mp4 -af volumedetect -f null - 2>&1 | rg "mean_volume|max_volume"
ffmpeg -hide_banner -nostats -i packages/brand/video/onemem-demo/renders/onemem-demo-30s.mp4 -af volumedetect -f null - 2>&1 | rg "mean_volume|max_volume"
ffmpeg -hide_banner -nostats -i packages/brand/video/onemem-demo/renders/onemem-demo-vertical-30s.mp4 -af volumedetect -f null - 2>&1 | rg "mean_volume|max_volume"
ffmpeg -hide_banner -nostats -i packages/brand/video/onemem-intro/renders/onemem-intro-bumper.mp4 -af volumedetect -f null - 2>&1 | rg "mean_volume|max_volume"
cd packages/brand/video/onemem-demo && ffmpeg -hide_banner -v error -i renders/onemem-launch-30s.mp4 -f null -
cd packages/brand/video/onemem-demo && ffmpeg -hide_banner -v error -i renders/onemem-launch-square-30s.mp4 -f null -
cd packages/brand/video/onemem-demo && ffmpeg -hide_banner -v error -i renders/onemem-launch-vertical-30s.mp4 -f null -
cd packages/brand/video/onemem-demo && ffmpeg -hide_banner -v error -i renders/x-upload/onemem-launch-x-720p.mp4 -f null -
cd packages/brand/video/onemem-demo && ffmpeg -hide_banner -v error -i renders/x-upload/onemem-launch-square-x-720p.mp4 -f null -
cd packages/brand/video/onemem-demo && ffmpeg -hide_banner -v error -i renders/x-upload/onemem-launch-vertical-x-720p.mp4 -f null -
cd packages/brand/video/onemem-demo && node --check scripts/apply-launch-audio-headroom.mjs
cd packages/brand/video/onemem-intro && node --check scripts/generate-intro-handoff.mjs
cd packages/brand/video/onemem-demo && node --check scripts/generate-launch-handoff.mjs
cd packages/brand/video/onemem-demo && node --check scripts/verify-live-proof-footage.mjs
cd packages/brand/video/onemem-demo && node --check scripts/live-proof-sui-rpc.mjs
cd packages/brand/video/onemem-demo && node --check scripts/live-proof-preflight.mjs
cd packages/brand/video/onemem-demo && node --check scripts/live-proof-operator.mjs
cd packages/brand/video/onemem-demo && node --check scripts/prepare-live-proof-footage.mjs
cd packages/brand/video/onemem-demo && node --check scripts/generate-live-proof-shotlist.mjs
cd packages/brand/video/onemem-demo && node --check scripts/generate-live-proof-recording-pack.mjs
cd packages/brand/video/onemem-demo && node --check scripts/export-x-upload-renders.mjs
cd packages/brand && node --check media-kit/generate-media-kit.mjs
cd packages/brand && node --check media-kit/media-kit-html.mjs
cd packages/brand && node --check media-kit/media-kit-markdown.mjs
cd packages/brand/video/onemem-demo && ffmpeg -y -i renders/onemem-launch-30s.mp4 -filter_complex "aformat=channel_layouts=mono,showwavespic=s=1600x360:colors=4da2ff" -frames:v 1 renders/onemem-launch-waveform.png
cd packages/brand/video/onemem-demo && ffmpeg -y -i renders/onemem-launch-30s.mp4 -vf "fps=1/3,scale=320:-1,tile=5x2:padding=10:margin=10:color=black" -frames:v 1 renders/onemem-launch-contact.png
cd packages/brand/video/onemem-demo && ffmpeg -y -i renders/onemem-launch-square-30s.mp4 -vf "fps=1/3,scale=220:-1,tile=5x2:padding=10:margin=10:color=black" -frames:v 1 renders/onemem-launch-square-contact.png
cd packages/brand/video/onemem-demo && ffmpeg -y -i renders/onemem-launch-vertical-30s.mp4 -vf "fps=1/3,scale=150:-1,tile=5x2:padding=10:margin=10:color=black" -frames:v 1 renders/onemem-launch-vertical-contact.png
node --import tsx --test tests/structure/brand-live-proof-recording-pack.test.ts tests/structure/brand-media-kit.test.ts tests/structure/brand-video-assets.test.ts
npx --yes pnpm@10.33.0 test:structure
rg -n "OpenClaude|onemem\.ai|docs\.onemem\.ai|one\.mem|docs\.one\.mem" packages/brand --glob '!video/onemem-demo/scripts/verify-live-proof-footage.mjs'
rg -n "WASI|Nautilus|TEE" packages/brand/video/onemem-demo/src
rg -n "WASI|Nautilus|TEE" packages/brand/video/onemem-intro/index.html packages/brand/video/onemem-intro/compositions packages/brand/video/onemem-demo/src
node --input-type=module - <<'EOF'
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {validateSuiRpcEvidence} from './packages/brand/video/onemem-demo/scripts/live-proof-sui-rpc.mjs';
const trace = JSON.parse(readFileSync('demos/switch-laptops/out/latest-trace.json', 'utf8'));
const network = JSON.parse(readFileSync('config/networks.json', 'utf8'));
const chainObjects = new Map();
function object(objectId, label, expectedType) {
  chainObjects.set(objectId.toLowerCase(), {objectId, labels: new Set([label]), expectedTypes: new Set([expectedType])});
}
object(trace.namespaceId, 'smoke.namespaceId', '::namespace::MemoryNamespace');
object(trace.sessions[0].sessionId, 'smoke.traceSessionIds[0]', '::trace::TraceSession');
const chainTransactions = new Map();
chainTransactions.set(network.networks.testnet.tx_digest, {digest: network.networks.testnet.tx_digest, labels: new Set(['smoke.suiTransactionDigests[0]'])});
const failures = [];
const warnings = [];
await validateSuiRpcEvidence({argv: [], args: new Set(), allowExampleValues: false, chainObjects, chainTransactions, failures, repoRoot: resolve('.'), warnings});
console.log(JSON.stringify({failures, warnings}, null, 2));
if (failures.length) process.exit(1);
EOF
git diff --check -- packages/brand/video/onemem-demo packages/brand/video/onemem-intro/README.md packages/brand/README.md tests/structure/brand-assets.test.ts tests/structure/brand-video-assets.test.ts .thoughts/verification/2026-06-18-brand-video-context-engineering.md .thoughts/wiki/context-engineering-status.md
```

Results:

- Remotion evidence refresh: passed.
- Remotion audio generation: passed.
- X reference video download and local benchmark: passed for the unique
  AgentCard, Circle, Triton/Seal, and Sui reference videos.
- Dashboard footage capture: passed against `http://127.0.0.1:4040`, producing
  four MP4 footage slots and `public/footage/latest-capture.json`.
- Remotion typecheck: passed.
- Remotion still renders: passed.
- Launch-mode landscape, square, and vertical MP4 renders: passed. The square
  render was rerun alone after an initial corrupt parallel-render artifact; the
  final square MP4 decodes cleanly.
- HyperFrames `npm run check`: passed with zero errors, no console errors,
  155 text elements passing WCAG AA, and zero layout issues across 18 samples.
  The remaining six lint warnings are non-blocking structure/editability
  warnings: duplicate media discovery risk, GSAP-owned Studio editability,
  composition file size, and dense timeline guidance.
- Intro handoff generation passed, probing the HyperFrames landscape, bumper,
  vertical teaser, draft MP4, audio bed, and required logo assets, and writing
  `notes/intro-handoff.generated.md`.
- `node --check scripts/generate-intro-handoff.mjs`: passed.
- `ffprobe`: launch-mode landscape is 1920 x 1080, square is 1080 x 1080, and
  vertical is 1080 x 1920. All three are 30-second video streams at 30fps with
  900 frames and AAC audio streams. The bumper is 11.2 seconds at 336 frames.
- `ffprobe`: X-upload derivatives are 1280 x 720, 720 x 720, and 720 x 1280.
  They use H.264 High Profile, AAC-LC audio, 30fps, 900 frames, `yuv420p`, and
  limited color range.
- `ffmpeg volumedetect`: all three final launch-mode master renders measure
  `-14.0 dB` mean / `-1.1 dB` max after `npm run audio:headroom:launch`.
  The X-upload derivatives measure `-16.6 dB` mean / `-1.3 dB` max after
  export-time AAC headroom.
  The older landscape and vertical demo renders measure
  `-25.1 dB` mean / `-4.4 dB` max; bumper measures `-25.0 dB` mean /
  `-11.1 dB` max.
- Live-proof schema validation passed with expected missing-media warnings for
  the example manifest, including the new per-clip recording provenance and
  `recording.mediaSha256` fields. Strict mode now also validates canonical Sui
  object/address ID shapes, base58 transaction digest shapes, and Sui RPC
  existence for namespace/session objects and transaction blocks. The real
  `npm run footage:verify-live` command remains intentionally incomplete until
  actual live recordings, matching media hashes, and proof metadata exist.
- Live-proof Sui RPC smoke test passed against testnet using a checked-in demo
  namespace ID, checked-in TraceSession ID, and the deployment transaction
  digest from `config/networks.json`; result was `failures: []` and
  `warnings: []`.
- Live-proof preflight passed as a non-mutating report and identified the exact
  missing final inputs: `public/footage/live-proof-manifest.json` and the four
  required `public/footage/live/*.mp4` recordings.
- Live-proof shotlist generation passed, producing
  `notes/live-proof-shotlist.generated.md` from the example manifest with
  per-clip must-show points, proof fields, commands, and guardrails.
- `node --check scripts/generate-live-proof-shotlist.mjs`: passed.
- Live-proof recording-pack generation passed, producing
  `notes/live-proof-recording-pack.generated.md` and
  `notes/live-proof-readiness.generated.json`. The readiness JSON currently
  reports `ready: false`, no live manifest, and four missing final clips.
- `node --check scripts/generate-live-proof-recording-pack.mjs`: passed.
- Live-proof operator generation/check passed. `npm run footage:operator`
  refreshes the recording pack and shotlist, reports `Go/no-go: not ready`,
  lists the four missing live MP4 paths, prints clip-specific recording
  commands, prints SHA-256 digests after operator-driven recording, can hash
  externally recorded MP4s with `--hash=<path>`, can hash the expected live
  clip set with `--hash-live-clips`, and surfaces the same preflight gaps.
- `node scripts/live-proof-operator.mjs --hash-live-clips --json`: passed and
  reported all four expected live clips as missing, with no generated proof
  media and no fake `mediaSha256` values.
- `node --check scripts/live-proof-operator.mjs`: passed.
- Live-proof promotion validation is wired but intentionally refuses to run
  without the real manifest. Current result: `npm run footage:prepare-live`
  exits with `[prepare-live-proof-footage] Missing live-proof manifest:
  public/footage/live-proof-manifest.json`.
- `ffmpeg -v error -f null`: launch landscape, square, and vertical decode
  cleanly. X-upload landscape, square, and vertical derivatives also decode
  cleanly.
- Launch handoff generation passed, probing six launch MP4s and five campaign
  PNG assets and writing `notes/launch-handoff.generated.md`.
- `node --check scripts/generate-launch-handoff.mjs`: passed.
- Media-kit generation passed, validating brand logos, campaign/OG images,
  intro cuts, launch cuts, demo/live-proof workflow docs, and selected vendor
  logos, then writing `media-kit/onemem-media-kit.generated.json`,
  `media-kit/onemem-media-kit.generated.md`, and
  `media-kit/onemem-media-kit.generated.html`.
- `node --check media-kit/generate-media-kit.mjs`: passed.
- `node --check media-kit/media-kit-html.mjs`: passed.
- `node --check media-kit/media-kit-markdown.mjs`: passed.
- Source line caps after renderer split: `generate-media-kit.mjs` 241 lines,
  `media-kit-html.mjs` 140 lines, `media-kit-markdown.mjs` 65 lines, and
  `tests/structure/brand-media-kit.test.ts` 136 lines.
- After adding the final-video producer brief, source/test line caps remained
  under limits: `generate-media-kit.mjs` 242 lines,
  `media-kit-html.mjs` 140 lines, `media-kit-markdown.mjs` 65 lines,
  `tests/structure/brand-media-kit.test.ts` 137 lines, and
  `tests/structure/brand-video-assets.test.ts` 297 lines.
- After adding external-recorder hash support, `live-proof-operator.mjs` is
  240 lines, `generate-live-proof-recording-pack.mjs` is 218 lines, and
  `tests/structure/brand-live-proof-recording-pack.test.ts` is 123 lines.
- Static HTML gallery visual pass in headless system Chrome: desktop
  1440 x 1400 and mobile 390 x 1200 both loaded from `file://` with no console
  errors, no horizontal overflow, and no detected out-of-viewport elements.
- Focused brand live-proof/media-kit/video structure shards: 11/11 passed.
- Structure tests: `441/441` passed after adding final-video producer-brief
  coverage.
- Wrong-domain/bad-spelling search over active `packages/brand` copy: no
  matches after excluding the intentional live-proof verifier guardrail.
- Unsupported shipped-claim search over the active intro/demo video source: no
  WASI, Nautilus, or TEE matches. Guardrail docs still mention those terms only
  to forbid unsupported shipped claims.
- `git diff --check`: passed.

## Deviations From Plan

- The Remotion package was corrected to a 30-second structure after Abu
  clarified the intended length.
- Because the four demo packages already had real testnet trace artifacts, the
  placeholder cards were upgraded into evidence panels generated from those
  artifacts.
- After dashboard trace-page footage was generated, the Remotion default moved
  from `footageMode: "placeholder"` to `footageMode: "real"`.
- The close frame no longer uses the generic footage-slot placeholder; it now
  uses a launch-surface panel with links and supported surfaces.
- The opening fade was removed and the embedded intro clip starts on its first
  readable story beat, so the render no longer begins blank or at the old bumper
  middle section.
- The original HyperFrames opening scene had escaped HTML text in the source;
  that was replaced with real scene markup before regenerating the intro and
  bumper assets.
- ElevenLabs music generation returned HTTP 402 despite an available local API
  key, so full music generation was not used. ElevenLabs sound-effect
  generation did work for short transition layers, which were checked in under
  `public/audio/generated-sfx/` and baked into the final WAV by
  `scripts/mix-launch-audio.mjs`.
- After Abu called out that the launch video did not sound like the references,
  the launch audio pipeline was upgraded from a plain generated bed into a
  base-bed plus generated-SFX mix, then the Remotion launch MP4s were rerendered
  with a stronger composition audio level.
- The launch master renders now run through a package-local audio headroom pass
  after Remotion render so the final AAC stream avoids full-scale peaks.
- X-upload-safe derivatives were added after checking current X media guidance:
  H.264 High Profile, AAC-LC audio, 30fps, and `yuv420p` 720p outputs for
  landscape, square, and vertical posts.
- The X-upload exporter applies additional AAC headroom because re-encoding the
  upload derivatives can otherwise decode back to full-scale peaks.
- A generated launch handoff was added so social/video agents can use the right
  upload files, links, X copy, alt text, and proof boundary without piecing
  those details together from separate READMEs.
- A generated intro handoff was added so designers and social agents can use
  the right HyperFrames intro cut, bumper, vertical teaser, copy, alt text, and
  proof boundary from the actual rendered MP4 metadata.
- A live-proof intake validator was added instead of upgrading the current
  dashboard captures beyond their evidence. The validator defines the recording
  metadata and MP4 checks required before the final demo can claim live proof.
- A live-proof preparation step and two Remotion live-proof compositions were
  added. They keep live proof rendering separate from the current
  dashboard-capture renders and require the strict manifest gate before real
  live media can be promoted into the edit.
- A non-mutating live-proof preflight was added so the recording operator can
  check local tooling, manifest presence, live media, and strict verifier status
  before attempting final render commands.
- A generated live-proof shotlist was added so the recording operator can start
  from the manifest's exact clips and proof fields instead of hand-written stale
  copy.
- Voiceover was not generated. The approved brief says voiceover should wait
  until the final live proof cut is stable.
- The launch-mode cut intentionally uses a darker infrastructure palette than
  the cream-first static kit because the supplied X references lean on
  high-contrast kinetic type, dark technical environments, and louder audio.
- The launch runtime-surface logo tiles were adjusted after encoded-frame
  inspection because black marks such as Vercel/OpenAI were too low-contrast on
  the first dark tile treatment.
- WASI/Nautilus/TEE was not included as shipped behavior because current repo
  evidence shows it as skeleton/stretch material.

## Gaps And Risks

- The generated footage clips are dashboard trace-page captures backed by
  checked-in testnet trace artifacts. They are not proof of a real wallet
  transfer, physical laptop switch, live web research, or real runtime hooks.
- The final live proof demo cannot be honestly called complete until those live
  recordings exist, pass `npm run footage:verify-live`, pass
  `npm run footage:prepare-live`, render through `npm run render:live-proof`,
  and are visually checked.
- The launch-mode cut is the best coded Remotion pass from the supplied
  references. A studio-grade version would still benefit from authored
  Blender/Rive/After Effects motion assets or designer-provided 3D scenes.
- The Remotion package has local `node_modules/` after verification, ignored by
  `.gitignore`; it should not be committed.

## Follow-ups

- Record live proof clips for the real wallet transfer, physical laptop switch,
  live web research, and real runtime hooks.
- Fill `public/footage/live-proof-manifest.json` with real session IDs,
  transaction digests, namespace IDs, chapter-specific proof metadata, and
  `public/footage/live/*.mp4` files whose SHA-256 digests match each clip's
  `recording.mediaSha256`; use canonical `0x` plus 64-hex Sui IDs and base58
  Sui transaction digests, then run
  `npm run footage:recording-pack`, `npm run footage:shotlist`,
  `npm run footage:live-preflight:strict`, `npm run footage:verify-live`,
  `npm run footage:prepare-live`, `npm run render:live-proof`, and
  `npm run render:live-proof:vertical`.
- Generate or record final voiceover only after the live proof footage cut is
  stable.

## Evidence Log

- Downloaded X reference videos and inspection outputs:
  `packages/brand/video/reference/x-videos/`.
- Visual inspection: `renders/onemem-demo-frame.png`,
  `renders/onemem-demo-frame0.png`, `renders/onemem-demo-frame150.png`,
  `renders/onemem-demo-vertical-frame.png`,
  `renders/onemem-demo-final-frame0.png`,
  `renders/onemem-demo-evidence-contact.jpg`,
  `renders/onemem-demo-30s-contact.jpg`,
  `renders/onemem-demo-vertical-30s-contact.jpg`,
  `renders/onemem-demo-30s-review-grid.jpg`,
  `renders/onemem-demo-vertical-30s-review-grid.jpg`,
  `renders/onemem-demo-vertical-close-encoded.jpg`,
  `renders/onemem-demo-30s-close.jpg`, and
  `renders/onemem-demo-vertical-30s-close.jpg`.
- Final current renders: `renders/onemem-demo-30s.mp4` and
  `renders/onemem-demo-vertical-30s.mp4`.
- Final launch masters:
  `renders/onemem-launch-30s.mp4`,
  `renders/onemem-launch-square-30s.mp4`, and
  `renders/onemem-launch-vertical-30s.mp4`.
- X-upload derivatives:
  `renders/x-upload/onemem-launch-x-720p.mp4`,
  `renders/x-upload/onemem-launch-square-x-720p.mp4`, and
  `renders/x-upload/onemem-launch-vertical-x-720p.mp4`.
- Launch handoff:
  `packages/brand/video/onemem-demo/scripts/generate-launch-handoff.mjs` and
  `packages/brand/video/onemem-demo/notes/launch-handoff.generated.md`.
- Generated media kit:
  `packages/brand/media-kit/generate-media-kit.mjs`,
  `packages/brand/media-kit/media-kit-html.mjs`,
  `packages/brand/media-kit/media-kit-markdown.mjs`,
  `packages/brand/media-kit/onemem-media-kit.generated.json`,
  `packages/brand/media-kit/onemem-media-kit.generated.md`, and
  `packages/brand/media-kit/onemem-media-kit.generated.html`.
- Final video direction:
  `.thoughts/research/2026-06-18-final-video-current-reality.md`,
  `.thoughts/specs/2026-06-18-final-emotional-proof-video.md`, and
  `packages/brand/video/onemem-demo/notes/final-video-producer-brief.md`.
- Live-proof intake:
  `packages/brand/video/onemem-demo/scripts/verify-live-proof-footage.mjs`,
  `packages/brand/video/onemem-demo/scripts/live-proof-preflight.mjs`,
  `packages/brand/video/onemem-demo/scripts/live-proof-operator.mjs`,
  `packages/brand/video/onemem-demo/scripts/prepare-live-proof-footage.mjs`,
  `packages/brand/video/onemem-demo/scripts/generate-live-proof-shotlist.mjs`,
  `packages/brand/video/onemem-demo/scripts/generate-live-proof-recording-pack.mjs`,
  `packages/brand/video/onemem-demo/public/footage/live-proof-manifest.example.json`,
  `packages/brand/video/onemem-demo/notes/live-proof-shotlist.generated.md`,
  `packages/brand/video/onemem-demo/notes/live-proof-recording-pack.generated.md`,
  `packages/brand/video/onemem-demo/notes/live-proof-readiness.generated.json`,
  `packages/brand/video/onemem-demo/public/footage/live/.gitkeep`, and
  `packages/brand/video/onemem-demo/src/data/liveProofFootage.generated.ts`.
- Current launch-mode renders: `renders/onemem-launch-30s.mp4`,
  `renders/onemem-launch-square-30s.mp4`, and
  `renders/onemem-launch-vertical-30s.mp4`.
- Current launch audio evidence: `renders/onemem-launch-waveform.png`.
- Current launch visual contact sheets: `renders/onemem-launch-contact.png`,
  `renders/onemem-launch-square-contact.png`, and
  `renders/onemem-launch-vertical-contact.png`.
- Current launch encoded review grids:
  `renders/onemem-launch-30s-review-grid.jpg`,
  `renders/onemem-launch-square-30s-review-grid.jpg`, and
  `renders/onemem-launch-vertical-30s-review-grid.jpg`.
- Launch-mode spot checks:
  `renders/onemem-launch-surface-check.png`,
  `renders/onemem-launch-check-01.jpg`,
  `renders/onemem-launch-check-02.jpg`,
  `renders/onemem-launch-frame660-final.png`,
  `renders/onemem-launch-square-frame120-final.png`,
  `renders/onemem-launch-square-frame660-final.png`, and
  `renders/onemem-launch-vertical-frame660-final.png`.
- Generated footage clips:
  `public/footage/switch-laptops-runtime-continuity.mp4`,
  `public/footage/agent-sends-money.mp4`,
  `public/footage/verifiable-research-agent.mp4`, and
  `public/footage/multi-agent-coordination.mp4`.
- HyperFrames social bumper visual check:
  `packages/brand/video/onemem-intro/renders/onemem-intro-bumper-frame0.png`.
- HyperFrames intro handoff:
  `packages/brand/video/onemem-intro/scripts/generate-intro-handoff.mjs` and
  `packages/brand/video/onemem-intro/notes/intro-handoff.generated.md`.
- Audio source:
  `packages/brand/video/scripts/generate-product-bed.mjs`,
  `packages/brand/video/onemem-demo/scripts/mix-launch-audio.mjs`,
  `packages/brand/video/onemem-demo/public/audio/generated-sfx/`,
  `packages/brand/video/onemem-demo/public/audio/onemem-demo-bed.wav`,
  `packages/brand/video/onemem-demo/public/audio/onemem-launch-base.wav`,
  `packages/brand/video/onemem-demo/public/audio/onemem-launch-bed.wav`, and
  `packages/brand/video/onemem-intro/assets/audio/onemem-intro-bed.wav`.
- Fixed vertical overlap by moving `.vertical .logo-rail` above footer links.
- Search for wrong domains and bad framing returns only guardrail text, not
  active product copy.
