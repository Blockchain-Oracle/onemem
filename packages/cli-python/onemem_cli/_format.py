"""Output helpers for the OneMem Python CLI.

Every command supports ``--json`` for scripting; the default is compact,
pipe-friendly text. No color deps. Mirrors the TS CLI's output module.
"""

from __future__ import annotations

import json
import sys
from typing import Any

_STATUS_LABELS = {0: "Active", 1: "Completed", 2: "Failed", 3: "Aborted"}


def status_label(status: int) -> str:
    return _STATUS_LABELS.get(status, f"Unknown({status})")


def short_hex(data: bytes | list[int] | str | None, length: int = 8) -> str:
    if not data:
        return ""
    if isinstance(data, str):
        # Already-hex (some RPC encodings return a 0x-string); pass through.
        body = data[2:] if data.startswith("0x") else data
        return "0x" + body[:length]
    raw = bytes(data) if isinstance(data, list) else data
    return "0x" + raw.hex()[:length]


def short_id(value: str, head: int = 10) -> str:
    return f"{value[:head]}…" if len(value) > head + 2 else value


def print_json(value: Any) -> None:
    sys.stdout.write(json.dumps(value, indent=2, default=str) + "\n")


def print_line(line: str = "") -> None:
    sys.stdout.write(line + "\n")


def print_table(rows: list[dict[str, str]], columns: list[str]) -> None:
    if not rows:
        print_line("(none)")
        return
    widths = [max(len(c), *(len(r.get(c, "")) for r in rows)) for c in columns]
    fmt = lambda cells: "  ".join(  # noqa: E731
        cell.ljust(widths[i]) for i, cell in enumerate(cells)
    ).rstrip()
    print_line(fmt(columns))
    print_line(fmt(["-" * w for w in widths]))
    for row in rows:
        print_line(fmt([row.get(c, "") for c in columns]))
