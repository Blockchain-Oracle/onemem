#!/usr/bin/env python3
"""Report local OneMem package versions against public npm and PyPI registries."""

from __future__ import annotations

import argparse
import json
import time
import tomllib
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Literal
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
NPM_REGISTRY = "https://registry.npmjs.org"
PYPI_REGISTRY = "https://pypi.org/pypi"
STATUS_CURRENT = "current"
STATUS_MISSING = "missing"
STATUS_DRIFT = "version-drift"
STATUS_ERROR = "error"
REQUEST_ATTEMPTS = 3

Ecosystem = Literal["npm", "pypi"]


@dataclass(frozen=True)
class LocalPackage:
    ecosystem: Ecosystem
    directory: str
    name: str
    local_version: str


@dataclass(frozen=True)
class RegistryStatus:
    ecosystem: Ecosystem
    directory: str
    name: str
    local_version: str
    registry_version: str | None
    status: str
    registry_url: str
    error: str | None = None


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def load_toml(path: Path) -> dict[str, Any]:
    return tomllib.loads(path.read_text())


def load_npm_packages() -> list[LocalPackage]:
    packages = []
    for path in sorted((ROOT / "packages").glob("*/package.json")):
        manifest = load_json(path)
        if manifest.get("private") is True:
            continue
        name = manifest.get("name")
        version = manifest.get("version")
        if isinstance(name, str) and isinstance(version, str) and name.startswith("@onemem/"):
            packages.append(LocalPackage("npm", str(path.parent.relative_to(ROOT)), name, version))
    return packages


def load_pypi_packages() -> list[LocalPackage]:
    root_config = load_toml(ROOT / "pyproject.toml")
    members = root_config.get("tool", {}).get("uv", {}).get("workspace", {}).get("members", [])
    packages = []
    for member in sorted(members):
        path = ROOT / member / "pyproject.toml"
        if not path.exists():
            continue
        project = load_toml(path).get("project", {})
        name = project.get("name")
        version = project.get("version")
        if isinstance(name, str) and isinstance(version, str):
            packages.append(LocalPackage("pypi", member, name, version))
    return packages


def fetch_json(url: str, timeout: float) -> dict[str, Any]:
    request = Request(url, headers={"User-Agent": "onemem-registry-status/0.1"})
    for attempt in range(REQUEST_ATTEMPTS):
        try:
            with urlopen(request, timeout=timeout) as response:
                payload = response.read().decode("utf8")
            break
        except (URLError, TimeoutError):
            if attempt == REQUEST_ATTEMPTS - 1:
                raise
            time.sleep(0.5 * (attempt + 1))
    data = json.loads(payload)
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object from {url}")
    return data


def query_npm(pkg: LocalPackage, timeout: float) -> RegistryStatus:
    url = f"{NPM_REGISTRY}/{quote(pkg.name, safe='@')}"
    try:
        data = fetch_json(url, timeout)
    except HTTPError as exc:
        if exc.code == 404:
            return status_for(pkg, url, None, STATUS_MISSING)
        return status_for(pkg, url, None, STATUS_ERROR, f"HTTP {exc.code}")
    except (URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
        return status_for(pkg, url, None, STATUS_ERROR, str(exc))
    latest = data.get("dist-tags", {}).get("latest")
    return status_for(pkg, url, latest if isinstance(latest, str) else None)


def query_pypi(pkg: LocalPackage, timeout: float) -> RegistryStatus:
    url = f"{PYPI_REGISTRY}/{quote(pkg.name)}/json"
    try:
        data = fetch_json(url, timeout)
    except HTTPError as exc:
        if exc.code == 404:
            return status_for(pkg, url, None, STATUS_MISSING)
        return status_for(pkg, url, None, STATUS_ERROR, f"HTTP {exc.code}")
    except (URLError, TimeoutError, ValueError, json.JSONDecodeError) as exc:
        return status_for(pkg, url, None, STATUS_ERROR, str(exc))
    version = data.get("info", {}).get("version")
    return status_for(pkg, url, version if isinstance(version, str) else None)


def status_for(
    pkg: LocalPackage,
    url: str,
    registry_version: str | None,
    status: str | None = None,
    error: str | None = None,
) -> RegistryStatus:
    resolved_status = status
    if resolved_status is None:
        resolved_status = STATUS_CURRENT if registry_version == pkg.local_version else STATUS_DRIFT
    return RegistryStatus(
        ecosystem=pkg.ecosystem,
        directory=pkg.directory,
        name=pkg.name,
        local_version=pkg.local_version,
        registry_version=registry_version,
        status=resolved_status,
        registry_url=url,
        error=error,
    )


def collect_statuses(ecosystem: str, timeout: float) -> list[RegistryStatus]:
    packages: list[LocalPackage] = []
    if ecosystem in {"all", "npm"}:
        packages.extend(load_npm_packages())
    if ecosystem in {"all", "pypi"}:
        packages.extend(load_pypi_packages())

    statuses = []
    for pkg in packages:
        if pkg.ecosystem == "npm":
            statuses.append(query_npm(pkg, timeout))
        else:
            statuses.append(query_pypi(pkg, timeout))
    return statuses


def print_table(title: str, statuses: list[RegistryStatus]) -> None:
    print(f"\n{title}")
    headers = ["package", "local", "registry", "status"]
    rows = [
        [s.name, s.local_version, s.registry_version or "-", s.status if not s.error else s.error]
        for s in statuses
    ]
    widths = [max(len(str(row[i])) for row in [headers, *rows]) for i in range(len(headers))]
    print(" | ".join(headers[i].ljust(widths[i]) for i in range(len(headers))))
    print("-+-".join("-" * width for width in widths))
    for row in rows:
        print(" | ".join(str(row[i]).ljust(widths[i]) for i in range(len(headers))))


def print_human(statuses: list[RegistryStatus]) -> None:
    print("OneMem registry publication status")
    for ecosystem, title in [("npm", "npm"), ("pypi", "PyPI")]:
        group = [s for s in statuses if s.ecosystem == ecosystem]
        if group:
            print_table(title, group)
    print("\nLegend: current = registry latest matches local; missing = package not found;")
    print("version-drift = registry latest differs from local.")


def should_fail(statuses: list[RegistryStatus], args: argparse.Namespace) -> bool:
    if args.strict:
        return any(s.status != STATUS_CURRENT for s in statuses)
    if args.fail_on_missing and any(s.status in {STATUS_MISSING, STATUS_ERROR} for s in statuses):
        return True
    return bool(
        args.fail_on_drift and any(s.status in {STATUS_DRIFT, STATUS_ERROR} for s in statuses)
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare local OneMem package versions with npm and PyPI.",
    )
    parser.add_argument("--ecosystem", choices=["all", "npm", "pypi"], default="all")
    parser.add_argument("--timeout", type=float, default=10.0)
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON.")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero unless every local package is published at the same version.",
    )
    parser.add_argument(
        "--fail-on-missing",
        action="store_true",
        help="Exit non-zero when a package is missing or a registry query errors.",
    )
    parser.add_argument(
        "--fail-on-drift",
        action="store_true",
        help="Exit non-zero when a package version differs or a registry query errors.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    statuses = collect_statuses(args.ecosystem, args.timeout)
    if args.json:
        print(json.dumps([asdict(status) for status in statuses], indent=2, sort_keys=True))
    else:
        print_human(statuses)
    return 1 if should_fail(statuses, args) else 0


if __name__ == "__main__":
    raise SystemExit(main())
