# Stories: Registry-Aware Current Docs

## Story 1: User Installing The CLI

As a user reading public docs, I need to know whether `npm install -g
@onemem/cli` is currently available on npm, so I do not waste time debugging a
missing package as if it were my local environment.

Acceptance:
- CLI install docs include current registry boundary language.
- Docs point at `pnpm registry:status` for live truth.

## Story 2: Developer Using Provider Helpers

As a developer using provider package READMEs, I need to know whether helper
APIs like `createOneMemMemory(...)` or `create_onemem_memory(...)` are in the
public artifact or only in repo-local source.

Acceptance:
- Drifted provider READMEs state the local/source version and registry drift.
- Public provider docs state helper examples require the fresh local versions
  until publication catches up.

## Story 3: Agent Continuing Runtime Work

As a future coding agent, I need hook proof and registry publication to be
separate claims so I do not overstate Claude/Codex runtime readiness.

Acceptance:
- Claude and Codex runtime docs keep trusted hook proof boundaries explicit.
- Package/plugin docs do not imply npm publication for missing plugin packages.
