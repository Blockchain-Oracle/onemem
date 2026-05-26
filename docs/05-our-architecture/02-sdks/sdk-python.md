# Python SDK — `onemem-sdk-python`

Implements the `shared-api-surface.md` contract in Python. Wraps `mysten-incubation-memwal-python` + `pysui`. Identical surface to `@onemem/sdk-ts`; idioms swapped for Python (snake_case, async/await, type hints).

---

## Package layout

```
onemem-sdk-python/
├── pyproject.toml
├── README.md
├── LICENSE
├── onemem/
│   ├── __init__.py                    # public exports
│   ├── client.py                      # OneMem class entry point
│   ├── auth.py                        # OneMem.login() / logout() / current_account()
│   ├── memory.py                      # add / search / get / update / delete / etc
│   ├── namespace.py                   # namespace.create / share / revoke / etc
│   ├── trace.py                       # trace.start_session / append_call / close_call / verify_session / replay_session
│   ├── relayer.py                     # httpx client wrapping MemWal relayer with /manual flow
│   ├── chain.py                       # pysui PTB builders
│   ├── seal.py                        # Seal /manual via memwal-python
│   ├── types.py                       # Pydantic models for Memory, Namespace, Trace, etc
│   ├── move_types.py                  # codegen'd from data-model.md (see below)
│   ├── compatibility.py               # SDK version self-check
│   ├── credentials.py                 # ~/.onemem/credentials.json reader/writer
│   ├── errors.py                      # OneMemAuthError, OneMemNetworkError, etc
│   └── utils/
│       ├── hash.py
│       └── retry.py                   # exponential backoff
├── tests/
│   ├── test_memory.py
│   ├── test_namespace.py
│   ├── test_trace.py
│   ├── test_verify.py
│   └── test_compatibility.py
└── examples/
    ├── basic_memory.py
    ├── share_namespace.py
    ├── trace_session.py
    └── verify_and_replay.py
```

---

## `pyproject.toml`

```toml
[project]
name = "onemem-sdk-python"
version = "0.1.0"
description = "Verifiable agent memory + trace SDK on Sui + Walrus + Seal + MemWal"
authors = [{name = "OneMem contributors"}]
license = {text = "Apache-2.0"}
readme = "README.md"
requires-python = ">=3.10"
dependencies = [
    "mysten-incubation-memwal-python>=0.x",
    "pysui>=0.74",
    "httpx>=0.25",
    "pydantic>=2.0",
    "anyio>=4.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0",
    "pytest-asyncio>=0.21",
    "pytest-httpx>=0.27",
    "mypy>=1.0",
    "ruff>=0.1",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["onemem"]
```

---

## Public entry point

```python
# onemem/__init__.py
from .client import OneMem
from .types import (
    OneMemConfig,
    Memory,
    Namespace,
    Capability,
    TraceSession,
    ActionCall,
    TraceEvent,
    VerificationDetails,
    ReplayedSession,
    Credentials,
    SearchOptions,
    AddOptions,
    MemoryClass,
    ContextTier,
    NamespaceKind,
    CapabilityKind,
    CallStatus,
    Level,
)
from .errors import (
    OneMemError,
    OneMemAuthError,
    OneMemNetworkError,
    OneMemChainError,
    OneMemSealError,
    OneMemValidationError,
    OneMemCompatibilityError,
    OneMemVerificationError,
)

__version__ = "0.1.0"
```

---

## Client construction (`onemem/client.py`)

