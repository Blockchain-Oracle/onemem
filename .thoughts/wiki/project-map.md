# Project Map: OneMem

## Summary

OneMem is a verifiable cross-runtime memory and action-trace layer for AI agents.
It uses Sui objects for namespaces, capabilities, TraceSessions, ActionCalls, and
Merkle-chain verification; Walrus stores blobs; Seal gates decryption; MemWal
provides the memory substrate.

Sources:

- `/Users/abu/dev/hackathon/sui-overflow/onemem/CLAUDE.md`
- `/Users/abu/dev/hackathon/sui-overflow/onemem/docs/00-goal/GOAL.md`
- `/Users/abu/dev/hackathon/sui-overflow/onemem/docs/05-our-architecture/00-overview/BUILD_SEQUENCE.md`
- `.thoughts/prototype-discovery/2026-06-17-one-mem-2.md`

## Current Source Layout

- `contracts/onemem/` — Sui Move protocol.
- `packages/sdk-ts/` — primary write-capable SDK.
- `packages/sdk-python/` — Python SDK, currently read/verify-oriented with memory bridge.
- `packages/cli-ts/`, `packages/cli-python/` — command-line surfaces.
- `packages/mcp-server/` — MCP stdio server.
- `packages/dashboard/` — local Next.js dashboard.
- `apps/hosted-dashboard/` — hosted auth/public verify shell with real dApp Kit
  account readiness, Enoki-sponsored namespace/RW-cap provisioning,
  wallet-owned CLI delegate pairing, owner share creation, and recipient
  capability viewing.
- `apps/landing/` — marketing site.
- `apps/docs/` — docs content.
- `packages/plugin-*` — runtime plugins.
- `packages/provider-*` — framework/voice providers.
- `demos/agent-sends-money/` — executable safe testnet demo that writes and
  verifies a mocked payment `TraceSession`.
- `demos/switch-laptops/` — executable safe testnet demo that writes and
  verifies two mocked cross-runtime handoff `TraceSession`s in one namespace.
- `demos/verifiable-research-agent/` — executable safe testnet demo that writes
  and verifies three mocked multi-day research `TraceSession`s in one namespace.

## Current Truth Sources

Use current code, package manifests, CI, and `BUILD_SEQUENCE.md` for build status.
Some older architecture docs still contain design-phase “pending” status tables.
Treat those tables as stale unless verified against current code.

## Prototype Source

The high-fidelity prototype lives at:

```text
/Users/abu/Downloads/One Mem 2
```

It covers landing, docs, dashboard overview, memories, apps, sessions, trace,
share, settings, login, CLI pairing, onboarding, and public verification.

## Quality Baseline

Core check:

```bash
pnpm test:structure
```

Full affected-stack checks are listed in:

```text
.thoughts/quality/2026-06-17-project-quality-profile.md
```

## Subagent-Safe Lanes

- Prototype gap audit.
- Docs/status cleanup.
- UI route implementation by route.
- Protocol/SDK verification.
- Runtime/provider smoke testing.
- Release/package metadata audit.
