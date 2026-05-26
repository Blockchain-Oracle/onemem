# Hermes Plugin — `hermes-onemem`

OneMem's Hermes Agent (NousResearch, 164k ⭐) plugin. Standalone PyPI package implementing the `MemoryProvider` ABC. The Hermes maintainers explicitly require standalone repos for memory providers ("no in-tree providers accepted going forward").

Source-of-truth references:
- `../../../DEEP_DIVE.md` §3 — Hermes Agent plugin model + `MemoryProvider` ABC
- `../../../TRACE_AND_PROVIDERS.md` §2 — Hermes Mem0 reference impl + paste-ready Anchorlog/OneMem shape
- `../../03-target-runtimes/README.md` — Hermes integration matrix entry

---

## Package layout

```
hermes-onemem/
├── pyproject.toml
├── README.md
├── LICENSE
├── hermes_onemem/
│   ├── __init__.py
│   ├── provider.py                    # OneMemMemoryProvider(MemoryProvider)
│   ├── cli.py                         # hermes onemem login/search/trace/verify/replay subcommands
│   ├── config.py                      # config schema
│   └── util/
│       ├── session.py                 # session lifecycle helpers
│       └── parent_call.py             # cross-runtime parent_call_id tracking
├── manifest.toml                      # Hermes plugin manifest
├── tests/
│   ├── test_provider.py
│   ├── test_cli.py
│   └── test_session_lifecycle.py
└── examples/
    ├── basic_session.py
    └── multi_agent_delegation.py
```

---

## `pyproject.toml`

```toml
[project]
name = "hermes-onemem"
version = "0.1.0"
description = "OneMem memory provider for Hermes Agent — verifiable memory + action trace on Walrus + Sui"
authors = [{name = "OneMem contributors"}]
license = {text = "Apache-2.0"}
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
    "onemem-sdk-python>=0.1.0",
    "hermes-agent>=0.14",
]

[project.entry-points."hermes.memory_providers"]
onemem = "hermes_onemem.provider:OneMemMemoryProvider"

[project.entry-points."hermes.cli"]
onemem = "hermes_onemem.cli:cli"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"
```

The `[project.entry-points."hermes.memory_providers"]` entry registers the provider so Hermes's `discover_memory_providers()` finds it via stdlib `importlib.metadata.entry_points` (no in-tree install needed).

---

## `manifest.toml` (Hermes plugin manifest)

```toml
[plugin]
name = "onemem"
version = "0.1.0"
description = "Verifiable memory + action trace on Walrus + Sui"
license = "Apache-2.0"
homepage = "https://onemem.ai"
repository = "https://github.com/onemem/hermes-onemem"

[provider]
kind = "memory"
class = "hermes_onemem.provider:OneMemMemoryProvider"

[config]
required = ["delegate_key_env", "account_id", "namespace_id"]
optional = ["server_url", "agent_id", "environment", "auto_recall", "auto_capture", "auto_trace", "min_relevance"]
```

---

## `OneMemMemoryProvider` implementation

Implements the `MemoryProvider` ABC (per `DEEP_DIVE.md` §3).

