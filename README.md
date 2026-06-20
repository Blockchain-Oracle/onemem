# OneMem

Verifiable cross-runtime AI agent memory + action trace layer for Sui + Walrus + Seal + MemWal.

Apache-2.0. Built for Sui Overflow 2026 (Walrus track).

## Status

Hackathon implementation is active across protocol, SDKs, CLI, MCP, dashboard,
runtime integrations, landing, and docs. The old architecture-first plan still
exists for historical context, but day-to-day work now follows the Context
Engineering router in `AGENTS.md` and the artifacts under
`.thoughts/`.

Registry publication is current for the repo's npm and PyPI packages as of the
2026-06-19 `pnpm registry:status --strict` and
`pnpm release:preflight --strict --timeout 30` verification. The public Node CLI
install path is proven at `@onemem/cli@0.6.2`:
`npm exec --yes --package @onemem/cli@0.6.2 -- onemem --version` prints
`0.6.2`. Re-run registry/preflight commands before making a fresh public install
claim.

## Where to start

| You want to... | Read this |
|---|---|
| Work as an agent in this repo | `AGENTS.md` |
| See current Context Engineering artifacts | `.thoughts/wiki/index.md` |
| Understand the product + protocol | `.thoughts/wiki/project-map.md` + `docs/05-our-architecture/README.md` |
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

- `packages/` — 17 libraries (TS + Python mixed; SDKs, CLI, MCP server, dashboard, brand assets, plugins, providers)
- `apps/` — landing (`onemem.ai` historical placeholder; current social campaign uses `onemem.xyz`), docs (Mintlify), hosted-dashboard (`app.onemem.xyz`)
- `contracts/onemem/` — Sui Move package
- `services/` — Rust services (Nautilus relayer, stretch)
- `demos/` — 4 demo apps
- `scripts/` — repo-wide tooling
- `docs/` — architecture docs (mirror of `research/.../context/`)

## License

Apache-2.0. See `LICENSE`.
