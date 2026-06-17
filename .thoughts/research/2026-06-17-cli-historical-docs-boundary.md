# Reality Research: CLI Historical Docs Boundary

## Scope

Audit the remaining CLI architecture files that are not the load-bearing command
surface, then mark or correct stale implementation details so future agents do
not treat old design sketches as current code.

## Sources Checked

- `docs/05-our-architecture/05-cli/README.md`
- `docs/05-our-architecture/05-cli/cli-typescript-impl.md`
- `docs/05-our-architecture/05-cli/cli-python-impl.md`
- `docs/05-our-architecture/05-cli/output-design.md`
- `docs/05-our-architecture/05-cli/login-flow.md`
- `packages/cli-ts/src/index.ts`
- `packages/cli-ts/src/commands/login.ts`
- `packages/cli-ts/package.json`
- `packages/cli-python/onemem_cli/main.py`
- `packages/cli-python/pyproject.toml`

## Verified Facts

- `command-surface.md` is now the load-bearing current command list.
- The TS CLI uses Commander and exposes the current v0.1 command surface from
  `packages/cli-ts/src/index.ts`.
- The TS package currently depends on `@onemem/sdk-ts`, `@mysten/sui`, and
  `commander`; it does not depend on `chalk`, `ora`, `cli-progress`,
  `cli-table3`, TOML helpers, or `execa`.
- The Python CLI uses Click, not Typer/Rich, and exposes only
  `verify`, `trace list`, `trace get`, `trace events`, and `health`.
- `onemem login` binds `127.0.0.1` on an OS-assigned free port with
  `server.listen(0, "127.0.0.1")`, not a fixed `12340`/`12341` port scan.
- The current TS CLI does not register `onemem logout`.
- `cli-typescript-impl.md`, `cli-python-impl.md`, and `output-design.md` are
  still useful as historical design sketches, but they should not be read as
  current implementation truth.

## Inferences

- The safest cleanup is to make the historical boundary explicit instead of
  rewriting the old design sketches into partial current docs.
- `login-flow.md` is closer to a current protocol contract than a historical
  sketch, so correcting its concrete port/logout claims is better than marking
  the whole file obsolete.

## Unknowns And Questions

- Whether the old richer output design should be revived later is a product
  choice outside this cleanup.

## Not Included

- No CLI behavior changes.
- No implementation of deferred commands.
- No live browser login popup proof.