```python
# hermes_onemem/provider.py
from typing import Optional
from hermes.memory import MemoryProvider, MemoryContext
from onemem import OneMem, OneMemConfig
from .util.session import SessionManager
from .util.parent_call import ParentCallTracker


class OneMemMemoryProvider(MemoryProvider):
    name = "onemem"

    def __init__(self):
        self._client: Optional[OneMem] = None
        self._session_manager: Optional[SessionManager] = None
        self._parent_tracker: Optional[ParentCallTracker] = None
        self._config: Optional[dict] = None

    def is_available(self) -> bool:
        # No network calls; just config check
        import os
        return bool(os.getenv("ONEMEM_DELEGATE_KEY") and os.getenv("ONEMEM_ACCOUNT_ID"))

    async def initialize(self, session_id: str, **kwargs):
        import os
        self._config = {
            "key": os.getenv("ONEMEM_DELEGATE_KEY"),
            "account_id": os.getenv("ONEMEM_ACCOUNT_ID"),
            "server_url": os.getenv("ONEMEM_SERVER_URL", "https://relayer.memwal.ai"),
            "namespace_id": kwargs.get("namespace_id") or os.getenv("ONEMEM_NAMESPACE_ID"),
            "agent_id": kwargs.get("agent_id") or f"hermes-{kwargs.get('hermes_version', 'unknown')}",
            "environment": os.getenv("ONEMEM_ENV", "production"),
            "network": "mainnet",
        }
        self._client = await OneMem.create(OneMemConfig(**self._config))
        self._session_manager = SessionManager(self._client)
        self._parent_tracker = ParentCallTracker()

        # Start a trace session for this Hermes session
        trace_session = await self._client.trace.start_session(
            agent_id=self._config["agent_id"],
            environment=self._config["environment"],
        )
        self._session_manager.bind(session_id, trace_session.session_id)

    def get_tool_schemas(self) -> list[dict]:
        # OpenAI function-call format for the OneMem tools we expose to the agent
        return [
            {
                "type": "function",
                "function": {
                    "name": "onemem_search",
                    "description": "Search OneMem for relevant past memories",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string"},
                            "top_k": {"type": "integer", "default": 5},
                            "threshold": {"type": "number", "default": 0.3},
                        },
                        "required": ["query"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "onemem_remember",
                    "description": "Save a memory to OneMem (encrypted on Walrus + attested on Sui)",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string"},
                            "memory_class": {"type": "string", "enum": ["semantic", "episodic", "procedural"]},
                            "metadata": {"type": "object"},
                        },
                        "required": ["text"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "onemem_verify",
                    "description": "Verify the current trace session's Merkle chain integrity",
                    "parameters": {"type": "object", "properties": {}, "required": []},
                },
            },
        ]

    def system_prompt_block(self) -> Optional[str]:
        # Inject info about OneMem being active
        if not self._session_manager:
            return None
        trace_session_id = self._session_manager.current_trace_session_id()
        return (
            f"OneMem is active. Your actions are being recorded as Merkle-chained ActionCalls "
            f"on Sui (trace session: {trace_session_id}). You can call `onemem_search` to recall "
            f"prior memories, `onemem_remember` to save a memory, or `onemem_verify` to check "
            f"the integrity of this session."
        )

    async def prefetch(self, query: str, *, session_id: str) -> list[dict]:
        # Pre-turn recall: search OneMem + return relevant memories
        if not self._client:
            return []
        results = await self._client.search(
            query,
            top_k=5,
            threshold=self._config.get("min_relevance", 0.3),
        )
        return [{"text": m.text, "metadata": m.metadata} for m in results.results]

    async def queue_prefetch(self, query: str, *, session_id: str):
        # Background pre-warm: same as prefetch but fire-and-forget
        # (relayer caches the search; next prefetch hits warm cache)
        import asyncio
        asyncio.create_task(self.prefetch(query, session_id=session_id))

    async def sync_turn(self, user_content: str, assistant_content: str, *, session_id: str):
        # Post-turn write: extract durable facts + save to OneMem
        if not self._client:
            return
        # Naive: save the full turn as an episodic memory
        # (Could call Anthropic Haiku here for fact extraction — TBD for v0.1)
        text = f"User: {user_content}\n\nAssistant: {assistant_content}"
        await self._client.add(
            text,
            memory_class="episodic",
            context_tier="L0",
            metadata={"session_id": session_id, "source": "hermes_turn"},
        )

    async def handle_tool_call(self, tool_name: str, args: dict, **kwargs):
        # If the agent calls one of our exposed tools, handle it
        if tool_name == "onemem_search":
            results = await self._client.search(args["query"], top_k=args.get("top_k", 5), threshold=args.get("threshold", 0.3))
            return {"memories": [{"text": m.text, "metadata": m.metadata} for m in results.results]}
        elif tool_name == "onemem_remember":
            result = await self._client.add(
                args["text"],
                memory_class=args.get("memory_class", "semantic"),
                metadata=args.get("metadata", {}),
            )
            return {"memory_id": result.memory_id, "sui_tx_digest": result.sui_tx_digest}
        elif tool_name == "onemem_verify":
            trace_session_id = self._session_manager.current_trace_session_id()
            result = await self._client.trace.verify_session(trace_session_id)
            return {"verified": result.verified, "details": result.details.dict() if result.details else None}
        return None  # not our tool

    async def on_session_end(self, *, session_id: str):
        if not self._client or not self._session_manager:
            return
        trace_session_id = self._session_manager.current_trace_session_id()
        await self._client.trace.end_session(trace_session_id, status="COMPLETED")
        self._session_manager.unbind(session_id)

    async def on_delegation(self, task: str, result: dict, child_session_id: str):
        # KILLER FEATURE: cross-runtime trace composition
        # When Hermes delegates to a sub-agent, we set the parent_call_id so
        # the child's calls render under the parent in the dashboard trace tree.
        if not self._client or not self._session_manager:
            return
        parent_call_id = self._parent_tracker.current_parent_call_id()
        # Append a "delegation" ActionCall to the parent session
        trace_session_id = self._session_manager.current_trace_session_id()
        await self._client.trace.append_call(
            trace_session_id,
            {
                "tool_name": "delegate_to_subagent",
                "tool_namespace": "hermes-runtime",
                "input": {"task": task, "child_session_id": child_session_id},
                "parent_call_id": parent_call_id,
                "label": f"Delegate: {task[:40]}",
            },
        )
        # The child session, if also OneMem-instrumented, will inherit the namespace
        # via env var ONEMEM_NAMESPACE_ID. Set the parent_session env so the child
        # can wire its trace_session under ours.
        import os
        os.environ["ONEMEM_PARENT_TRACE_SESSION_ID"] = trace_session_id

    async def on_memory_write(self, memory_text: str, *, session_id: str):
        # Hermes-internal memory write — sync to OneMem
        if not self._client:
            return
        await self._client.add(memory_text, memory_class="semantic", context_tier="L1", metadata={"source": "hermes_internal"})

    async def shutdown(self):
        # Clean up open sessions
        if self._client and self._session_manager:
            for sid in list(self._session_manager.all_trace_session_ids()):
                try:
                    await self._client.trace.end_session(sid, status="ABORTED")
                except Exception:
                    pass

    def get_config_schema(self) -> dict:
        return {
            "type": "object",
            "properties": {
                "delegate_key_env": {"type": "string", "default": "ONEMEM_DELEGATE_KEY"},
                "account_id_env": {"type": "string", "default": "ONEMEM_ACCOUNT_ID"},
                "namespace_id_env": {"type": "string", "default": "ONEMEM_NAMESPACE_ID"},
                "server_url": {"type": "string", "default": "https://relayer.memwal.ai"},
                "agent_id": {"type": "string"},
                "environment": {"type": "string", "default": "production"},
                "auto_recall": {"type": "boolean", "default": True},
                "auto_capture": {"type": "boolean", "default": True},
                "auto_trace": {"type": "boolean", "default": True},
                "min_relevance": {"type": "number", "default": 0.3},
            },
            "required": ["delegate_key_env", "account_id_env", "namespace_id_env"],
        }

    async def save_config(self, config: dict):
        # Hermes setup wizard calls this when user configures the provider
        # We just validate + acknowledge; actual config lives in env vars
        pass
```

