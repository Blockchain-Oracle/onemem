# Reality Research: Npm Bin Executable Integrity

## Scope

Audit npm package `bin` entries for local executable bits, shebangs, and
dry-pack file modes.

## Sources Checked

- `packages/*/package.json`
- Bin files under:
  - `packages/cli-ts/bin`
  - `packages/dashboard/bin`
  - `packages/mcp-server/bin`
  - `packages/plugin-openclaw/bin`
  - `packages/sdk-ts/bin`
- `npm pack --dry-run --json` for:
  - `packages/cli-ts`
  - `packages/dashboard`
  - `packages/mcp-server`
  - `packages/plugin-openclaw`
  - `packages/sdk-ts`
- Context7 `/npm/cli` docs for `package.json` `bin` behavior.

## Verified Facts

- Five npm packages declare `bin` entries:
  - `@onemem/cli`
  - `@onemem/dashboard`
  - `@onemem/mcp`
  - `@onemem/oc-onemem`
  - `@onemem/sdk-ts`
- npm docs say `bin` maps command names to executable files and that bin files
  should start with `#!/usr/bin/env node`.
- All inspected bin files start with `#!/usr/bin/env node`.
- Local file modes:
  - `packages/cli-ts/bin/onemem` is executable.
  - `packages/dashboard/bin/onemem-dashboard` is executable.
  - `packages/mcp-server/bin/onemem-mcp` is executable.
  - `packages/sdk-ts/bin/onemem-trace.mjs` is executable.
  - `packages/sdk-ts/bin/onemem-memory.mjs` is executable.
  - `packages/plugin-openclaw/bin/init.mjs` is not executable
    (`-rw-r--r--`).
- `npm pack --dry-run --json` reports bin file modes:
  - `@onemem/cli` `bin/onemem`: `493`.
  - `@onemem/dashboard` `bin/onemem-dashboard`: `493`.
  - `@onemem/mcp` `bin/onemem-mcp`: `493`.
  - `@onemem/sdk-ts` `bin/onemem-trace.mjs`: `493`.
  - `@onemem/sdk-ts` `bin/onemem-memory.mjs`: `493`.
  - `@onemem/oc-onemem` `bin/init.mjs`: `420`.

## Inferences

- The OpenClaw plugin's advertised `oc-onemem` command is the only current npm
  bin entry whose release artifact does not carry an executable bit.
- Adding a structure guard for all package `bin` entries can catch the same
  release-artifact issue before publishing.

## Unknowns And Questions

- npm may repair some bin permissions during install, but the local dry-pack
  artifact currently differs from the other OneMem bin packages and should not
  rely on installer repair.

## Not Included

- npm publishing.
- Package version bumps.
- Runtime behavior changes.
