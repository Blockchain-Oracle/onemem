# Stories: Runtime Controls

## Traceability

- Spec: `.thoughts/specs/2026-06-17-runtime-controls.md`
- Research: `.thoughts/research/2026-06-17-runtime-controls.md`

## Story 1: Pause A Runtime

As a local dashboard user,
I want to pause a runtime from the Apps page,
so that supported integrations stop writing new traces until I resume them.

### Acceptance Criteria

- The Apps page shows a pause/resume control per runtime.
- The control persists to the local runtime policy file.
- Paused state is visible after reload.
- Supported recorders skip trace writes while paused.

### Scenarios

- Given `vercel-ai` is active, when I pause it, then the local policy records
  `paused: true`.
- Given the local policy has `paused: true`, when `createTraceRecorder()` records
  for `vercel-ai`, then it does not resolve a signer or create a trace session.
- Given the local policy has `paused: true`, when `onemem-trace` records for
  `crewai`, then it returns a structured skip without resolving a signer.

## Story 2: Disable Trace Capture

As a local dashboard user,
I want to disable trace capture for a runtime,
so that runtime can remain installed without emitting new traces.

### Acceptance Criteria

- The Apps page shows a trace-capture toggle per runtime.
- The toggle persists to the local runtime policy file.
- Supported recorders skip trace writes while trace capture is disabled.

### Scenarios

- Given `openai-agents` trace capture is disabled, when the provider records a
  tool batch, then no OneMem client is created and no trace write is attempted.

## Story 3: Honest Runtime Coverage

As a OneMem developer,
I want the runtime-control surface to distinguish enforced controls from future
adoption work,
so that the product does not overclaim parity across all plugins.

### Acceptance Criteria

- The implementation lists all known runtimes, including Codex.
- Verification documents that `createTraceRecorder()` users are enforced now.
- Verification documents that current `onemem-trace` bridge users are enforced
  now.
- Verification documents non-TS/plugin-specific recorders as follow-up adoption.

### Scenarios

- Given a future agent reads the verification audit, when it plans the next
  runtime-control slice, then it can identify which packages still need policy
  checks.

## Open Questions

- Whether uninstall should mean hiding policy, removing plugin config, or calling
  each runtime's native uninstall command.
