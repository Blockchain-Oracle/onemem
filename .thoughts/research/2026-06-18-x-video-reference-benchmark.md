# Reality Research: X Video Reference Benchmark

## Scope

Benchmark the X/Twitter reference videos Abu provided for visual quality, timing,
audio energy, and production direction before changing the OneMem video.

This is a research pass only. It does not remake the OneMem video yet.

## Sources Checked

- X reference: `https://x.com/agentcardai/status/2032521350901019080?s=20`
- X reference: `https://x.com/circle/status/2053897932731285627?s=20`
- X duplicate/reference mirror: `https://x.com/i/status/2053897932731285627`
- X reference: `https://x.com/triton_one/status/2067664813514281095?s=20`
- X reference: `https://x.com/SuiNetwork/status/2065207265708356057?s=20`
- Current CLI documentation lookup: Context7 `/yt-dlp/yt-dlp`
- Local tools:
  - `yt-dlp 2026.03.17`
  - `ffmpeg 8.1.1`
  - `ffprobe 8.1.1`

## Local Assets

Stored under:

`packages/brand/video/reference/x-videos/`

Downloaded MP4s:

- `agentcardai_2032521033929076741_1080.mp4`
- `circle_2053892572809179136_1080.mp4`
- `triton_one_2067661855162777600_720.mp4`
- `SuiNetwork_2065207200059109376_720.mp4`

Derived inspection files:

- `agentcardai_contact.png`
- `circle_contact.png`
- `triton_contact.png`
- `sui_contact.png`
- `agentcardai_waveform.png`
- `circle_waveform.png`
- `triton_waveform.png`
- `sui_waveform.png`

Each downloaded video also has a `.info.json` metadata file and thumbnail.

## Verified Facts

| Reference | File | Duration | Size | Video | Audio level |
| --- | --- | ---: | ---: | --- | --- |
| AgentCard | `agentcardai_2032521033929076741_1080.mp4` | 25.51s | 2.4 MiB | 1080x1080, 30fps, 764 frames, 645 kb/s video | mean `-12.9 dB`, max `-0.0 dB` |
| Circle | `circle_2053892572809179136_1080.mp4` | 44.99s | 3.8 MiB | 1920x1080, 30fps, 1348 frames, 563 kb/s video | mean `-11.5 dB`, max `-0.6 dB` |
| Triton / Seal | `triton_one_2067661855162777600_720.mp4` | 39.45s | 2.3 MiB | 720x720, 30fps, 1182 frames, 359 kb/s video | mean `-16.2 dB`, max `-0.0 dB` |
| Sui | `SuiNetwork_2065207200059109376_720.mp4` | 45.08s | 1.8 MiB | 720x720, 30fps, 1351 frames, 204 kb/s video | mean `-8.4 dB`, max `0.0 dB` |

Download notes:

- The duplicate Circle URL points to the same status ID and was not downloaded
  twice.
- Anonymous `yt-dlp` download worked. No browser cookies were used.
- One AgentCard HLS metadata request timed out, but `yt-dlp` recovered with a
  direct MP4 format.
- `yt-dlp` warned that local version `2026.03.17` is older than 90 days, but the
  downloads completed.

Audio/transcription notes:

- HyperFrames local transcription was attempted with `base.en`.
- The local model download stalled and the command was stopped.
- No reliable transcript was produced in this pass.
- The waveforms still show the references are mixed much louder and more
  deliberately than the first OneMem bed. The earlier OneMem demo render measured
  around `-25.1 dB` mean / `-4.4 dB` max, while the references sit around
  `-8.4 dB` to `-16.2 dB` mean and peak near full scale.

## Visual Facts From Contact Sheets

AgentCard:

- White/minimal interface mockups and large product statement typography.
- Uses simple chat/payment/order states instead of dense architecture diagrams.
- Product promise is carried by a sequence of concrete use cases.
- Square format, clear phone/social pacing.

Circle:

- Soft blue/white gradient world, floating cards, UI panels, and corporate
  financial product polish.
- Uses spatial depth and layered panels rather than a flat deck of cards.
- The typography is restrained but large, with the product name introduced as a
  calm reveal.
- More conventional enterprise/social polish than the Sui/Triton references.

Triton / Seal:

- Dark grid world, stark black/white/blue palette, kinetic editorial typography,
  and isometric 3D plates.
- Text is the animation object, not just a caption over visuals.
- Uses high contrast, hard cuts, fast blocks, and 3D symbol staging.
- Feels closest to a high-energy crypto infrastructure launch motion language.

Sui:

- Dark grid world plus blue horizon/gradient moments.
- Large kinetic type, repeated words, numeric shock framing, and abstract line
  asset motion.
- Copy is broken into short phrases instead of long explanatory sentences.
- Strongest sound waveform of the set, with a near-commercial loudness profile.

## Inferences

- The references are not just "nice UI videos." They are motion-design ads:
  short phrases, heavy rhythm, brand color discipline, big type, and audio-led
  scene changes.
- Our current 30-second OneMem demo is too quiet and too dashboard/document-like
  compared with these examples.
- For OneMem, the closest visual direction is likely a hybrid of:
  - Circle's clean product/card polish for trust and links.
  - Triton/Sui's dark-grid kinetic type and 3D infrastructure objects for the
    memorable launch energy.
- The improvement does not require abandoning Remotion or HyperFrames by
  default. The gap is mainly art direction, asset quality, choreography, and
  audio mix. A higher-end result may still need Blender/Three.js assets or a
  designer-exported motion layer.

## Unknowns And Questions

- Whether Abu wants the final OneMem piece closer to:
  - AgentCard/Circle: clean white product demo, or
  - Triton/Sui: darker crypto-infrastructure motion ad.
- Whether to keep the current cream-first brand in the video, or allow a darker
  launch-mode variant specifically for X/social motion.
- Whether the final audio should use voiceover, music/SFX only, or a hybrid.
- Whether the designer will provide 3D/logo assets, or Codex should generate the
  first motion system directly.

## Not Included

- No OneMem video remake yet.
- No final script rewrite yet.
- No voiceover generation yet.
- No music licensing selection yet.
