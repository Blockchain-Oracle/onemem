# hermes-onemem

OneMem plugin for Hermes. Full-coverage tier — captures every agent action via Hermes hooks.

Cross-runtime trace composition: `on_delegation` sets `ONEMEM_PARENT_*` env vars for child runtimes (e.g., a Claude Code subprocess spawned by a Hermes agent), enabling traces to span runtimes via shared `namespace_id` + `parent_call_id`.

See `docs/05-our-architecture/03-runtimes/hermes-plugin.md`.
