"""hermes-onemem — OneMem memory provider for Hermes.

Records each Hermes agent session as a verifiable on-chain OneMem TraceSession.
Install into a Hermes profile at ``$HERMES_HOME/plugins/onemem/`` and activate
with ``memory.provider: onemem`` in config.yaml.

Spec: docs/05-our-architecture/03-runtimes/hermes-plugin.md
"""

from __future__ import annotations

from .provider import OneMemProvider

__version__ = "0.2.0"

__all__ = ["OneMemProvider", "register"]


def register(ctx) -> None:
    """Hermes plugin entrypoint — register our MemoryProvider instance."""
    ctx.register_memory_provider(OneMemProvider())
