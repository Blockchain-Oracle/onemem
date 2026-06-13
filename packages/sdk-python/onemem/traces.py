"""Off-chain trace verification — mirrors packages/sdk-ts/src/traces.ts.

Reads a TraceSession + its emitted ActionCall events from Sui and replays the
Merkle chain, asserting the recomputed root matches the on-chain
``merkle_root``. Proves CHAIN INTEGRITY (nothing inserted/dropped/tampered) —
not that the agent honestly recorded its activity (that needs the delegate-key
holder's honesty or a future TEE relayer).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, cast

from ._rpc import SuiRpc
from .hashing import ZERO_HASH, chain_hash


@dataclass(frozen=True, slots=True)
class EmittedEvent:
    timestamp_ms: int
    call_id: str
    parent_call_id: str | None
    content_hash: bytes
    prev_hash: bytes


@dataclass(frozen=True, slots=True)
class VerifyResult:
    ok: bool
    #: Index of the first call whose prev_hash breaks the chain, else None.
    broken_at: int | None
    expected_merkle_root: bytes
    computed_merkle_root: bytes
    call_count: int
    session_status: int


def _to_bytes(byte_list: list[int]) -> bytes:
    return bytes(byte_list)


def _opt_id(value: object) -> str | None:
    """Read an optional ID that Sui may serialize as null, a bare string
    (events), or `{"vec": [...]}` (object fields)."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        vec = cast("list[str]", cast("dict[str, Any]", value).get("vec") or [])
        return vec[0] if vec else None
    return None


def fetch_trace_session(rpc: SuiRpc, session_id: str) -> dict[str, Any]:
    """Return the raw TraceSession Move fields."""
    return rpc.get_object_fields(session_id)


def fetch_emitted_events(rpc: SuiRpc, package_id: str, session_id: str) -> list[EmittedEvent]:
    """Return this session's ActionCallEmittedEvents, ascending by time."""
    event_type = f"{package_id}::events::ActionCallEmittedEvent"
    rows: list[EmittedEvent] = []
    for event in rpc.query_events_by_type(event_type):
        fields = cast("dict[str, Any]", event.get("parsedJson") or {})
        if fields.get("session_id") != session_id:
            continue
        rows.append(
            EmittedEvent(
                timestamp_ms=int(cast("str | int", event.get("timestampMs") or 0)),
                call_id=cast(str, fields["call_id"]),
                parent_call_id=_opt_id(fields.get("parent_call_id")),
                content_hash=_to_bytes(cast("list[int]", fields["content_hash"])),
                prev_hash=_to_bytes(cast("list[int]", fields["prev_hash"])),
            )
        )
    rows.sort(key=lambda r: r.timestamp_ms)
    return rows


def verify_session(rpc: SuiRpc, package_id: str, session_id: str) -> VerifyResult:
    """Replay the Merkle chain for a session and check it against on-chain root.

    Mirrors TS ``TracesAPI.verifySession`` exactly: two chains must hold —
    (1) each call's ``prev_hash`` equals the previous call's ``content_hash``
    (no insert/drop), and (2) the folded ``merkle_root`` matches on-chain
    (no content forgery).
    """
    fields = fetch_trace_session(rpc, session_id)
    expected_root = _to_bytes(cast("list[int]", fields["merkle_root"]))
    status = int(cast(int, fields["status"]))
    events = fetch_emitted_events(rpc, package_id, session_id)

    running = ZERO_HASH
    prev_content = ZERO_HASH
    broken_at: int | None = None
    for idx, event in enumerate(events):
        if broken_at is None and event.prev_hash != prev_content:
            broken_at = idx
        running = chain_hash(running, event.content_hash)
        prev_content = event.content_hash

    ok = broken_at is None and running == expected_root
    return VerifyResult(
        ok=ok,
        broken_at=broken_at,
        expected_merkle_root=expected_root,
        computed_merkle_root=running,
        call_count=len(events),
        session_status=status,
    )
