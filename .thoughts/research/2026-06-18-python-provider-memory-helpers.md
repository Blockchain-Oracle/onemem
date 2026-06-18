# Reality Research: Python Provider Memory Helpers

## Scope

Current reality for closing the Python framework-provider memory-helper gap in
CrewAI, LiveKit, and ElevenLabs packages. This brief checks repo code and docs
only; it does not claim external framework API support beyond the current
provider packages.

## Sources Checked

- `docs/04-framework-providers/README.md`
- `docs/05-our-architecture/04-frameworks/crewai-provider.md`
- `docs/05-our-architecture/04-frameworks/livekit-voice-provider.md`
- `docs/05-our-architecture/04-frameworks/elevenlabs-voice-provider.md`
- `packages/sdk-python/onemem/memory.py`
- `packages/sdk-python/onemem/client.py`
- `packages/sdk-python/tests/test_memory.py`
- `packages/provider-crewai/README.md`
- `packages/provider-crewai/onemem_crewai/tracer.py`
- `packages/provider-crewai/tests/test_tracer.py`
- `packages/provider-livekit/README.md`
- `packages/provider-livekit/onemem_livekit/tracer.py`
- `packages/provider-livekit/tests/test_tracer.py`
- `packages/provider-elevenlabs/README.md`
- `packages/provider-elevenlabs/onemem_elevenlabs/tracer.py`
- `packages/provider-elevenlabs/tests/test_tracer.py`
- `packages/provider-openai-agents/src/index.ts`
- `packages/provider-vercel-ai/src/index.ts`
- `mise exec -- pnpm registry:status`
- Local auth probe for `NPM_TOKEN`, `PYPI_TOKEN`,
  `ONEMEM_NPM_TRUSTED_PUBLISHING`, and `npm whoami`.

## Verified Facts

- The framework-provider overview says Python provider memory helpers remain
  follow-up work, while TypeScript providers expose explicit
  `createOneMemMemory(...)` helpers.
- The three Python provider package READMEs currently advertise trace-only scope:
  CrewAI defers Mem0-style `memory_config`, while LiveKit and ElevenLabs defer
  memory recall/capture.
- The Python SDK already exposes `MemoryClient.add(...)` and
  `MemoryClient.search(...)` through the `onemem-memory` Node bridge.
- `MemoryClient` is unit-tested with mocked subprocess output for add/search,
  non-zero exit, non-JSON output, spawn failure, and empty input.
- The Python providers currently depend on no install-time Python packages and
  shell trace writes through the `onemem-trace` Node bridge.
- TypeScript providers implement explicit memory helpers rather than automatic
  extraction: `createOneMemMemory().recallInto(...)` and `.capture(...)`.
- Local registry publication is not currently actionable: `NPM_TOKEN`,
  `PYPI_TOKEN`, and `ONEMEM_NPM_TRUSTED_PUBLISHING` are unset, and `npm whoami`
  returns `E401`.
- Registry status still reports missing npm packages
  `@onemem/brand`, `@onemem/cli`, `@onemem/dashboard`,
  `@onemem/claude-code-plugin`, `@onemem/codex-plugin`; missing PyPI packages
  `onemem-cli`, `onemem-sdk-python`; and `hermes-onemem` version drift.

## Inferences

- The lowest-risk Python provider parity slice is an explicit helper API that
  wraps `MemoryClient` and is imported by each provider package. That matches
  the shipped TypeScript provider boundary without claiming CrewAI
  `memory_config`, LiveKit framework subclassing, or ElevenLabs memory adapter
  support.
- The helper can stay defensive: recall should return unchanged/no context on
  memory errors, and capture should return false on failure, mirroring the TS
  provider contract that memory failures do not break host agent workflows.
- Adding `onemem-sdk-python` as a dependency to the Python provider packages is
  reasonable if the helpers import `onemem.memory.MemoryClient` directly.

## Unknowns And Questions

- Exact current CrewAI provider entry-point API is not verified here because this
  slice does not implement the deferred `memory_config={"provider": "onemem"}`
  path.
- Exact current LiveKit and ElevenLabs memory subclass APIs are not verified here
  because this slice does not implement framework-owned memory adapter classes.
- Live MemWal add/search is not verified in this brief; local tests can mock the
  Python SDK bridge.

## Not Included

- Automatic memory extraction or tool wiring.
- CrewAI `memory_config` provider registration.
- LiveKit or ElevenLabs framework memory subclasses/adapters.
- Registry publication.
- Live MemWal, Walrus, Seal, or Sui writes.