```python
from dataclasses import dataclass
from typing import Optional
import httpx
from pysui import SyncClient as SuiSyncClient, AsyncClient as SuiAsyncClient
from mysten_incubation_memwal import MemWalManual
# Note: Mysten ships @mysten/seal as TS; Python Seal access goes through memwal-python

from .types import OneMemConfig
from . import memory, namespace, trace
from .compatibility import assert_compatibility


class _NamespaceAPI:
    def __init__(self, client: "OneMem"):
        self._client = client

    async def create(self, name: str, kind: str, **opts): return await namespace.create(self._client, name, kind, **opts)
    async def list(self, **opts): return await namespace.list_(self._client, **opts)
    async def get(self, namespace_id: str): return await namespace.get(self._client, namespace_id)
    async def share(self, namespace_id: str, recipient_address: str, cap_kind: str): return await namespace.share(self._client, namespace_id, recipient_address, cap_kind)
    async def revoke(self, namespace_id: str, capability_id: str): return await namespace.revoke(self._client, namespace_id, capability_id)
    async def deactivate(self, namespace_id: str): return await namespace.deactivate(self._client, namespace_id)
    async def reactivate(self, namespace_id: str): return await namespace.reactivate(self._client, namespace_id)
    async def get_capabilities(self, namespace_id: str): return await namespace.get_capabilities(self._client, namespace_id)


class _TraceAPI:
    def __init__(self, client: "OneMem"):
        self._client = client

    async def start_session(self, **opts): return await trace.start_session(self._client, **opts)
    async def end_session(self, session_id: str, status: str = "COMPLETED"): return await trace.end_session(self._client, session_id, status)
    async def append_call(self, session_id: str, call_data: dict): return await trace.append_call(self._client, session_id, call_data)
    async def close_call(self, session_id: str, call_id: str, output_data: dict, status: str, level: Optional[str] = None): return await trace.close_call(self._client, session_id, call_id, output_data, status, level)
    async def get_session(self, session_id: str): return await trace.get_session(self._client, session_id)
    async def list_sessions(self, **opts): return await trace.list_sessions(self._client, **opts)
    async def get_calls(self, session_id: str): return await trace.get_calls(self._client, session_id)
    async def verify_session(self, session_id: str): return await trace.verify_session(self._client, session_id)
    async def replay_session(self, session_id: str, **opts): return await trace.replay_session(self._client, session_id, **opts)

    def subscribe(self, session_id: str, on_event): return trace.subscribe(self._client, session_id, on_event)


class OneMem:
    """The OneMem SDK client. Construct via OneMem.create(config)."""

    def __init__(self, config: OneMemConfig, memwal: MemWalManual, sui_client: SuiAsyncClient):
        self.config = config
        self.memwal = memwal
        self.sui_client = sui_client

        # Namespaced sub-APIs
        self.namespace = _NamespaceAPI(self)
        self.trace = _TraceAPI(self)

    @classmethod
    async def create(cls, config: OneMemConfig) -> "OneMem":
        await assert_compatibility(config.server_url)
        memwal = MemWalManual.create(
            key=config.key,
            account_id=config.account_id,
            server_url=config.server_url,
            namespace=config.namespace_id,
        )
        sui_client = SuiAsyncClient(network=config.network)
        return cls(config, memwal, sui_client)

    # Memory API directly on client (Mem0 ergonomic)
    async def add(self, text: str, **opts): return await memory.add(self, text, **opts)
    async def search(self, query: str, **opts): return await memory.search(self, query, **opts)
    async def get(self, memory_id: str): return await memory.get(self, memory_id)
    async def update(self, memory_id: str, text: str): return await memory.update(self, memory_id, text)
    async def delete(self, memory_id: str): return await memory.delete(self, memory_id)
    async def get_all(self, **opts): return await memory.get_all(self, **opts)
    async def history(self, memory_id: str): return await memory.history(self, memory_id)
    async def batch_update(self, items): return await memory.batch_update(self, items)
    async def batch_delete(self, memory_ids): return await memory.batch_delete(self, memory_ids)
    async def feedback(self, memory_id: str, feedback: str, reason: Optional[str] = None): return await memory.feedback(self, memory_id, feedback, reason)
    async def export(self, **opts): return await memory.export_fn(self, **opts)

    async def health(self) -> dict:
        # GET relayer /health + sui_client.get_latest_sui_system_state
        ...

    @staticmethod
    async def login(**opts): return await __import__("onemem.auth", fromlist=["login"]).login(**opts)

    @staticmethod
    def logout(): return __import__("onemem.auth", fromlist=["logout"]).logout()

    @staticmethod
    def current_account(): return __import__("onemem.auth", fromlist=["current_account"]).current_account()
```

---

## Pydantic types (`onemem/types.py`)

