# Reality Research: Switch Laptops Executable Demo

## Scope

Current reality for turning the pending "Switch Laptops" demo into an
executable, safe, verifiable testnet trace demo. This research checks only the
repo state and existing commands; it does not claim real cross-device memory
sync.

## Sources Checked

- `demos/switch-laptops/README.md`
- `docs/05-our-architecture/08-demos-and-tests/demo-switch-laptops.md`
- `docs/05-our-architecture/08-demos-and-tests/README.md`
- `demos/agent-sends-money/*`
- `packages/sdk-ts/src/runtime.ts`
- `packages/sdk-ts/src/traces.ts`
- `packages/cli-ts/src/commands/verify.ts`
- `packages/cli-ts/src/commands/trace.ts`
- `tests/structure.test.ts`
- `pnpm-workspace.yaml`

## Verified Facts

- `docs/05-our-architecture/08-demos-and-tests/README.md` marks
  "Switch laptops" as pending while "Agent sends money" is now executable.
- `demos/switch-laptops/README.md` is README-only; there is no package manifest,
  source, tests, or command for the demo.
- The switch-laptops script's wedge is cross-machine/runtime continuity:
  Laptop A records project memory and Laptop B answers from the same OneMem
  namespace.
- The shipped SDK runtime helper `ensureNamespace()` provisions or reuses one
  persisted namespace/RW cap per label and network.
- The shipped SDK trace API can start sessions, append calls, close calls, end
  sessions, and verify sessions.
- The TS CLI can independently verify a session from chain data with
  `onemem verify <session-id>`.
- The TS CLI can read event chains with `onemem trace events <session-id>`.
- The existing executable demo pattern under `demos/agent-sends-money` creates a
  private workspace package with `demo:trace`, `typecheck`, `lint`, and `test`
  scripts.
- `pnpm-workspace.yaml` already includes `demos/*`.
- Structure tests now know how to guard executable demo packages through the
  `DEMOS` list and explicit file checks.

## Inferences

- The safest next executable demo is a simulated switch-laptops trace that
  writes two real testnet `TraceSession`s in the same namespace:
  one "Laptop A / Claude Code" session that records project context and one
  "Laptop B / Hermes" session that recalls and uses the same context.
- This slice can prove same-namespace trace continuity and independently
  verifiable Merkle chains.
- This slice cannot honestly prove real MemWal recall, cross-device login,
  Seal decryption, or actual Claude/Hermes hook execution unless those runtimes
  are driven live.

## Unknowns And Questions

- Whether the final demo recording should use real MemWal writes/decrypts or
  placeholder memory blob IDs for the first executable version.
- Whether dashboard UI should later add a dedicated cross-runtime paired-session
  view. Current code can at least show individual trace sessions and namespace
  metadata.
- Whether live Claude Code and Hermes plugins should be driven for final proof
  after the safe script exists.

## Not Included

- No browser/dashboard implementation audit.
- No live wallet/Enoki workflow audit.
- No implementation plan beyond current-reality facts.
