# Stories: Plugin Marketplace Publication Readiness

## Traceability

Stories derive from
`.thoughts/specs/2026-06-17-plugin-marketplace-publication-readiness.md`.

## Story 1: Codex Marketplace Install

As a Codex user,
I want to add the OneMem repository marketplace and install `onemem-codex`,
so that I do not need a private checkout path to use OneMem MCP tools.

### Acceptance Criteria

- `codex plugin marketplace add Blockchain-Oracle/onemem --json` is the primary
  documented path.
- The marketplace selector is `onemem-codex@onemem`.
- A temporary `CODEX_HOME` local marketplace proof passes with the same
  marketplace name and plugin selector.

### Scenarios

- Given the marketplace manifest is present in a checkout, when Codex adds that
  marketplace, then `onemem-codex@onemem` is available and installable.

## Story 2: Claude Code Marketplace Install

As a Claude Code user,
I want to add the OneMem repository marketplace and install `onemem`,
so that Claude Code hooks are installable without pointing at a local package
directory.

### Acceptance Criteria

- `.claude-plugin/marketplace.json` exists and passes strict validation.
- `claude plugin install onemem@onemem` succeeds in a temporary home directory.
- The shipped plugin context lives in a skill, not in a root `CLAUDE.md` that
  Claude Code ignores.

### Scenarios

- Given a temporary `HOME`, when Claude Code adds the repo marketplace and
  installs `onemem@onemem`, then the plugin is enabled and version `0.1.0` is
  installed.

## Story 3: Publish Readiness Without Overclaiming

As a maintainer,
I want npm dry-runs and validation evidence,
so that I can distinguish publish-ready package state from actual registry
publication.

### Acceptance Criteria

- Npm dry-pack includes expected files for both packages.
- Npm publish dry-run passes for both packages.
- Final status explicitly says npm upload was not performed if auth is absent.

## Open Questions

- Which account or CI secret should perform the real npm upload.
- Whether the next live hook proof should use interactive `/hooks` trust or an
  automation-only `--dangerously-bypass-hook-trust` smoke for preliminary
  evidence.
