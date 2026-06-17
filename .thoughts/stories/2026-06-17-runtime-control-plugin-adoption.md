# Stories: Runtime-Control Plugin Adoption

## Traceability

- Spec: `.thoughts/specs/2026-06-17-runtime-control-plugin-adoption.md`
- Research:
  `.thoughts/research/2026-06-17-runtime-control-plugin-adoption.md`

## Story 1: OpenClaw Obeys Pause

As an OpenClaw user,
I want the Apps pause/trace controls to stop OpenClaw trace capture,
so that a paused runtime does not buffer or write new trace sessions.

### Acceptance Criteria

- New OpenClaw calls are not buffered while policy disables tracing.
- Existing OpenClaw buffers are not flushed when policy disables tracing before
  `agent_end`.
- No client/provisioning/session write occurs on policy skip.

### Scenarios

- Given `openclaw` is paused, when OpenClaw captures a tool call, then the
  recorder does not retain that call.
- Given a call was buffered before `openclaw` was paused, when the session ends,
  then the buffer is cleared and no trace write is attempted.

## Story 2: Codex Hooks Obey Pause

As a Codex user,
I want Codex trace hooks to honor runtime controls,
so that disabling Codex trace capture stops lifecycle trace writes.

### Acceptance Criteria

- `SessionStart` returns valid Codex JSON without opening a trace session while
  paused.
- `PostToolUse` does not buffer calls while paused.
- `Stop` clears local state/buffers and avoids append/end writes while paused.

### Scenarios

- Given `codex` is paused and a session state exists, when `PostToolUse` fires,
  then no buffer line is written.

## Story 3: Claude Code Hooks Obey Pause

As a Claude Code user,
I want Claude Code trace hooks to honor runtime controls,
so that disabling Claude trace capture stops lifecycle trace writes.

### Acceptance Criteria

- `SessionStart` does not open a trace session while paused.
- `PostToolUse` does not buffer calls while paused.
- `SessionEnd` clears local state/buffers and avoids append/end writes while
  paused.
- Hook state can be isolated in tests.

### Scenarios

- Given `claude-code` is paused and a session state exists, when `PostToolUse`
  fires, then no buffer line is written.
- Given `claude-code` is paused and buffered calls exist, when `SessionEnd`
  fires, then local buffer/state is cleared without client/network setup.

## Open Questions

- Whether a later cleanup should close already-open mid-session paused traces as
  Aborted.
