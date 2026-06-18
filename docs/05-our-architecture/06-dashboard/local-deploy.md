# Local Deploy — `localhost:4040`

The OneMem dashboard running on the user's own machine, launched via
`onemem dashboard`. The UI bundle stays in the separate `@onemem/dashboard`
package; the TS CLI delegates to that package's `onemem-dashboard` binary.

> **Audit context 2026-05-26.** This is the **daily-driver** surface — used every coding session, no login, reads `~/.onemem/credentials.json`. Authoritative purpose split + what local does NOT include (no `/verify/[session_id]`, no `/onboarding`, no `/login`, no `/cli-login`) is in `purpose-local-vs-hosted.md`. Framework confirmed as Next.js 15 standalone output per `../00-overview/TOOLING_DECISIONS.md`.

---

## Package layout (the `@onemem/dashboard` npm package)

```
onemem-dashboard/
├── package.json
├── README.md
├── next.config.mjs               # Next.js config; standalone output
├── app/ ...                      # Same Next.js app as ui-architecture.md
├── components/ ...
├── lib/ ...
├── bin/
│   └── onemem-dashboard          # executable that runs the standalone server
├── public/ ...
└── tsconfig.json
```

---

## `package.json`

```json
{
  "name": "@onemem/dashboard",
  "version": "0.1.0",
  "description": "OneMem dashboard — verifiable memory + trace viewer for AI agents",
  "license": "Apache-2.0",
  "bin": {
    "onemem-dashboard": "./bin/onemem-dashboard"
  },
  "scripts": {
    "build": "next build",
    "start": "next start -p ${PORT:-4040}"
  },
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "@onemem/sdk-ts": "^0.1.0",
    "@onemem/brand": "workspace:*",
    "@mysten/sui": "^1.x",
    "@mysten/dapp-kit": "^0.x",
    "@mysten/seal": "^0.x",
    "@radix-ui/themes": "^3.x",
    "tailwindcss": "^3.x",
    "swr": "^2.x"
  }
}
```

---

## How `onemem dashboard` launches it

Per `05-cli/command-surface.md`:

```bash
onemem dashboard [--port 4040]
```

Current behavior:

- `@onemem/cli` registers `onemem dashboard`.
- The command spawns `onemem-dashboard` with `PORT=<port>` and
  `ONEMEM_MODE=local`.
- If the binary is not available, the CLI exits non-zero and tells the user to
  install `@onemem/dashboard`.
- Browser auto-open is not implemented in v0.1.

---

## Local mode specifics

When `ONEMEM_MODE=local`, the dashboard:

1. **Reads credentials from `~/.onemem/credentials.json`** (not from Enoki/zkLogin session)
2. **No login UI** — assumes user has run `onemem login` from the CLI
3. **Hosted-only routes are absent** — no `/login`, no `/cli-login`, no `/onboarding`, no `/verify/[session_id]`. Those are exclusive to `apps/hosted-dashboard/` per `purpose-local-vs-hosted.md`. (Hitting any of those paths on localhost returns the Next.js 404 page.)
4. **Connects directly to `relayer.memwal.ai`** (or whatever's in credentials' `serverUrl`)
5. **Listens for plugin heartbeats on `localhost:4040/api/runtimes/heartbeat`** — plugins running on the same machine post directly
6. **Bundles SSE server at `localhost:4040/api/stream`** — proxies Sui events for the local SDK client
7. **Default port 4040** to avoid conflict with claude-mem's 37777 + Mem0 OpenMemory's 3000 (per `BRAND_AND_SURFACES.md` spec)

---

## Why a separate npm package (not bundled in `@onemem/cli`)

- Dashboard has ~50 MB of dependencies (Next.js + React + Tailwind + Radix). CLI should stay light.
- Users who only want the CLI (no dashboard) don't pay the install cost.
- Dashboard updates ship on their own cadence vs CLI.
- `onemem dashboard` gives install guidance if the package binary is missing.

---

## Performance

| Metric | Budget |
|---|---|
| First page load (cold) | <2s |
| Subsequent navigation | <300ms |
| SSE event-to-UI | <500ms |
| Memory decrypt (per item) | <300ms |
| Memory footprint (Node process) | <200 MB |

---

## Distribution

- npm: `@onemem/dashboard` — global install via
  `npm install -g @onemem/dashboard`
- CLI wrapper: `onemem dashboard` from `@onemem/cli` delegates to
  `onemem-dashboard`

---

## Cross-references

- `purpose-local-vs-hosted.md` — authoritative split (READ FIRST when designing route surfaces)
- `ui-architecture.md` — shared Next.js app
- `hosted-deploy.md` — same codebase + shell, different deploy
- `route-verify-public.md` — the hosted-only public verify page that local DOES NOT serve
- `../00-overview/TOOLING_DECISIONS.md` — Next.js 15 standalone-output rationale
- `../05-cli/command-surface.md` — `onemem dashboard` command
- `../../02-inspirations/claude-mem/HOOKS_AND_VIEWER_REFERENCE.md` — claude-mem's localhost:37777 reference
- `../../02-inspirations/BRAND_AND_SURFACES.md` — port 4040 choice rationale
