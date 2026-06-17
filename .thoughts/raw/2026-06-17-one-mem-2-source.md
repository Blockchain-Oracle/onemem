# Raw Source: One Mem 2 Prototype

## Source

- Path: `/Users/abu/Downloads/One Mem 2`
- Captured: 2026-06-17
- Type: static high-fidelity HTML/CSS/JS prototype and design-system export.

## Files Inspected

- `index.html` — surface hub.
- `Landing.html` — marketing landing page.
- `Docs.html` — docs quickstart surface.
- `Overview.html` — dashboard overview.
- `Memories.html` — memories table, filters, bulk actions, drawer.
- `Apps.html` — connected runtimes, install modal, pause/uninstall/permissions.
- `Sessions.html` — unified cross-runtime session view and Verify ALL flow.
- `Trace.html` — trace timeline, tree/detail panel, verify drawer, replay.
- `Share.html` — capability owner/recipient sharing flow.
- `Settings.html` — account, delegate keys, runtimes, providers, advanced, danger zone.
- `Login.html` — hosted sign-in.
- `CliLogin.html` — CLI pairing flow.
- `Onboarding.html` — first-run setup flow.
- `Verify.html` — public trace verifier.
- `onemem.css`, `trace.css`, `dash.css`, `landing.css` — prototype styles.
- `onemem.js`, `shell.js` — shared icons, theme, copy, reveal, shell behavior.
- `_ds/cdr-kit-design-system-*/` — design-system bundle used by the prototype.

## Notes

This folder is treated as immutable design evidence. Implementation should
translate its screens and states into the existing Next.js monorepo surfaces
instead of copying static HTML directly.
