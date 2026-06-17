"""OneMem tracer for LiveKit Agents (voice).

Records a LiveKit `AgentSession` as a verifiable on-chain OneMem TraceSession
(Sui + Walrus + Seal). LiveKit Agents is Python; OneMem's trace stack
(Walrus/Seal) is JS-only, so the on-chain write — and zero-config provisioning of
namespace/cap/signer — is delegated to the `onemem-trace` Node CLI.

    from livekit.agents import AgentSession
    from onemem_livekit import OneMemTracer

    session = AgentSession(...)
    OneMemTracer(agent_id="voice-bot").attach(session)   # auto-flushes on close

Targets LiveKit Agents 1.x events (conversation_item_added,
function_tools_executed, close). Defensive: a OneMem failure never breaks the
voice session.
"""

from __future__ import annotations

import contextlib
import json
import logging
import os
import shlex
import subprocess
import tempfile
import threading
from collections.abc import Iterable
from typing import Any, cast

logger = logging.getLogger(__name__)

_DEFAULT_TRACE_CMD = "npx -y -p @onemem/sdk-ts@latest onemem-trace"
_FLUSH_TIMEOUT_S = 600


def _attr(obj: Any, *names: str) -> Any:
    for n in names:
        if isinstance(obj, dict) and n in obj:
            return obj[n]
        if hasattr(obj, n):
            return getattr(obj, n)
    return None


def _safe(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool, list, dict)):
        return value
    try:
        return str(value)[:4000]
    except Exception:
        return "<unrepresentable>"


def _list_or_empty(value: Any) -> list[Any]:
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    return []


class OneMemTracer:
    """Buffers LiveKit AgentSession events and flushes them as one on-chain trace."""

    def __init__(
        self,
        agent_id: str = "livekit",
        environment: str = "livekit",
        network: str | None = None,
    ) -> None:
        self._agent_id = agent_id
        self._environment = environment
        self._network = network or os.environ.get("SUI_NETWORK", "testnet")
        self._calls: list[dict[str, Any]] = []

    # -- Wiring --------------------------------------------------------------

    def attach(self, session: Any) -> Any:
        """Register listeners on a LiveKit AgentSession; auto-flush on close.

        Returns the session for chaining.
        """
        session.on("conversation_item_added", self._on_item)
        session.on("function_tools_executed", self._on_tools)
        session.on("close", self._on_close)
        return session

    # -- Event handlers (defensive — shapes vary across LiveKit versions) ----

    # LiveKit dispatches events (often synchronously) on its session loop, so
    # each handler must never raise.
    def _on_item(self, ev: Any) -> None:
        try:
            item = _attr(ev, "item") or ev
            role = _attr(item, "role") or "message"
            self._calls.append(
                {
                    "toolName": f"message.{role}",
                    "toolNamespace": "livekit",
                    "input": None,
                    "output": _safe(_attr(item, "text_content", "content", "text")),
                }
            )
        except Exception:
            logger.exception("[onemem] conversation_item capture failed")

    def _on_tools(self, ev: Any) -> None:
        try:
            pairs: list[tuple[Any, Any]] | None = None
            with contextlib.suppress(Exception):
                zipped = _attr(ev, "zipped")
                if callable(zipped):
                    pairs = list(cast(Iterable[tuple[Any, Any]], zipped()))
            if pairs is None:
                calls = _list_or_empty(_attr(ev, "function_calls"))
                outputs = _list_or_empty(_attr(ev, "function_call_outputs"))
                if outputs and len(outputs) != len(calls):
                    logger.warning(
                        "[onemem] tool call/output count mismatch (%d/%d)", len(calls), len(outputs)
                    )
                pairs = (
                    list(zip(calls, outputs, strict=False))
                    if outputs
                    else [(c, None) for c in calls]
                )
            for call, output in pairs:
                self._calls.append(
                    {
                        "toolName": _safe(_attr(call, "name", "function_name")) or "function",
                        "toolNamespace": "livekit",
                        "input": _safe(_attr(call, "arguments", "args", "input")),
                        "output": _safe(_attr(output, "output", "result", "content")),
                    }
                )
        except Exception:
            logger.exception("[onemem] function_tools capture failed")

    def _on_close(self, _ev: Any) -> None:
        # flush() runs a blocking subprocess (Walrus is slow); never block the
        # session's event loop on teardown — do it off-thread.
        threading.Thread(target=self.flush, name="onemem-flush", daemon=True).start()

    # -- Flush ---------------------------------------------------------------

    def flush(self) -> str | None:
        """Write the buffered calls as one on-chain TraceSession (never raises)."""
        if not self._calls:
            return None
        payload = {
            "agentId": self._agent_id,
            "environment": self._environment,
            "label": "livekit",
            "network": self._network,
            "calls": self._calls,
        }
        path = None
        try:
            with tempfile.NamedTemporaryFile(
                "w", suffix=".json", delete=False, encoding="utf-8"
            ) as f:
                json.dump(payload, f)
                path = f.name
            cmd = [*shlex.split(os.environ.get("ONEMEM_TRACE_CMD", _DEFAULT_TRACE_CMD)), path]
            proc = subprocess.run(
                cmd, capture_output=True, text=True, timeout=_FLUSH_TIMEOUT_S, env=os.environ.copy()
            )
            if proc.returncode != 0:
                logger.error(
                    "[onemem] trace flush FAILED (exit %s); %d call(s) retained: %s",
                    proc.returncode,
                    len(self._calls),
                    proc.stderr.strip()[:500],
                )
                return None
            session = None
            with contextlib.suppress(ValueError, IndexError):
                parsed = json.loads(proc.stdout.strip().splitlines()[-1])
                if isinstance(parsed, dict) and parsed.get("skipped"):
                    self._calls.clear()
                    logger.info("[onemem] trace skipped by runtime controls")
                    return None
                session = parsed.get("sessionId") if isinstance(parsed, dict) else None
            if not session:
                logger.error(
                    "[onemem] flush exit 0 but no sessionId; %d call(s) retained: %s",
                    len(self._calls),
                    proc.stdout.strip()[:300],
                )
                return None
            self._calls.clear()
            logger.info("[onemem] verifiable trace %s (%d calls)", session, len(payload["calls"]))
            return session
        except subprocess.SubprocessError as e:
            logger.error(
                "[onemem] trace flush error (%s); %d call(s) retained", e, len(self._calls)
            )
            return None
        except Exception:
            logger.exception(
                "[onemem] unexpected trace flush error; %d call(s) retained", len(self._calls)
            )
            return None
        finally:
            if path:
                with contextlib.suppress(OSError):
                    os.unlink(path)
