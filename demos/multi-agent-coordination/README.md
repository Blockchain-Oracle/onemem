# Demo: Multi-Agent Coordination

A Hermes agent delegates a subtask to a Claude Code subprocess. Cross-runtime trace composition: both runtimes write to the same OneMem namespace under a shared `parent_call_id`, producing one stitched-together trace visible in the dashboard.

Reproduce steps land in Pillar 8 per `docs/05-our-architecture/08-demos-and-tests/multi-agent-coordination.md`.
