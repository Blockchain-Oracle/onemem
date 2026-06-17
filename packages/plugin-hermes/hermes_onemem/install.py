"""`hermes-onemem install` — one-shot setup.

Hermes discovers memory providers by directory (``$HERMES_HOME/plugins/<name>/``),
not from site-packages, so a plain ``pip install`` can't activate the provider on
its own. This console script does the two remaining steps: copy the provider into
the Hermes profile and flip ``memory.provider: onemem`` in config.yaml.

Usage:
    pip install hermes-onemem
    hermes-onemem install            # copy + activate (honors $HERMES_HOME)
    hermes-onemem install --no-config  # copy only, leave config.yaml untouched
"""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

_PROVIDER_NAME = "onemem"


def _hermes_home() -> Path:
    if os.environ.get("HERMES_HOME"):
        return Path(os.environ["HERMES_HOME"]).expanduser()
    try:
        from hermes_constants import get_hermes_home

        return Path(get_hermes_home())
    except Exception:
        return Path.home() / ".hermes"


def _activate_in_config() -> str:
    """Set memory.provider=onemem via Hermes's own config writer. Returns a status note."""
    try:
        from hermes_cli.config import load_config, save_config
    except Exception:
        return (
            "could not import Hermes config tools — add this to ~/.hermes/config.yaml:\n"
            "  memory:\n    provider: onemem"
        )
    try:
        cfg = load_config()
        mem = cfg.setdefault("memory", {})
        if mem.get("provider") == _PROVIDER_NAME:
            return "memory.provider already = onemem"
        prior = mem.get("provider")
        mem["provider"] = _PROVIDER_NAME
        save_config(cfg)
        return f"set memory.provider = onemem (was {prior!r})"
    except Exception as e:  # never leave a half-written config silently
        return f"FAILED to set memory.provider ({e}); set it by hand: memory.provider: onemem"


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    # accept an optional leading "install" verb for natural phrasing
    args = [a for a in argv if a != "install"]
    no_config = "--no-config" in args

    src = Path(__file__).resolve().parent
    dest = _hermes_home() / "plugins" / _PROVIDER_NAME
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(
        src, dest, dirs_exist_ok=True, ignore=shutil.ignore_patterns("__pycache__", "*.pyc")
    )
    print(f"[hermes-onemem] installed provider -> {dest}")

    if no_config:
        print("[hermes-onemem] skipped config (--no-config); set memory.provider: onemem yourself")
    else:
        print(f"[hermes-onemem] {_activate_in_config()}")

    print("[hermes-onemem] prerequisite: Node 20+ with npx on PATH (the on-chain bridge).")
    print(
        "[hermes-onemem] restart Hermes — first session auto-provisions everything under ~/.onemem/."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
