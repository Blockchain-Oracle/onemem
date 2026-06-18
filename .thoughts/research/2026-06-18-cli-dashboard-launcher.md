# Reality Research: CLI Dashboard Launcher

## Scope

Current reality for the local dashboard launch path: whether `onemem dashboard`
is registered in the TS CLI, how the dashboard package is exposed, and which
current-facing docs still reference that command.

## Sources Checked

- `packages/cli-ts/src/index.ts`
- `packages/cli-ts/package.json`
- `packages/cli-ts/README.md`
- `packages/dashboard/package.json`
- `packages/dashboard/bin/onemem-dashboard`
- `packages/dashboard/README.md`
- `docs/05-our-architecture/05-cli/command-surface.md`
- `docs/05-our-architecture/05-cli/README.md`
- `docs/05-our-architecture/06-dashboard/local-deploy.md`
- `docs/05-our-architecture/06-dashboard/README.md`
- `apps/docs/reference/cli.mdx`
- `tests/structure/docs-frameworks.test.ts`
- `ctx7` Commander.js docs for subcommands, options, and async actions:
  `/tj/commander.js`

## Verified Facts

- `packages/cli-ts/src/index.ts` registers `init`, `health`, `login`,
  `verify`, `trace`, `namespace`, `add`, and `search`. It does not register a
  `dashboard` command.
- `packages/dashboard/package.json` exposes a package binary named
  `onemem-dashboard`.
- `packages/dashboard/bin/onemem-dashboard` launches the built Next.js
  standalone `server.js` with `PORT` defaulting to `4040`.
- `packages/cli-ts/README.md` currently lists `onemem dashboard` as deferred and
  says users should call `onemem-dashboard` directly.
- `docs/05-our-architecture/05-cli/command-surface.md` lists
  `onemem dashboard` under deferred commands, despite local dashboard docs and
  demo docs using `onemem dashboard`.
- `docs/05-our-architecture/06-dashboard/local-deploy.md` describes
  `onemem dashboard [--port 4040] [--no-open]` with auto-install/open behavior
  that is not present in the current CLI.
- `docs/05-our-architecture/05-cli/README.md` says dashboard remains deferred.
- Current demo docs use `onemem dashboard` as the user-facing launch command.
- Commander.js supports subcommands with options and async action handlers when
  the program is parsed with `parseAsync()`, which the current TS CLI already
  uses.

## Inferences

- The product gap is not just stale docs: `onemem dashboard` is a meaningful
  expected UX and can be implemented as a thin launcher over the existing
  dashboard package binary.
- Keeping `@onemem/dashboard` as a separate package still matches the current
  package split; the CLI launcher can provide install guidance when the binary
  is absent instead of bundling the heavy dashboard into the CLI package.

## Unknowns And Questions

- Whether a future release should make `@onemem/dashboard` an optional
  dependency of `@onemem/cli`. Current package docs already support installing
  both packages globally.
- Whether auto-opening a browser should be added later. No current helper or
  dependency implements it in the CLI package.

## Not Included

- No dashboard UI route behavior was changed.
- No real local dashboard server was started in this research pass.
