"""onemem-livekit — decentralized memory for LiveKit voice agents (on MemWal).

    from onemem_livekit import create_onemem_memory

    mem = create_onemem_memory(namespace="voice-bot")
    context = mem.recall_context(user_turn)   # search -> inject
    # ... run the agent with `context` ...
    mem.capture(exchange)                      # store the exchange

Spec: docs/05-our-architecture/04-frameworks/livekit-voice-provider.md
"""

from __future__ import annotations

from .memory import create_onemem_memory

__version__ = "0.1.1"
__all__ = ["create_onemem_memory"]
