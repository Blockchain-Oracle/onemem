# OneMem

Verifiable cross-runtime AI agent memory + action trace layer for Sui + Walrus + Seal + MemWal.

Apache-2.0. Built for Sui Overflow 2026 (Walrus track).

## Status

Architecture phase complete (65 design docs). Build-prep phase complete. Bootstrap landed. Implementation begins per-pillar.

## Where to start

| You want to... | Read this |
|---|---|
| Understand the product + protocol | `docs/05-our-architecture/00-overview/README.md` |
| Run + extend a specific package | `packages/<name>/README.md` + `packages/<name>/CLAUDE.md` (where present) |
| Understand the Move contract | `docs/05-our-architecture/01-protocol/` + `contracts/onemem/sources/` |
| Understand the dashboard | `docs/05-our-architecture/06-dashboard/README.md` (read `purpose-local-vs-hosted.md` first) |
| See the build sequence | `docs/05-our-architecture/00-overview/MONOREPO_LAYOUT.md` + `BUILD_SEQUENCE.md` |
| Set up your dev env | See `Dev setup` below |

## Dev setup

```bash
mise install          # installs node, pnpm, python, uv, rust, sui per .mise.toml
pnpm install          # TS workspace
uv sync               # Python workspace
pnpm exec lefthook install   # git hooks
```

## Workspace at a glance

- `packages/` — 15 libraries (TS + Python mixed; SDKs, CLI, MCP server, dashboard, brand, plugins, providers)
- `apps/` — landing (`onemem.ai`), docs (Mintlify), hosted-dashboard (`app.onemem.ai`)
- `contracts/onemem/` — Sui Move package
- `services/` — Rust services (Nautilus relayer, stretch)
- `demos/` — 4 demo apps
- `scripts/` — repo-wide tooling
- `docs/` — architecture docs (mirror of `research/.../context/`)

## License

Apache-2.0. See `LICENSE`.
