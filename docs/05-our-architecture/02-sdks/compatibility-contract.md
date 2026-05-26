# Compatibility Contract — OneMem SDKs

Pattern lifted from MemWal (per `02-inspirations/memwal-incubation/README.md` — "Compatibility contract `compatibility.ts` exposes `minSupportedSdk` per language"). Strong production signal — adopt verbatim.

The goal: when we ship breaking SDK changes in v0.2+, users running old SDK versions get a clear, actionable error instead of mysterious failures.

---

## How it works

### Server side (relayer)

The relayer exposes `GET /v1/compatibility`:

```json
{
  "minSupportedSdk": {
    "typescript": "0.1.0",
    "python": "0.1.0"
  },
  "currentLatestSdk": {
    "typescript": "0.1.0",
    "python": "0.1.0"
  },
  "deprecatedAfter": {
    "typescript": null,
    "python": null
  },
  "messages": {
    "typescript": null,
    "python": null
  }
}
```

### SDK side (TS + Python)

On `OneMem.create()`, the SDK calls `assertCompatibility(serverUrl)`:

```ts
// src/compatibility.ts (TS)
export async function assertCompatibility(serverUrl: string): Promise<void> {
  const res = await fetch(`${serverUrl}/v1/compatibility`);
  const { minSupportedSdk, deprecatedAfter, messages } = await res.json();

  const myVersion = SDK_VERSION;  // baked in at build time
  const myLang = "typescript";

  if (semver.lt(myVersion, minSupportedSdk[myLang])) {
    throw new OneMemCompatibilityError(
      `OneMem SDK ${myVersion} is below the minimum supported version (${minSupportedSdk[myLang]}). ` +
      `Upgrade: npm install @onemem/sdk-ts@latest`
    );
  }

  if (deprecatedAfter[myLang] && semver.lte(myVersion, deprecatedAfter[myLang])) {
    console.warn(
      `[onemem] SDK ${myVersion} is deprecated and will stop working after ${deprecatedAfter[myLang]}. ` +
      `Upgrade soon: npm install @onemem/sdk-ts@latest`
    );
  }

  if (messages[myLang]) {
    console.info(`[onemem] ${messages[myLang]}`);
  }
}
```

Same logic in Python (`onemem/compatibility.py`).

---

## Version negotiation flow

```
SDK.create(config)
  │
  ├─▶ 1. GET /v1/compatibility
  │
  ├─▶ 2. Compare myVersion vs minSupportedSdk[myLang]
  │     ✗ Below min → throw OneMemCompatibilityError + actionable upgrade message
  │     ✓ Above min → proceed
  │
  ├─▶ 3. Check deprecatedAfter
  │     Display warning if applicable (don't block)
  │
  ├─▶ 4. Surface any server messages
  │     (e.g., "Maintenance window: relayer scheduled downtime 2026-07-15 02:00 UTC")
  │
  └─▶ 5. Continue construction
```

---

## SDK_VERSION baked at build time

TS: tsup config injects `__SDK_VERSION__` from `package.json` at build:

```ts
// tsup.config.ts
import { defineConfig } from 'tsup';
import pkg from './package.json';

export default defineConfig({
  define: {
    '__SDK_VERSION__': JSON.stringify(pkg.version),
  },
  // ...
});

// src/compatibility.ts
declare const __SDK_VERSION__: string;
export const SDK_VERSION = __SDK_VERSION__;
```

Python: read from package metadata at import:

```python
# onemem/compatibility.py
from importlib.metadata import version
SDK_VERSION = version("onemem-sdk-python")
```

---

## How we evolve safely

### v0.1 → v0.1.x (patch)
- `minSupportedSdk` stays at `"0.1.0"`
- No breaking changes
- Users keep working on any v0.1.x SDK

### v0.1 → v0.2 (minor with new features)
- New methods get added to SDK
- Old methods stay
- `minSupportedSdk` stays at `"0.1.0"` (existing users keep working)
- `currentLatestSdk` bumps to `"0.2.0"` (just informational)

### v0.2 → v1.0 (major / breaking)
- Schedule deprecation:
  - Bump `currentLatestSdk` to `"1.0.0"`
  - Set `deprecatedAfter["typescript"] = "0.2.99"` (last patch of v0.2)
  - Set `messages["typescript"] = "v0.2.x will lose support on 2026-12-01. Upgrade to v1.0."`
- Wait grace period (60 days minimum)
- THEN bump `minSupportedSdk` to `"1.0.0"`
- Old SDK installations now throw clear `OneMemCompatibilityError`

---

## What this protects us from

| Failure mode (without contract) | What the contract does |
|---|---|
| Old SDK calls deprecated endpoint → mysterious 404 | Clear "upgrade" error at create-time |
| New SDK calls endpoint old relayer doesn't have → mysterious 400/500 | Server-side `minSupportedSdk` ensures relayer + SDK match |
| SDK starts behaving differently after silent endpoint change | `messages` field lets server announce changes in-band |
| User on broken SDK files bug, we can't reproduce | SDK version in error → easy diagnosis |

---

## Error UX

When user hits compatibility error:

```
Error: OneMem SDK 0.1.0 is below the minimum supported version (0.3.0).

The OneMem relayer requires SDK version 0.3.0 or higher.
Your current SDK version: 0.1.0

To fix:
  npm install @onemem/sdk-ts@latest

Last supported version of relayer for SDK 0.1.x: v0.2.5
If you need to keep SDK 0.1.x, pin the relayer URL to: https://v0-2-5.relayer.memwal.ai
```

(The pinned-old-relayer URL is hypothetical — we may not run versioned relayers at v0.1. If we don't, the error just tells them to upgrade.)

---

## Testing the contract

Both SDKs ship tests against `/v1/compatibility`:

```ts
// tests/compatibility.test.ts
describe('compatibility contract', () => {
  it('passes when SDK version meets minSupported', async () => {
    mockRelayer('/v1/compatibility', { minSupportedSdk: { typescript: '0.0.5' } });
    await expect(OneMem.create(config)).resolves.toBeInstanceOf(OneMem);
  });

  it('throws OneMemCompatibilityError when below min', async () => {
    mockRelayer('/v1/compatibility', { minSupportedSdk: { typescript: '0.99.0' } });
    await expect(OneMem.create(config)).rejects.toThrow(OneMemCompatibilityError);
  });

  it('warns on deprecation but proceeds', async () => {
    mockRelayer('/v1/compatibility', { 
      minSupportedSdk: { typescript: '0.1.0' },
      deprecatedAfter: { typescript: '0.5.0' }
    });
    const warn = vi.spyOn(console, 'warn');
    await OneMem.create(config);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('deprecated'));
  });
});
```

---

## What this DOES NOT cover

- **Move package compatibility.** If the on-chain contract upgrades to a new schema, the SDK might still call old entry functions. Handled separately by the `01-protocol/upgrade-strategy.md` version-as-dynamic-field pattern.
- **MemWal SDK compatibility.** We depend on `@mysten-incubation/memwal` which has its own version contract. SDK pins exact MemWal range in `package.json`.
- **Sui chain compatibility.** Sui's RPC versioning is handled by `@mysten/sui` and `pysui` internally.

---

## Cross-references

- `shared-api-surface.md` — `health()` method that surfaces compatibility info post-creation
- `sdk-typescript.md` — TS-specific implementation
- `sdk-python.md` — Python-specific implementation
- `relayer-integration.md` — relayer endpoints including `/v1/compatibility`
- `../../02-inspirations/memwal-incubation/README.md` — MemWal's compatibility contract (the reference pattern)
