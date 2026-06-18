"""onemem-crewai — record CrewAI crew runs as verifiable on-chain OneMem traces.

    from crewai import Crew
    from onemem_crewai import OneMemTracer

    tracer = OneMemTracer(agent_id="my-crew")
    crew = Crew(agents=[...], tasks=[...],
                step_callback=tracer.step, task_callback=tracer.task)
    crew.kickoff()
    tracer.flush()

Spec: docs/05-our-architecture/04-frameworks/crewai-provider.md
"""

from __future__ import annotations

from .memory import create_onemem_memory
from .tracer import OneMemTracer

__version__ = "0.1.1"
__all__ = ["OneMemTracer", "create_onemem_memory"]
