# Stories: CLI Credentials Fallback

## Traceability

- Story 1 covers R1, R2, R3, R7 and AC1.
- Story 2 covers R2, R7 and AC1.
- Story 3 covers R5, R6 and AC4.

## Story 1: Saved Login Credentials Power Memory Commands

As a CLI user,
I want `onemem add/search` to use the credentials saved by `onemem login`,
so that login is a real setup step rather than a dead file write.

### Acceptance Criteria

- Memory config resolves from `~/.onemem/credentials.json` when env vars are
  absent.
- Missing credential fields produce explicit errors.
- Read-only CLI commands remain independent of memory credentials.

### Scenarios

- Given a credentials file containing delegate key, account id, embedding key,
  MemWal package id, and relayer URL, when `memoryConfigFromEnv({})` runs, then
  it returns a usable `MemoryConfig`.

### Notes

- The credential private key is read for local SDK use but never printed.

## Story 2: Automation Can Override Saved Credentials

As an operator,
I want env vars to override saved credentials,
so that CI, scripts, and demos can choose explicit accounts without editing the
credential file.

### Acceptance Criteria

- Env values win over file values field by field.
- Existing env-only tests still pass.

## Story 3: Settings Shows Safe Credential Status

As a local dashboard user,
I want Settings to show whether local delegate credentials are present,
so that I know whether to run `onemem login` without exposing secrets.

### Acceptance Criteria

- Settings shows account id, delegate public key, active namespace, expiry, and
  relayer/package status when available.
- Settings does not render delegate private key or embedding API key.
- Unsafe credential-file permissions render as an actionable error.

## Open Questions

- Whether a future Settings action should call `onemem logout` or only display
  the command.
