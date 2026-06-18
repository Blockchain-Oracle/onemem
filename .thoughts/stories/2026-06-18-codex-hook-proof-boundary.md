# Stories: Codex Hook Matcher And Proof Boundary

## Traceability

Stories derive from
`.thoughts/specs/2026-06-18-codex-hook-proof-boundary.md` requirements R1-R5
and acceptance criteria AC1-AC5.

## Story 1: Broad SessionStart Matcher

As a OneMem maintainer,
I want the Codex plugin `SessionStart` matcher to match every hook-enabled
session source,
so that the package does not silently exclude valid Codex lifecycle starts.

### Acceptance Criteria

- `hooks/hooks.json` has an empty `SessionStart` matcher.
- A plugin unit test reads `hooks/hooks.json` and guards the empty matcher.

### Scenarios

- Given the hook runtime fires `SessionStart`, when Codex supplies any source
  value, then the hook registration remains eligible.

### Notes

- This does not prove Codex runs hooks in every execution mode.

## Story 2: Honest Hook Coverage Claim

As a user installing OneMem for Codex,
I want docs to separate MCP tool readiness from optional hook tracing,
so that I know what works without trusting hooks and what still needs proof.

### Acceptance Criteria

- Plugin README says `SessionStart` arms local capture state.
- Runtime docs state `codex exec` on CLI 0.140 did not run hooks locally.
- Docs keep full automatic Codex hook trace coverage unclaimed.

### Scenarios

- Given a user installs the plugin, when they do not trust hooks, then docs still
  identify MCP memory/search/verify as the working baseline.

## Story 3: Future-Agent Guardrails

As a future agent changing Codex plugin packaging,
I want tests that fail on unsupported manifest fields or overclaims,
so that repo docs stay aligned with the current Codex/plugin validator boundary.

### Acceptance Criteria

- Structure tests assert no unsupported `hooks` field exists in the Codex plugin
  manifest.
- Structure tests assert the README does not say `SessionStart` opens the final
  on-chain `TraceSession`.

## Open Questions

- Should interactive `/hooks` proof be run manually in the TUI before the next
  public release note?
