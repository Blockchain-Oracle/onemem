# Stories: Framework Provider Status Refresh

## Traceability

- Spec: `.thoughts/specs/2026-06-17-framework-provider-status-refresh.md`
- Requirements: R1-R5.

## Story 1: Read Accurate Provider Status

As a developer,
I want the architecture framework-provider README to show which provider
packages are built,
so that I do not plan already-completed provider work from stale pending labels.

### Acceptance Criteria

- The five built provider package names are not marked `⏳ pending`.
- The table describes current scoped behavior for each provider.
- The table keeps deferred behavior explicit.

### Scenarios

- Given I read the Vercel AI row,
  when I check current scope,
  then I see trace capture plus explicit `createOneMemMemory(...)`.
- Given I read the CrewAI row,
  when I check current scope,
  then I see trace callback support and the deferred Mem0-style memory provider
  boundary.

### Notes

- Current provider package READMEs remain the API truth.

## Story 2: Catch Pending-Status Regression

As a maintainer,
I want structure tests to reject stale pending rows for built providers,
so that future docs changes do not reintroduce false status.

### Acceptance Criteria

- `pnpm test:structure` fails if any built provider row is marked `⏳ pending`.
- The same guard confirms the README still points readers to the current
  provider overview.

### Scenarios

- Given someone changes `@onemem/vercel-ai-provider` back to `⏳ pending`,
  when structure tests run,
  then the docs guard fails.

### Notes

- This guard does not prove package publication or live framework execution.

## Open Questions

- None for this slice.
