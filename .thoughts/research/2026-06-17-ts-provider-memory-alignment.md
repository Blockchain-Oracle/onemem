# Reality Research: TS Provider Memory Alignment

## Scope

Audit whether the current TypeScript framework providers accurately document and
test their OneMem memory helper surface. This pass covers
`@onemem/vercel-ai-provider`, `@onemem/openai-agents`, and current-facing
provider docs.

## Sources Checked

- `packages/provider-vercel-ai/src/index.ts`
- `packages/provider-vercel-ai/tests/provider.test.ts`
- `packages/provider-vercel-ai/README.md`
- `packages/provider-openai-agents/src/index.ts`
- `packages/provider-openai-agents/tests/provider.test.ts`
- `packages/provider-openai-agents/README.md`
- `packages/sdk-ts/src/runtime-memory.ts`
- `packages/sdk-ts/tests/runtime-memory.test.ts`
- `docs/04-framework-providers/README.md`
- Command search:
  - `rg -n "memory recall/capture|memory injection|memory tools deferred|Trace-only|memory.*deferred|createOneMemMemory|injectMemories" packages/provider-vercel-ai packages/provider-openai-agents docs/04-framework-providers docs/05-our-architecture/04-frameworks apps/docs docs/03-target-runtimes`

## Verified Facts

- `packages/provider-vercel-ai/src/index.ts` imports
  `createMemoryRecorder`, `injectMemories`, `MemoryRecorder`, and
  `MemoryRecorderOptions` from `@onemem/sdk-ts/runtime`.
- `packages/provider-vercel-ai/src/index.ts` exports `injectMemories`, defines
  `OneMemMemoryOptions`, and implements `createOneMemMemory(...)` with
  `recallInto(input, topK)` plus inherited `recall(...)` and `capture(...)`.
- `packages/provider-vercel-ai/src/index.ts` still has a top-level comment that
  says memory recall/capture is a tracked follow-up.
- `packages/provider-vercel-ai/tests/provider.test.ts` covers trace middleware
  behavior but has no assertions for `createOneMemMemory(...)`, recall
  injection, or capture passthrough.
- `packages/provider-vercel-ai/README.md` still says the v0.1 scope is
  trace-only and that memory recall/capture is a tracked follow-up.
- `packages/provider-openai-agents/src/index.ts` also exports `injectMemories`,
  defines `OneMemMemoryOptions`, and implements `createOneMemMemory(...)`.
- `packages/provider-openai-agents/tests/provider.test.ts` already covers
  `createOneMemMemory(...)` recall injection and capture passthrough.
- `packages/provider-openai-agents/src/index.ts` and README still say memory
  recall/capture is a tracked follow-up.
- `packages/sdk-ts/src/runtime-memory.ts` implements the shared defensive memory
  recorder used by both TS providers. It returns unchanged input when no
  memories exist, returns `[]` on recall failure, and returns `false` on capture
  failure without breaking the host workflow.
- `docs/04-framework-providers/README.md` currently says Vercel AI SDK and
  OpenAI Agents memory injection/tools are deferred, even though their source
  files now expose explicit memory helper wrappers.

## Inferences

- The shipped TS provider memory helper is explicit and opt-in, not automatic
  middleware. Docs should say that memory recall/capture exists through
  `createOneMemMemory(...)`, while automatic extraction/tool interception
  remains out of scope.
- Python providers can remain documented as trace-only/deferred memory work
  because this research found no equivalent memory helper implementation there.
- Vercel AI provider needs unit coverage comparable to OpenAI Agents so future
  docs drift is backed by a code-level guard.

## Unknowns And Questions

- Whether future automatic memory extraction should be middleware/event-based or
  stay explicit is a product decision for a later feature slice.
- Live MemWal memory integration remains covered by SDK/runtime tests and
  credentialed smoke paths, not by provider unit tests.

## Not Included

- New automatic memory injection into Vercel AI SDK or OpenAI Agents calls.
- Python provider memory support.
- Live MemWal writes from provider tests.
- Changes to `@onemem/sdk-ts/runtime-memory`.
