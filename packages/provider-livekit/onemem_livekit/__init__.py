"""onemem-livekit — record LiveKit voice-agent sessions as verifiable on-chain
OneMem traces.

    from livekit.agents import AgentSession
    from onemem_livekit import OneMemTracer

    session = AgentSession(...)
    OneMemTracer(agent_id="voice-bot").attach(session)  # auto-flushes on close

Spec: docs/05-our-architecture/04-frameworks/livekit-voice-provider.md
"""

from __future__ import annotations

from .memory import create_onemem_memory
from .tracer import OneMemTracer

__version__ = "0.1.1"
__all__ = ["OneMemTracer", "create_onemem_memory"]
