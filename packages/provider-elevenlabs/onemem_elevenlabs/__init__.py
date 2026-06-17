"""onemem-elevenlabs — record ElevenLabs Conversational AI voice sessions as
verifiable on-chain OneMem traces.

    from elevenlabs.conversational_ai.conversation import Conversation, ClientTools
    from onemem_elevenlabs import OneMemTracer

    tracer = OneMemTracer(agent_id="voice-bot")
    conv = Conversation(
        client, agent_id, requires_auth=True,
        client_tools=tracer.wrap_tools(ClientTools()),
        **tracer.callbacks(),                 # captures transcripts; flushes on end
    )

Spec: docs/05-our-architecture/04-frameworks/elevenlabs-voice-provider.md
"""

from __future__ import annotations

from .tracer import OneMemTracer

__version__ = "0.1.0"
__all__ = ["OneMemTracer"]
