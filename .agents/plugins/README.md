# OneMem Codex Marketplace

This directory is the Codex marketplace root for the OneMem repo.

Codex users install it from GitHub with:

```bash
codex plugin marketplace add Blockchain-Oracle/onemem --json
codex plugin add onemem-codex@onemem --json
```

The `source: "local"` value inside `marketplace.json` is intentional: it tells
Codex to load `./packages/plugin-codex` from inside the marketplace snapshot it
just fetched. For a GitHub marketplace install, that path is not a user's local
checkout.

Public install only works after this directory and `packages/plugin-codex/` are
present on the branch Codex fetches, which is `main` unless the user passes
`--ref`.
