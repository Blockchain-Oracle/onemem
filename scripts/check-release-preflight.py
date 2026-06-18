#!/usr/bin/env python3
"""Report registry drift and publish-auth readiness without exposing secrets."""

from __future__ import annotations

import argparse
import gzip
import io
import json
import os
import subprocess
import sys
import tarfile
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
REGISTRY_STATUS_SCRIPT = ROOT / "scripts" / "check-registry-status.py"
TRUE_VALUES = {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class ArtifactMarker:
    ecosystem: str
    name: str
    marker: str
    path_suffixes: tuple[str, ...]


ARTIFACT_MARKERS = [
    ArtifactMarker(
        ecosystem="npm",
        name="@onemem/vercel-ai-provider",
        marker="createOneMemMemory",
        path_suffixes=(
            "package/dist/index.js",
            "package/dist/index.cjs",
            "package/dist/index.d.ts",
        ),
    ),
    ArtifactMarker(
        ecosystem="npm",
        name="@onemem/openai-agents",
        marker="createOneMemMemory",
        path_suffixes=(
            "package/dist/index.js",
            "package/dist/index.cjs",
            "package/dist/index.d.ts",
        ),
    ),
    ArtifactMarker(
        ecosystem="pypi",
        name="onemem-crewai",
        marker="create_onemem_memory",
        path_suffixes=("onemem_crewai/memory.py",),
    ),
    ArtifactMarker(
        ecosystem="pypi",
        name="onemem-livekit",
        marker="create_onemem_memory",
        path_suffixes=("onemem_livekit/memory.py",),
    ),
    ArtifactMarker(
        ecosystem="pypi",
        name="onemem-elevenlabs",
        marker="create_onemem_memory",
        path_suffixes=("onemem_elevenlabs/memory.py",),
    ),
]


@dataclass(frozen=True)
class AuthStatus:
    npm_token: bool
    npm_trusted_publishing: bool
    pypi_token: bool

    @property
    def npm_ready(self) -> bool:
        return self.npm_token or self.npm_trusted_publishing

    @property
    def pypi_ready(self) -> bool:
        return self.pypi_token


def env_enabled(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in TRUE_VALUES


def env_present(*names: str) -> bool:
    return any(bool(os.environ.get(name, "").strip()) for name in names)


def auth_status() -> AuthStatus:
    return AuthStatus(
        npm_token=env_present("NPM_TOKEN", "NODE_AUTH_TOKEN"),
        npm_trusted_publishing=env_enabled("ONEMEM_NPM_TRUSTED_PUBLISHING"),
        pypi_token=env_present("PYPI_TOKEN", "UV_PUBLISH_TOKEN"),
    )


def registry_statuses(timeout: float) -> list[dict[str, Any]]:
    result = subprocess.run(
        [
            sys.executable,
            str(REGISTRY_STATUS_SCRIPT),
            "--json",
            "--timeout",
            str(timeout),
        ],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    data = json.loads(result.stdout)
    if not isinstance(data, list):
        raise RuntimeError("registry status did not return a JSON list")
    return [item for item in data if isinstance(item, dict)]


def fetch_bytes(url: str, timeout: float) -> bytes:
    request = Request(url, headers={"User-Agent": "onemem-release-preflight/0.1"})
    with urlopen(request, timeout=timeout) as response:
        return response.read()


def fetch_json(url: str, timeout: float) -> dict[str, Any]:
    data = json.loads(fetch_bytes(url, timeout).decode("utf8"))
    if not isinstance(data, dict):
        raise ValueError(f"Expected JSON object from {url}")
    return data


def member_matches(path: str, marker: ArtifactMarker, payload: bytes) -> bool:
    if not any(path.endswith(suffix) for suffix in marker.path_suffixes):
        return False
    return marker.marker.encode("utf8") in payload


def npm_artifact_has_marker(status: dict[str, Any], marker: ArtifactMarker, timeout: float) -> bool:
    data = fetch_json(str(status["registry_url"]), timeout)
    version = str(status["registry_version"])
    tarball = data.get("versions", {}).get(version, {}).get("dist", {}).get("tarball")
    if not isinstance(tarball, str):
        raise ValueError(f"Missing npm tarball URL for {marker.name}@{version}")
    archive = io.BytesIO(fetch_bytes(tarball, timeout))
    with tarfile.open(fileobj=archive, mode="r:gz") as tar:
        for member in tar.getmembers():
            if not member.isfile():
                continue
            extracted = tar.extractfile(member)
            if extracted and member_matches(member.name, marker, extracted.read()):
                return True
    return False


def pypi_file_has_marker(url: str, marker: ArtifactMarker, timeout: float) -> bool:
    payload = fetch_bytes(url, timeout)
    if url.endswith(".whl"):
        with ZipFile(io.BytesIO(payload)) as archive:
            for name in archive.namelist():
                if member_matches(name, marker, archive.read(name)):
                    return True
        return False
    if url.endswith(".tar.gz"):
        with tarfile.open(fileobj=io.BytesIO(payload), mode="r:gz") as tar:
            for member in tar.getmembers():
                if not member.isfile():
                    continue
                extracted = tar.extractfile(member)
                if extracted and member_matches(member.name, marker, extracted.read()):
                    return True
        return False
    if url.endswith(".gz"):
        return marker.marker.encode("utf8") in gzip.decompress(payload)
    return marker.marker.encode("utf8") in payload


def pypi_artifact_has_marker(
    status: dict[str, Any], marker: ArtifactMarker, timeout: float
) -> bool:
    data = fetch_json(str(status["registry_url"]), timeout)
    urls = data.get("urls")
    if not isinstance(urls, list):
        raise ValueError(f"Missing PyPI file list for {marker.name}@{status['registry_version']}")
    artifact_urls = [
        item.get("url")
        for item in urls
        if isinstance(item, dict) and item.get("packagetype") in {"bdist_wheel", "sdist"}
    ]
    artifact_urls = [url for url in artifact_urls if isinstance(url, str)]
    if not artifact_urls:
        raise ValueError(f"No PyPI wheel/sdist artifacts for {marker.name}")
    return all(pypi_file_has_marker(url, marker, timeout) for url in artifact_urls)


def artifact_checks(statuses: list[dict[str, Any]], timeout: float) -> list[dict[str, Any]]:
    by_package = {(s.get("ecosystem"), s.get("name")): s for s in statuses}
    checks = []
    for marker in ARTIFACT_MARKERS:
        status = by_package.get((marker.ecosystem, marker.name))
        if not status or status.get("status") != "current":
            continue
        try:
            ok = (
                npm_artifact_has_marker(status, marker, timeout)
                if marker.ecosystem == "npm"
                else pypi_artifact_has_marker(status, marker, timeout)
            )
        except (
            HTTPError,
            URLError,
            OSError,
            tarfile.TarError,
            ValueError,
            json.JSONDecodeError,
        ) as exc:
            checks.append(
                {
                    "ecosystem": marker.ecosystem,
                    "name": marker.name,
                    "version": status.get("registry_version"),
                    "marker": marker.marker,
                    "status": "error",
                    "error": str(exc),
                }
            )
            continue
        checks.append(
            {
                "ecosystem": marker.ecosystem,
                "name": marker.name,
                "version": status.get("registry_version"),
                "marker": marker.marker,
                "status": "ok" if ok else "artifact-drift",
                "error": None,
            }
        )
    return checks


def noncurrent(statuses: list[dict[str, Any]], ecosystem: str) -> list[dict[str, Any]]:
    return [
        status
        for status in statuses
        if status.get("ecosystem") == ecosystem and status.get("status") != "current"
    ]


def has_registry_errors(statuses: list[dict[str, Any]]) -> bool:
    return any(status.get("status") == "error" for status in statuses)


def artifact_issues(
    checks: list[dict[str, Any]], ecosystem: str | None = None
) -> list[dict[str, Any]]:
    return [
        check
        for check in checks
        if check.get("status") != "ok"
        and (ecosystem is None or check.get("ecosystem") == ecosystem)
    ]


def package_label(status: dict[str, Any]) -> str:
    registry_version = status.get("registry_version") or "-"
    return (
        f"{status.get('name')}@{status.get('local_version')} "
        f"({status.get('status')}, registry: {registry_version})"
    )


def print_group(title: str, items: list[dict[str, Any]]) -> None:
    print(title)
    if not items:
        print("- all current")
        return
    for item in items:
        print(f"- {package_label(item)}")


def print_artifact_group(checks: list[dict[str, Any]]) -> None:
    print("published artifacts missing shipped markers")
    if not checks:
        print("- no current published artifacts require marker checks")
        return
    issues = artifact_issues(checks)
    if not issues:
        print("- all checked artifacts contain required markers")
        return
    for item in issues:
        detail = item.get("error") or f"missing marker `{item.get('marker')}`"
        print(f"- {item.get('name')}@{item.get('version')} ({item.get('status')}): {detail}")


def auth_line(auth: AuthStatus, ecosystem: str) -> str:
    if ecosystem == "npm":
        if auth.npm_token:
            return "available via NPM_TOKEN or NODE_AUTH_TOKEN"
        if auth.npm_trusted_publishing:
            return "available via ONEMEM_NPM_TRUSTED_PUBLISHING"
        return "missing: set NPM_TOKEN/NODE_AUTH_TOKEN or enable trusted publishing"
    if auth.pypi_token:
        return "available via PYPI_TOKEN or UV_PUBLISH_TOKEN"
    return "missing: set PYPI_TOKEN or UV_PUBLISH_TOKEN"


def print_human(
    statuses: list[dict[str, Any]], checks: list[dict[str, Any]], auth: AuthStatus
) -> None:
    npm_needed = noncurrent(statuses, "npm")
    pypi_needed = noncurrent(statuses, "pypi")

    print("OneMem release preflight")
    print()
    print_group("npm packages needing publication", npm_needed)
    print()
    print_group("PyPI packages needing publication", pypi_needed)
    print()
    print_artifact_group(checks)
    print()
    print("publish auth")
    print(f"- npm: {auth_line(auth, 'npm')}")
    print(f"- PyPI: {auth_line(auth, 'pypi')}")
    print()
    print("strict handoff")
    print("- use `pnpm release:preflight --strict` before claiming registries are current")
    print("- use `pnpm registry:status --strict` after publishing to prove registry parity")


def exit_code(
    args: argparse.Namespace,
    statuses: list[dict[str, Any]],
    checks: list[dict[str, Any]],
    auth: AuthStatus,
) -> int:
    npm_needed = bool(noncurrent(statuses, "npm") or artifact_issues(checks, "npm"))
    pypi_needed = bool(noncurrent(statuses, "pypi") or artifact_issues(checks, "pypi"))
    auth_missing = (npm_needed and not auth.npm_ready) or (pypi_needed and not auth.pypi_ready)
    drift_exists = npm_needed or pypi_needed
    registry_error = has_registry_errors(statuses) or any(
        check.get("status") == "error" for check in checks
    )

    if args.strict:
        return 1 if drift_exists or auth_missing or registry_error else 0
    if args.require_auth:
        return 1 if auth_missing or registry_error else 0
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Report OneMem release registry drift and auth readiness.",
    )
    parser.add_argument("--timeout", type=float, default=10.0)
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON.")
    parser.add_argument(
        "--require-auth",
        action="store_true",
        help="Exit non-zero when packages need publication but auth is unavailable.",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit non-zero unless registries are current and publish auth is ready when needed.",
    )
    argv = sys.argv[1:]
    if argv[:1] == ["--"]:
        argv = argv[1:]
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args()
    auth = auth_status()
    statuses = registry_statuses(args.timeout)
    checks = artifact_checks(statuses, args.timeout)
    if args.json:
        print(
            json.dumps(
                {
                    "artifact_checks": checks,
                    "auth": asdict(auth),
                    "statuses": statuses,
                },
                indent=2,
                sort_keys=True,
            )
        )
    else:
        print_human(statuses, checks, auth)
    return exit_code(args, statuses, checks, auth)


if __name__ == "__main__":
    raise SystemExit(main())
