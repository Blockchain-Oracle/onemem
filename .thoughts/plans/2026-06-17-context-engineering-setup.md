# Plan: Context Engineering Setup For OneMem

## Inputs

- Existing OneMem repo at `/Users/abu/dev/hackathon/sui-overflow/onemem`.
- Prototype source at `/Users/abu/Downloads/One Mem 2`.
- Repo architecture docs, package manifests, CI workflow, hooks, and current source.
- Context Engineering operating model from the Abu Context Engineering plugin.

## Assumptions

- Product code should not be deleted during setup unless it is clearly generated,
  stale, or explicitly approved for removal.
- The current `CLAUDE.md` files remain useful for Claude-oriented workflows and are
  still expected by structure tests.
- Codex should use `AGENTS.md` as the small always-on router and keep large context
  artifacts under `.thoughts`.

## Open Questions

- Should stale status tables inside architecture docs be rewritten now, or marked as
  historical design-phase docs?
- Should the 400-line cap be reduced after large near-limit files are split?
- Which prototype deltas are approved for implementation?

## Phase 1: Establish Context Roots

### Goal

Create the Context Engineering artifact layout for OneMem.

### Work

- Create `.thoughts/{raw,wiki,research,quality,specs,stories,design,prototype-discovery,plans,verification,handoffs}`.
- Register the `One Mem 2` prototype as an immutable raw source pointer.
- Add source-backed wiki index and project map.

### Checks

- Confirm files exist.

### Stop Condition

Future agents can find stable project context without scanning the whole repo.

## Phase 2: Replace Stale Codex Router

### Goal

Make repo `AGENTS.md` accurate and small.

### Work

- Replace stale claude-mem placeholder text.
- Add project snapshot, commands, quality gates, Context Engineering artifact paths,
  skill routing, subagent lanes, and do-not rules.

### Checks

- `pnpm test:structure`

### Stop Condition

Codex starts future sessions with useful routing instructions.

## Phase 3: Prototype And Quality Discovery

### Goal

Convert the high-fidelity static prototype into implementation-relevant evidence.

### Work

- Write a prototype-discovery report.
- Write a project quality profile grounded in manifests, CI, hooks, and current source.
- Identify deltas requiring user acceptance before implementation.

### Checks

- Review report for evidence-backed claims and target-stack translation.

### Stop Condition

Prototype work can be planned from accepted deltas instead of copied blindly.

## Phase 4: Stale Documentation Cleanup

### Goal

Reduce contradictions between old architecture status tables and current code.

### Work

- Audit docs that still say implemented packages/routes are pending.
- Either update status tables or add a clear “historical design snapshot” note.
- Do not rewrite product specs silently; preserve design rationale.

### Checks

- `pnpm test:structure`
- Markdown link spot checks where changed.

### Stop Condition

New agents no longer mistake stale design-phase status tables for current truth.

## Phase 5: Implementation Planning

### Goal

Plan only approved prototype deltas.

### Work

- Choose which prototype deltas are v0.1 versus v0.2.
- Create stories or acceptance criteria for approved deltas.
- Write a research-backed implementation plan with package ownership and tests.
- Split work into subagent-safe lanes.

### Checks

- Plan has explicit verification steps and stop conditions.

### Stop Condition

Implementation can proceed without rediscovering design intent.

## Verification Checkpoint

Before claiming setup complete:

```bash
pnpm test:structure
```

For subsequent code changes, use the full affected stack gates from the quality
profile.

## Handoff Notes

Recommended next subagent lanes:

- Prototype gap auditor: compare `One Mem 2` against current Next.js routes.
- Docs-status auditor: classify stale docs as historical versus current.
- UI implementation worker: one approved route/flow at a time.
- Trust-path verifier: exercise public verify, trace verify drawer, decrypt flow,
  and MCP server against real testnet data.
