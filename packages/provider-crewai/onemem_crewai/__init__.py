"""onemem-crewai — decentralized memory for CrewAI crews (stored on MemWal).

    from onemem_crewai import create_onemem_memory

    mem = create_onemem_memory(namespace="my-crew")
    context = mem.recall_context(user_request)   # search -> inject
    # ... run the crew with `context` ...
    mem.capture(result)                          # store the outcome

Spec: docs/05-our-architecture/04-frameworks/crewai-provider.md
"""

from __future__ import annotations

from .memory import create_onemem_memory

__version__ = "0.1.1"
__all__ = ["create_onemem_memory"]
