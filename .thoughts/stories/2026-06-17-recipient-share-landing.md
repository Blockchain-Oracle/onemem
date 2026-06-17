# Stories: Recipient Share Landing

## Traceability

- Research:
  `.thoughts/research/2026-06-17-recipient-share-landing.md`
- Spec:
  `.thoughts/specs/2026-06-17-recipient-share-landing.md`

## Story 1: Recipient Opens A Capability Link

As a share recipient,
I want to open `/share/[capability_id]`,
so that I can see whether the link points at a real OneMem namespace
capability.

### Acceptance Criteria

- The page shows capability kind, owner, owner kind, namespace id, and network.
- The page shows namespace name, kind, owner, and active state when available.
- The page links to Suiscan for the capability and namespace.

### Scenarios

- Given a real capability object, when I open its share URL, then I see the
  capability metadata from Sui.
- Given namespace metadata cannot be loaded, when I open the page, then the
  capability still renders and the namespace error is explicit.

## Story 2: Recipient Checks Wallet Ownership

As a connected wallet user,
I want the page to compare my address with the capability owner,
so that I know whether this wallet already owns the capability.

### Acceptance Criteria

- If no wallet is connected, the page asks me to connect only for comparison.
- If the connected address matches the owner, the page says this wallet owns
  the capability.
- If the connected address differs, the page shows the owner address and does
  not offer a fake claim button.

### Scenarios

- Given I connect the recipient wallet, when the page loads, then the account
  comparison shows a match.
- Given I connect another wallet, when the page loads, then the page says the
  capability owner is different.

## Story 3: Public Not-Found State

As a user with a bad or stale share link,
I want a clear public not-found page,
so that I know the route works but the object was not found.

### Acceptance Criteria

- The route renders "Capability not found" instead of crashing.
- The route includes the capability id and Suiscan object link.
- Browser smoke covers this deterministic state.

### Scenarios

- Given a valid-looking object id with no Sui object, when I open the route,
  then I see a not-found explanation and a link back to `/share`.

## Story 4: Honest Boundary

As a reviewer,
I want the route to state what it does not prove,
so that OneMem does not overclaim hosted share semantics.

### Acceptance Criteria

- The route says there is no separate claim transaction in contract v0.1.
- The route says it does not transfer ownership, decrypt payloads, or prove
  runtime usage.
- Docs/status update from "recipient claim links are future work" to "recipient
  landing exists; claim transfer remains future work".
