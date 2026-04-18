"""
Utilities for UV package manager integration.
"""

import logging
import os
import subprocess
from pathlib import Path
from typing import List, Optional

_logger = logging.getLogger(__name__)


def is_uv_available() -> bool:
    """Check if uv is installed and available in PATH."""
    return shutil.which("uv") is not None


def find_uv_project(path: str) -> Optional[str]:
    """
    Walk up from the given directory to find the nearest parent directory that contains both
    uv.lock and pyproject.toml.

    Args:
        path: Starting directory path.

    Returns:
        Path to the UV project root directory, or None if not found.
    """
    current = Path(path).resolve()
    while True:
        uv_lock = current / "uv.lock"
        pyproject = current / "pyproject.toml"
        if uv_lock.is_file() and pyproject.is_file():
            return str(current)
        parent = current.parent
        if parent == current:
            break
        current = parent
    return None


def is_uv_project(path: str) -> bool:
    """Check if the given directory contains both uv.lock and pyproject.toml."""
    uv_lock = os.path.join(path, "uv.lock")
    pyproject = os.path.join(path, "pyproject.toml")
    return os.path.isfile(uv_lock) and os.path.isfile(pyproject)


def export_requirements(project_path: str, format: str = "requirements") -> Optional[List[str]]:
    """
    Run `uv export` to get locked requirements.

    Args:
        project_path: Path to the UV project root.
        format: Export format, either "requirements" or "conda".

    Returns:
        List of requirement strings, or None if uv export fails.
    """
    if not is_uv_available():
        _logger.debug("uv not available")
        return None
    try:
        cmd = ["uv", "export", "--format", format]
        result = subprocess.run(
            cmd,
            cwd=project_path,
            capture_output=True,
            text=True,
            check=True,
        )
        lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
        return lines
    except subprocess.CalledProcessError as e:
        _logger.debug("uv export failed: %s", e.stderr)
    except Exception as e:
        _logger.debug("Unexpected error during uv export: %s", e)
    return None


def get_uv_requirements(project_path: str) -> Optional[List[str]]:
    """
    Get locked requirements from a UV project.

    Args:
        project_path: Path to the UV project root.

    Returns:
        List of requirement strings, or None if unable to export.
    """
    return export_requirements(project_path, format="requirements")