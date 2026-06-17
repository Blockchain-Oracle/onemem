# Reality Research: CLI Command Surface Refresh

## Scope

Audit current CLI docs against the actual TS and Python CLI implementations.
This pass covers command/status truth only, not new CLI behavior.

## Sources Checked

- `docs/05-our-architecture/05-cli/README.md`
- `docs/05-our-architecture/05-cli/command-surface.md`
- `packages/cli-ts/src/index.ts`
- `packages/cli-ts/src/commands/*.ts`
- `packages/cli-ts/README.md`
- `packages/cli-python/onemem_cli/main.py`
- `packages/cli-python/README.md`
- `apps/docs/reference/cli.mdx`
- `packages/cli-ts/tests/`
- `packages/cli-python/tests/`

## Verified Facts

- `docs/05-our-architecture/05-cli/README.md` marks TS skeleton, Node command
  surface, Python skeleton, Python command surface, and browser login as
  pending even though current package files exist.
- The current TS CLI top-level commands in `packages/cli-ts/src/index.ts` are:
  `init`, `health`, `login`, `verify`, `trace list`, `trace get`,
  `trace events`, `namespace share`, `namespace revoke`,
  `namespace capabilities`, `add`, and `search`.
- The current TS CLI does not register `dashboard`, `logout`, `get`, `update`,
  `delete`, `list`, `history`, `export`, `namespace create`, `namespace list`,
  `namespace get`, `namespace deactivate`, `namespace reactivate`, `trace tree`,
  `trace end`, `replay`, `stats`, `set-namespace`, `set-agent`, `install`, or
  `uninstall`.
- The current TS CLI README and `apps/docs/reference/cli.mdx` already reflect
  the smaller shipped surface more accurately than `command-surface.md`, but
  they omitted the implemented namespace capability commands and described
  `add`/`search` as needing only MemWal config.
- The TS CLI accepts `local` as a network in validation, but the Commander help
  text and package README omitted it.
- The current Python CLI in `packages/cli-python/onemem_cli/main.py` is a
  read-only mirror with `verify`, `trace list`, `trace get`, `trace events`,
  and `health`.
- The Python CLI README correctly states Python provisioning/memory commands are
  not implemented.
- `docs/05-our-architecture/05-cli/command-surface.md` is labeled
  load-bearing but lists many deferred commands as current.

## Inferences

- Future agents can be misrouted by `command-surface.md` because it claims to be
  the exact command surface and includes unimplemented commands.
- A narrow structure guard can prevent unimplemented commands from returning as
  current `###` sections.

## Unknowns And Questions

- Whether deferred commands should be implemented later or remain out of v0.1 is
  a product/release choice outside this cleanup.

## Not Included

- No CLI behavior changes.
- No live Sui, MemWal, or browser login execution.
- No rewrite of `cli-typescript-impl.md` / `cli-python-impl.md`; those remain
  historical implementation-design notes unless later selected for cleanup.
