# OneMem Launch Audio Provenance

Generated: 2026-06-19

## Boundary

The current launch audio is an intentionally silent placeholder. The rejected sound bed has been removed; third-party reference videos remain benchmark inputs only and must not be shipped, sampled, or recreated too closely.

## Kept OneMem Audio

- Source WAV: `audio/onemem-launch-bed.wav`
- SHA-256: `b96b59dcb0153a383ff6ddc3ae729c687e4fb9efb816dcc4f719f1718ef58574`
- Duration: 30.00s
- Audio: pcm_s16le, 48000 Hz, 2 ch
- Volume: mean -91 dB, max -91 dB

## Audio Source

- Digital silence placeholder - Project-generated placeholder; author: OneMem; Current 30-second WAV is intentionally silent so the rejected sound bed is removed from the launch video pending a researched replacement.

## Processing Notes

- No ElevenLabs output is used.
- The previous pulse/click-style generated bed was rejected by Abu because it sounded like a repetitive beat.
- The later CC0 wind ambience attempt was also rejected by Abu and has been removed from the launch export.
- The current audio file is 30 seconds of stereo 48 kHz PCM silence generated with ffmpeg anullsrc.
- The replacement brief remains: no drums, BPM grid, click loop, synthetic memory-write ticks, or repeated pulse layer.

## Rendered Launch Video

- MP4: `exports/video/onemem-launch-30s.mp4`
- SHA-256: `2c1e0859dba5a8f970c34dde35a200efb188477bbfc80646683c604693903ee0`
- Duration: 30.00s
- Audio: aac, 48000 Hz, 2 ch
- Volume: mean -91 dB, max -91 dB

## Reference Videos

- [Sui Network launch reference](https://x.com/SuiNetwork/status/2065207200059109376) - `uploads/SuiNetwork_2065207200059109376_720.mp4` - Benchmark pacing, contrast, and loudness only; do not use audio as source material.
- [AgentCard product-card reference](https://x.com/agentcardai/status/2032521033929076741) - `uploads/agentcardai_2032521033929076741_1080.mp4` - Benchmark pacing, contrast, and loudness only; do not use audio as source material.
- [Triton / Seal protocol reference](https://x.com/triton_one/status/2067664813514281095) - `uploads/triton_one_2067661855162777600_720.mp4` - Benchmark pacing, contrast, and loudness only; do not use audio as source material.

## Scoring Prompt

Research and source a new 30-second sound bed for OneMem; calm infrastructure, warm trust, quiet continuity; no beat, BPM, drums, click loop, mechanical pulse, repeated transient pattern, obvious melody, vocals, trailer impact, artist imitation, or famous-track style. The current shipped WAV is silence until the new source is approved.

## Release Checks

- Keep source WAV and rendered MP4 hashes in this manifest current.
- Do not replace the silent placeholder until the source/license and no-beat direction are documented.
- Check that any future rendered bed has no repeated pulse, click loop, or beat-like transient pattern.
- Keep third-party reference videos inside the raw zip or as links only.
- Re-run reference and audio provenance after replacing the score.
- Public masters should be checked for upload-specific loudness/headroom.
