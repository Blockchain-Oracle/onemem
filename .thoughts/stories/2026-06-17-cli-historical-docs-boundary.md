# Stories: CLI Historical Docs Boundary

## Story 1: Future Agent Avoids Historical Sketch Drift

As a future coding agent, I need the old CLI implementation sketch to clearly
say it is historical so I do not implement or test against commands that are not
registered today.

### Acceptance

- Given I open `cli-typescript-impl.md`, `cli-python-impl.md`, or
  `output-design.md`
- When I read the top of the file
- Then I see that current truth lives in `command-surface.md` and package code.

## Story 2: CLI Login Reader Sees Actual Callback Behavior

As a developer reviewing `onemem login`, I need the login-flow doc to match the
current callback server behavior.

### Acceptance

- Given I open `login-flow.md`
- When I inspect the port and expiry/logout sections
- Then I see that the CLI binds an OS-assigned loopback port and does not expose
  current `onemem logout`.

## Story 3: Structure Test Catches Drift

As a maintainer, I need a cheap structure test that catches the old stale claims
coming back.

### Acceptance

- Given someone removes the historical notes or re-adds fixed callback ports
- When `pnpm test:structure` runs
- Then the test fails before those docs can be treated as current truth.