```python
from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pydantic import BaseModel, Field

class MemoryClass(str, Enum):
    SEMANTIC = "semantic"
    EPISODIC = "episodic"
    PROCEDURAL = "procedural"

class ContextTier(str, Enum):
    L0 = "L0"
    L1 = "L1"
    L2 = "L2"

class NamespaceKind(str, Enum):
    USER = "USER"
    AGENT = "AGENT"
    ORG = "ORG"
    SESSION = "SESSION"
    SHARED = "SHARED"

class CapabilityKind(str, Enum):
    READ_ONLY = "ReadOnly"
    READ_WRITE = "ReadWrite"
    ADMIN = "Admin"

class CallStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILURE = "FAILURE"
    TIMEOUT = "TIMEOUT"
    CANCELLED = "CANCELLED"

class Level(str, Enum):
    DEBUG = "DEBUG"
    DEFAULT = "DEFAULT"
    WARNING = "WARNING"
    ERROR = "ERROR"


class Memory(BaseModel):
    id: str
    text: str
    walrus_blob_id: str
    sui_tx_digest: str
    namespace_id: str
    agent_id: str
    user_id: Optional[str] = None
    run_id: Optional[str] = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    memory_class: MemoryClass
    context_tier: ContextTier
    created_at: int
    updated_at: int
    version: int
    verified: bool


class Namespace(BaseModel):
    id: str
    owner: str
    name: str
    kind: NamespaceKind
    active: bool
    merkle_root: str
    walrus_blob_count: int
    created_at: int
    seal_package_id: str


class Capability(BaseModel):
    id: str
    namespace_id: str
    kind: CapabilityKind
    owner: str
    granted_at: int
    granted_by: str


class TraceEvent(BaseModel):
    timestamp: int
    kind: str
    message: str
    payload_hash: Optional[str] = None
    payload_blob: Optional[str] = None


class ActionCall(BaseModel):
    id: str
    session_id: str
    parent_call_id: Optional[str] = None
    tool_name: str
    tool_namespace: str
    walrus_input_blob: str
    walrus_output_blob: Optional[str] = None
    input_hash: str
    output_hash: Optional[str] = None
    content_hash: str
    prev_hash: str
    started_at: int
    ended_at: Optional[int] = None
    level: Level
    status: CallStatus
    events: list[TraceEvent] = Field(default_factory=list)
    captured_by_address: str
    label: Optional[str] = None


class TraceSession(BaseModel):
    id: str
    namespace_id: str
    agent_id: str
    environment: str
    sdk_version: str
    started_at: int
    ended_at: Optional[int] = None
    root_call_id: Optional[str] = None
    last_call_id: Optional[str] = None
    call_count: int
    merkle_root: str
    status: str  # "ACTIVE" | "COMPLETED" | "FAILED" | "ABORTED"


class VerificationDetails(BaseModel):
    chain_length: int
    last_verified_call_id: Optional[str] = None
    expected_root: str
    actual_root: str


class OneMemConfig(BaseModel):
    key: str
    account_id: str
    server_url: str
    namespace_id: str
    agent_id: str
    environment: str = "production"
    network: str = "mainnet"


class Credentials(BaseModel):
    delegate_key: str
    delegate_public_key: str
    account_id: str
    sui_address: str
    created_at: int
    expires_at: int
    sdk_version: str
```

---

## Memory + Trace implementations

Same logic as TS sibling (`sdk-typescript.md` §"Memory API implementation" / §"Trace API implementation"). The PTB builders use `pysui` instead of `@mysten/sui`. The relayer HTTP calls use `httpx` (async) instead of fetch.

---

## Notable Python-specific decisions

- **Async-first.** All public methods are async. Sync wrappers can ship in v0.2 if there's demand.
- **`anyio` for portability.** Works with asyncio + trio + Curio.
- **Pydantic for types.** Same role as TS `interface` + Zod combined. Runtime validation + type hints.
- **`pysui` for Sui chain ops.** Per `02-inspirations/other-memory-systems/...` + Sui ecosystem standard.
- **No Pydantic v1 fallback.** v0.1 requires Pydantic 2.0+.

---

## Cross-references

- `shared-api-surface.md` — the contract this implements
- `sdk-typescript.md` — TS sibling (identical surface)
- `relayer-integration.md` — relayer HTTP details
- `compatibility-contract.md` — version self-check
- `../01-protocol/data-model.md` — Move structs these types mirror
- `../../02-inspirations/memwal-incubation/README.md` — `mysten-incubation-memwal-python` to wrap
