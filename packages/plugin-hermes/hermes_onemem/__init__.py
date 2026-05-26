"""hermes-onemem — OneMem plugin for Hermes (skeleton; implemented in Pillar 3).

Spec: docs/05-our-architecture/03-runtimes/hermes-plugin.md
Cross-runtime trace composition: env vars ONEMEM_NAMESPACE_ID, ONEMEM_PARENT_TRACE_SESSION_ID,
ONEMEM_PARENT_CALL_ID are propagated to child runtimes spawned by Hermes via `on_delegation`.
"""

__version__ = "0.1.0"