---

## CLI subcommands (`hermes onemem ...`)

```python
# hermes_onemem/cli.py
import click
from onemem import OneMem

@click.group()
def cli():
    """OneMem subcommands for Hermes Agent."""
    pass

@cli.command()
def login():
    """Browser-based wallet login → ~/.onemem/credentials.json"""
    import asyncio
    asyncio.run(OneMem.login())
    click.echo("Logged in. Set ONEMEM_DELEGATE_KEY + ONEMEM_ACCOUNT_ID in Hermes config.")

@cli.command()
@click.argument("query")
@click.option("--top-k", default=5)
def search(query: str, top_k: int):
    """Search OneMem from CLI."""
    import asyncio
    async def _run():
        client = await OneMem.create(OneMemConfig.from_env())
        results = await client.search(query, top_k=top_k)
        for m in results.results:
            click.echo(f"[{m.memory_class}] {m.text}")
    asyncio.run(_run())

@cli.command()
@click.argument("session_id")
def trace(session_id: str):
    """Render a trace tree for the given session ID."""
    # ... fetches via SDK + renders ASCII tree
    pass

@cli.command()
@click.argument("session_id")
def verify(session_id: str):
    """Verify Merkle chain integrity for a session."""
    pass

@cli.command()
@click.argument("session_id")
def replay(session_id: str):
    """Reconstruct + print a session's calls from chain + Walrus."""
    pass
```

