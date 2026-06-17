# Spec: TS Provider Memory Alignment

## Objective

Make current-facing TypeScript framework provider docs, comments, and tests
match the shipped explicit OneMem memory helper surface.

## Background And Current Reality

The Vercel AI and OpenAI Agents providers both expose
`createOneMemMemory(...)` and `injectMemories` through the shared
`@onemem/sdk-ts/runtime` memory recorder. Current READMEs and provider overview
docs still describe memory recall/capture as deferred. OpenAI Agents has memory
helper unit coverage; Vercel AI does not.

Source: `.thoughts/research/2026-06-17-ts-provider-memory-alignment.md`.

## Users

- Framework developers choosing how to wire OneMem into Vercel AI SDK or
  OpenAI Agents apps.
- Future agents reading package READMEs and provider overview docs.
- Maintainers relying on package tests to catch provider API drift.

## Goals

- Document the real explicit memory helper in both TS provider package READMEs.
- Update provider source comments so they no longer contradict exported APIs.
- Update the framework-provider overview table so TS providers are not listed as
  memory-deferred.
- Add Vercel AI provider tests for `createOneMemMemory(...)` recall injection and
  capture passthrough.
- Preserve the honest boundary that automatic memory extraction, per-tool memory
  tools, and Python provider memory support remain follow-ups.

## Non-goals

- Do not add automatic memory injection middleware.
- Do not add Python provider memory support in this slice.
- Do not run live MemWal provider writes from unit tests.
- Do not change the shared SDK memory recorder behavior.

## Requirements

- R1: `packages/provider-vercel-ai/src/index.ts` top comment must describe trace
  middleware plus explicit memory helper support.
- R2: `packages/provider-openai-agents/src/index.ts` top comment must describe
  trace lifecycle capture plus explicit memory helper support.
- R3: `packages/provider-vercel-ai/README.md` must show how to import and use
  `createOneMemMemory(...)` for recall and capture.
- R4: `packages/provider-openai-agents/README.md` must show how to import and
  use `createOneMemMemory(...)` for recall and capture.
- R5: `docs/04-framework-providers/README.md` must distinguish TS explicit
  memory helpers from Python providers where memory remains deferred.
- R6: Vercel AI provider tests must cover `recallInto(...)` and `capture(...)`
  using a mocked shared runtime recorder.
- R7: Structure tests must register this Context Engineering artifact set.

## Acceptance Criteria

- AC1: A repository search no longer finds TS provider docs/source claiming
  Vercel/OpenAI Agents memory recall/capture is deferred.
- AC2: Vercel AI provider tests prove recalled memories are prepended to input.
- AC3: Vercel AI provider tests prove `capture(...)` delegates to the shared
  memory recorder and returns its result.
- AC4: Current provider overview still marks CrewAI/LiveKit/ElevenLabs memory
  as deferred unless those packages later implement memory helpers.
- AC5: Focused provider package tests, lint, typecheck, build, structure, and
  whitespace gates pass.

## Constraints

- Keep memory helper wording explicit and opt-in.
- Do not claim plaintext server access; memory remains MemWal `/manual`.
- Keep tests network-free and defensive.
- Do not touch unrelated dirty files in the large working tree.

## Stories Needed

- Provider developer recalls/captures memories in a Vercel AI app.
- Provider developer recalls/captures memories in an OpenAI Agents app.
- Maintainer catches Vercel memory helper drift in package tests.
- Future agent reads provider overview and sees accurate TS vs Python scope.

## Open Questions

- Future automatic memory extraction remains a separate product design.
- Live credentialed provider memory smoke can be added later if stable test
  accounts and API keys are available.

## Source References

- `.thoughts/research/2026-06-17-ts-provider-memory-alignment.md`
- `packages/sdk-ts/src/runtime-memory.ts`
- `packages/provider-vercel-ai/src/index.ts`
- `packages/provider-openai-agents/src/index.ts`
- `docs/04-framework-providers/README.md`
