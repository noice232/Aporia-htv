"""Read-only Papiers CLI adapter.

The CLI is invoked with fixed verbs and positional arguments, never a shell.
Raw provider output stays out of error messages and server logs because it may
contain private annotations.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


_SOURCE_ID = re.compile(r"^(?:doc|pas|hl|nte|eq|cnv)_[A-Za-z0-9_-]+$")
# npm installs a .cmd shim on Windows. Keep search text free of CMD metacharacters
# even though subprocess receives an argument vector with shell=False.
_SEARCH_QUERY = re.compile(r"^[\w .,:+/-]{1,500}$", re.UNICODE)


class PapiersUnavailable(RuntimeError):
    pass


class PapiersInvalidResponse(RuntimeError):
    pass


@dataclass(frozen=True)
class PapiersStatus:
    connected: bool
    mode: str
    authenticated_user: str | None
    capabilities: list[str]
    checked_at: str
    error: str | None


class PapiersAdapter:
    def __init__(
        self,
        token: str | None = None,
        cli: str | None = None,
        timeout_seconds: float = 12,
    ) -> None:
        self.token = token or None
        self.cli = cli if cli is not None else shutil.which("papiers")
        self.timeout_seconds = timeout_seconds

    @classmethod
    def from_environment(cls) -> PapiersAdapter:
        return cls(token=os.getenv("PAPIERS_TOKEN"))

    def _require_available(self) -> None:
        if not self.token:
            raise PapiersUnavailable("Papiers token is not configured")
        if not self.cli:
            raise PapiersUnavailable("Papiers CLI is not installed")

    def _run(self, arguments: list[str]) -> str:
        self._require_available()
        environment = os.environ.copy()
        environment["PAPIERS_TOKEN"] = self.token or ""
        try:
            result = subprocess.run(
                [self.cli or "papiers", *arguments],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                env=environment,
                timeout=self.timeout_seconds,
                check=False,
                shell=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise PapiersUnavailable("Papiers CLI timed out") from exc
        except OSError as exc:
            raise PapiersUnavailable("Papiers CLI could not start") from exc
        if result.returncode != 0:
            raise PapiersUnavailable("Papiers CLI request failed")
        return result.stdout

    def _run_json(self, arguments: list[str]) -> Any:
        output = self._run(arguments)
        try:
            return json.loads(output)
        except json.JSONDecodeError as exc:
            raise PapiersInvalidResponse("Papiers CLI returned invalid JSON") from exc

    def status(self) -> PapiersStatus:
        checked_at = datetime.now(timezone.utc).isoformat()
        try:
            self._run(["auth", "status"])
        except PapiersUnavailable as exc:
            return PapiersStatus(
                connected=False,
                mode="disconnected",
                authenticated_user=None,
                capabilities=[],
                checked_at=checked_at,
                error=str(exc),
            )
        return PapiersStatus(
            connected=True,
            mode="live_source",
            authenticated_user=None,
            capabilities=["search", "read"],
            checked_at=checked_at,
            error=None,
        )

    def search(self, query: str, limit: int = 10) -> Any:
        if not query.strip() or not _SEARCH_QUERY.fullmatch(query):
            raise ValueError("Search query contains unsupported characters")
        if not 1 <= limit <= 20:
            raise ValueError("Search limit must be between 1 and 20")
        return self._run_json(["search", query, "--limit", str(limit), "--json"])

    def read(self, source_id: str) -> Any:
        if not _SOURCE_ID.fullmatch(source_id):
            raise ValueError("Invalid Papiers source ID")
        return self._run_json(["read", source_id, "--json"])
