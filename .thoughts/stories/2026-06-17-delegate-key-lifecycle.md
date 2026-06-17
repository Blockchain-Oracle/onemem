# Stories: Delegate Key Lifecycle

## Traceability

- R1/R2/R3: Expiry-aware credential resolution.
- R4/R5: Dashboard lifecycle visibility.
- R6: Hosted CLI label/TTL request.
- R7: Tests and secret non-leakage.

## Story 1: Expired File Credential Is Not Used

As a CLI or MCP user,
I want expired file-backed delegate credentials to be rejected,
so that memory tools do not silently write with stale credentials.

### Acceptance Criteria

- Past `expiresAt` on credentials file prevents file-backed memory config.
- Env-provided values can still override an expired file.
- Error text identifies the expiration condition.

### Scenarios

- Given `credentials.json` expired yesterday and no env values, when memory config
  resolves, then it returns no usable config and records expired state.
- Given `credentials.json` expired yesterday and all required env values are
  present, when memory config resolves, then env config is usable.

### Notes

This applies to any caller of `resolveMemoryConfigFromSources`, including CLI,
MCP, and runtime memory helpers.

## Story 2: Settings Shows Delegate Lifecycle

As a dashboard user,
I want the Delegate keys tab to show lifecycle state,
so that I know whether I need to re-run `onemem login`.

### Acceptance Criteria

- Configured unexpired credentials show active state.
- Credentials expiring soon show an expiring state.
- Expired credentials show expired state and re-pair guidance.
- Secret values are not serialized in the summary or rendered UI.

### Scenarios

- Given credentials expiring in two days, Settings shows an expiring-soon state.
- Given credentials expired in the past, Settings shows expired and does not show
  the private delegate key.

## Story 3: Hosted Pairing Requests Label And TTL

As a CLI pairing user,
I want to name the delegate key and choose TTL before approval,
so that the future hosted mint endpoint can create scoped credentials matching
my intent.

### Acceptance Criteria

- `/cli-login` includes label and TTL controls.
- The mint endpoint request body includes `label`, `ttlSeconds`, `nonce`, and
  `callbackPort`.
- If no mint endpoint is configured, the page still shows the honest
  configuration error.

### Notes

The page does not fabricate credentials. It forwards request metadata to the
configured signed-in mint endpoint.

## Open Questions

- Whether TTL options should be locked to 1h/24h/30d or expanded once hosted
  account policy exists.
