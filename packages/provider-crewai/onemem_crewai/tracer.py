"""OneMem tracer for CrewAI.

Records a CrewAI crew run as a verifiable on-chain OneMem TraceSession (Sui +
Walrus + Seal). CrewAI is Python; OneMem's trace stack (Walrus/Seal) is JS-only,
so the on-chain write — and zero-config provisioning of namespace/cap/signer — is
delegated to the `onemem-trace` Node CLI (`@onemem/sdk-ts`).

Wire it to a Crew's callbacks and flush after kickoff:

    from crewai import Crew
    from onemem_crewai import OneMemTracer

    tracer = OneMemTracer(agent_id="my-crew")
    crew = Crew(agents=[...], tasks=[...],
                step_callback=tracer.step, task_callback=tracer.task)
    result = crew.kickoff()
    tracer.flush()   # writes one verifiable TraceSession

Defensive throughout: a OneMem failure never breaks the crew.
"""

from __future__ import annotations

import contextlib
import json
import logging
import os
import shlex
import subprocess
import tempfile
from typing import Any

logger = logging.getLogger(__name__)

_DEFAULT_TRACE_CMD = "npx -y -p @onemem/sdk-ts@latest onemem-trace"
_FLUSH_TIMEOUT_S = 600


def _attr(obj: Any, *names: str) -> Any:
    """First present attribute/key among names, else None (defensive reads)."""
    for n in names:
        if isinstance(obj, dict) and n in obj:
            return obj[n]
        if hasattr(obj, n):
            return getattr(obj, n)
    return None


class OneMemTracer:
    """Buffers CrewAI step/task events and flushes them as one on-chain trace."""

    def __init__(
        self,
        agent_id: str = "crewai",
        environment: str = "crewai",
        network: str | None = None,
    ) -> None:
        self._agent_id = agent_id
        self._environment = environment
        self._network = network or os.environ.get("SUI_NETWORK", "testnet")
        self._calls: list[dict[str, Any]] = []

    # -- CrewAI callbacks ----------------------------------------------------

    def step(self, step: Any) -> None:
        """Crew step_callback — buffer one agent step (tool use / action).

        Runs inside CrewAI's callback dispatch, so it must never raise.
        """
        try:
            tool = _attr(step, "tool", "tool_name")
            out = _attr(step, "result", "output", "text", "return_values")
            self._calls.append(
                {
                    "toolName": str(tool) if tool else "agent.step",
                    "toolNamespace": "crewai",
                    "input": _safe(_attr(step, "tool_input", "input", "thought")),
                    "output": _safe(out if out is not None else _repr(step)),
                }
            )
        except Exception:  # never break the crew
            logger.exception("[onemem] step capture failed")

    def task(self, output: Any) -> None:
        """Crew task_callback — buffer one completed task (TaskOutput)."""
        try:
            raw = _attr(output, "raw", "summary")
            self._calls.append(
                {
                    "toolName": "task",
                    "toolNamespace": "crewai",
                    "input": _safe(_attr(output, "name", "description")),
                    "output": _safe(raw if raw is not None else _repr(output)),
                }
            )
        except Exception:
            logger.exception("[onemem] task capture failed")

    # -- Flush ---------------------------------------------------------------

    def flush(self) -> str | None:
        """Write the buffered calls as one on-chain TraceSession. Returns the
        session id, or None if nothing was buffered / on a failure (never raises).
        """
        if not self._calls:
            return None
        payload = {
            "agentId": self._agent_id,
            "environment": self._environment,
            "label": "crewai",
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
                return None  # keep buffer so a later flush() can retry
            session = None
            with contextlib.suppress(ValueError, IndexError):
                parsed = json.loads(proc.stdout.strip().splitlines()[-1])
                if isinstance(parsed, dict) and parsed.get("skipped"):
                    self._calls.clear()
                    logger.info("[onemem] trace skipped by runtime controls")
                    return None
                session = parsed.get("sessionId") if isinstance(parsed, dict) else None
            if not session:
                # Exit 0 but no parseable sessionId: can't confirm the write —
                # RETAIN the buffer for retry rather than risk silent loss.
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


def _safe(value: Any) -> Any:
    """Coerce to something JSON-roundtrippable; never raise."""
    if value is None or isinstance(value, (str, int, float, bool, list, dict)):
        return value
    return _repr(value)


def _repr(value: Any) -> str:
    try:
        return str(value)[:4000]
    except Exception:
        return "<unrepresentable>"
