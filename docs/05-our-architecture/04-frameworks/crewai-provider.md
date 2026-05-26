# CrewAI Provider — `onemem-crewai`

The 1-line `memory_config={"provider": "onemem"}` integration. CrewAI is the ONE Mem0 integration that's actually 1-line — we match exactly.

---

## API surface

```python
from crewai import Crew
from onemem_crewai import OneMemConfig

crew = Crew(
    agents=[...],
    tasks=[...],
    memory=True,
    memory_config={
        "provider": "onemem",
        "config": {
            "key": "${ONEMEM_DELEGATE_KEY}",
            "account_id": "${ONEMEM_ACCOUNT_ID}",
            "namespace_id": "${ONEMEM_NAMESPACE_ID}",
            "server_url": "https://relayer.memwal.ai",
            "agent_id": "my-crew",
            "environment": "production",
            "auto_recall": True,
            "auto_capture": True,
            "auto_trace": True,
        },
    },
)

result = crew.kickoff()
```

Or even simpler if env vars are set:

```python
crew = Crew(
    agents=[...],
    tasks=[...],
    memory=True,
    memory_config={"provider": "onemem"},  # reads everything from env
)
```

---

## How CrewAI discovers the provider

CrewAI's memory system uses `provider` string to look up a registered provider class. We register via Python entry points:

```toml
# pyproject.toml
[project.entry-points."crewai.memory_providers"]
onemem = "onemem_crewai.provider:OneMemProvider"
```

CrewAI's `Crew.__init__` calls `entry_points(group="crewai.memory_providers").get("onemem")` to find our class.

---

## Provider implementation

```python
# onemem_crewai/provider.py
from typing import Any
from crewai.memory.contextual.contextual_memory import ContextualMemory
from onemem import OneMem, OneMemConfig
import asyncio
import os


class OneMemProvider:
    """OneMem implementation of CrewAI's memory provider interface."""

    def __init__(self, config: dict[str, Any]):
        self._config = self._resolve_env_vars(config)
        self._client: OneMem | None = None
        self._session_id: str | None = None
        self._loop: asyncio.AbstractEventLoop | None = None

    def _resolve_env_vars(self, config: dict) -> dict:
        # Substitute ${ENV_VAR} placeholders
        resolved = {}
        for k, v in config.items():
            if isinstance(v, str) and v.startswith("${") and v.endswith("}"):
                env_var = v[2:-1]
                resolved[k] = os.getenv(env_var)
                if resolved[k] is None:
                    raise ValueError(f"Missing env var: {env_var}")
            else:
                resolved[k] = v
        return resolved

    async def _ensure_client(self):
        if self._client is None:
            self._client = await OneMem.create(OneMemConfig(**self._config))
            session = await self._client.trace.start_session(
                agent_id=self._config.get("agent_id", "crewai-crew"),
                environment=self._config.get("environment", "production"),
            )
            self._session_id = session.session_id

    def _run_async(self, coro):
        """Run async OneMem calls from CrewAI's sync context."""
        if self._loop is None:
            try:
                self._loop = asyncio.get_event_loop()
            except RuntimeError:
                self._loop = asyncio.new_event_loop()
                asyncio.set_event_loop(self._loop)
        return self._loop.run_until_complete(coro)

    # CrewAI memory provider interface methods

    def save(self, content: str, metadata: dict | None = None) -> dict:
        """Save a memory."""
        async def _save():
            await self._ensure_client()
            result = await self._client.add(content, metadata=metadata or {})
            return {"memory_id": result.memory_id, "sui_tx_digest": result.sui_tx_digest}
        return self._run_async(_save())

    def search(self, query: str, limit: int = 5, score_threshold: float = 0.3) -> list[dict]:
        """Search memories."""
        async def _search():
            await self._ensure_client()
            result = await self._client.search(query, top_k=limit, threshold=score_threshold)
            return [
                {
                    "memory": m.text,
                    "metadata": m.metadata,
                    "score": 1.0,  # CrewAI expects a score; OneMem returns relevance internally
                    "verified": m.verified,
                }
                for m in result.results
            ]
        return self._run_async(_search())

    def reset(self):
        """End the current trace session."""
        if self._client and self._session_id:
            async def _reset():
                await self._client.trace.end_session(self._session_id, "COMPLETED")
                self._session_id = None
            self._run_async(_reset())

    # OneMem additions beyond CrewAI's base interface

    def trace_session_id(self) -> str | None:
        """Return the active OneMem trace session ID."""
        return self._session_id

    def verify(self) -> dict:
        """Verify the current trace session's Merkle chain."""
        if not self._session_id:
            return {"verified": False, "reason": "no active session"}
        async def _verify():
            return await self._client.trace.verify_session(self._session_id)
        result = self._run_async(_verify())
        return {"verified": result.verified, "details": result.details.dict() if result.details else None}
```

---

## Auto-trace per task

CrewAI runs `tasks` sequentially through `agents`. To capture each task as an `ActionCall`, we hook CrewAI's task-execution callback (if available in the version we target) and emit:

- `trace.appendCall(toolName="crewai.task.execute", toolNamespace="crewai", input={task, agent})` on task start
- `trace.closeCall(...)` on task complete

If CrewAI doesn't expose a callback (some versions don't), we fall back to memory-write-driven tracing: every `save()` is an `ActionCall`, and that's the coverage tier for crewai at v0.1.

---

## Install + distribution

```bash
pip install onemem-crewai
```

Distribution: PyPI + GitHub `onemem/onemem-crewai`.

---

## Cross-references

- `README.md`
- `trace-emit-contract.md`
- `../02-sdks/sdk-python.md`
- `../../../TRACE_AND_PROVIDERS.md` §1 — Mem0 CrewAI provider reference