---

## Install + distribution

```bash
# User installs from PyPI (no in-tree Hermes patch needed)
pip install hermes-onemem

# Login
hermes onemem login

# Set in Hermes config (or env vars)
export ONEMEM_DELEGATE_KEY="<from credentials>"
export ONEMEM_ACCOUNT_ID="0x..."
export ONEMEM_NAMESPACE_ID="0x..."

# Activate in Hermes:
hermes config set memory.provider onemem

# Use Hermes normally; OneMem captures everything
hermes chat
```

Distribution:
- PyPI: `pip install hermes-onemem`
- GitHub: `onemem/hermes-onemem`
- Optionally: submit to Nous's plugin registry (post-shortlist)

---

## The cross-runtime composition demo flow (the headline)

This is the killer demo:

```
1. User: Claude Code session on Laptop A, OneMem plugin active.
   → Trace session A1 created in namespace NS1.
   → User asks Claude Code to "delegate the data analysis to a Hermes sub-agent."

2. Claude Code spawns Hermes Agent (subprocess) with env:
   ONEMEM_NAMESPACE_ID=NS1
   ONEMEM_PARENT_TRACE_SESSION_ID=A1
   
3. Hermes initializes hermes-onemem provider.
   → Creates trace session H1 in namespace NS1.
   → Parent tracker reads ONEMEM_PARENT_TRACE_SESSION_ID; sets all H1 calls'
     parent_call_id to the delegation marker call in A1.
   → on_delegation fires; emits "delegate_to_subagent" ActionCall in A1
     pointing at H1's session.

4. Hermes runs the task, emitting H1's calls.

5. User opens dashboard → /trace/A1
   → Tree shows: Claude Code calls → "delegate_to_subagent" → expand → Hermes H1 calls
   → One unified trace tree. Cryptographically verifiable end-to-end.
```

No other product does this. The dashboard demonstrates it visually; the on-chain `parent_call_id` references make it provable.

---

## Known gotchas

- **Hermes session ID vs OneMem trace session ID**: Hermes assigns its own session_id; OneMem trace_session_id is separate. SessionManager maps the two.
- **Tool schema collision**: `onemem_search` / `onemem_remember` / `onemem_verify` must not collide with other Hermes plugin tools. Namespace defensively if needed.
- **`on_delegation` hook semantics**: Hermes calls it AFTER the sub-agent returns. To set parent_call_id BEFORE the child runs, we emit the delegation marker eagerly and use env vars for propagation.
- **PyPI distribution + Hermes plugin discovery**: `entry_points` registration is the modern way; verify it works against the installed Hermes version.

---

## Cross-references

- `README.md` (this folder) — runtime matrix
- `../02-sdks/sdk-python.md` — Python SDK we wrap
- `../01-protocol/data-model.md` — `ActionCall` / `TraceSession` types
- `../../../DEEP_DIVE.md` §3 — Hermes ABC source-of-truth
- `../../../TRACE_AND_PROVIDERS.md` §2 — Mem0 reference impl to mirror
