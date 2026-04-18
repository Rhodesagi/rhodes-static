"""
Utility functions for UV package manager integration with MLflow.

This module provides functionality to detect UV projects and export
locked dependencies from uv.lock files for MLflow model packaging.
"""

import logging
import os
import subprocess
from pathlib import Path
from typing import Optional

from mlflow.environment_variables import (
    MLFLOW_UV_AUTO_DETECT,
    MLFLOW_UV_LOG_ARTIFACTS,
    MLFLOW_UV_PROJECT_PATH,
)
from mlflow.utils._spark_utils import modified_environ

_logger = logging.getLogger(__name__)

_UV_LOCK_FILE = "uv.lock"
_PYPROJECT_TOML = "pyproject.toml"


def _is_uv_available() -> bool:
    """Check if the `uv` command is available in the system PATH."""
    return subprocess.run(["uv", "--version"], capture_output=True).returncode == 0


def _find_uv_lock_file(project_path: Optional[str] = None) -> Optional[Path]:
    """
    Find the uv.lock file in the project directory.

    Args:
        project_path: Optional explicit path to the UV project directory.
            If not provided, uses the current working directory.

    Returns:
        Path to the uv.lock file if found, None otherwise.
    """
    if project_path:
        search_path = Path(project_path).resolve()
    else:
        search_path = Path.cwd()

    uv_lock = search_path / _UV_LOCK_FILE
    pyproject = search_path / _PYPROJECT_TOML

    if uv_lock.exists() and pyproject.exists():
        return uv_lock

    return None


def _is_uv_project(project_path: Optional[str] = None) -> bool:
    """
    Check if the current directory or specified path is a UV project.

    A UV project is detected by the presence of both uv.lock and pyproject.toml files.

    Args:
        project_path: Optional explicit path to check. If not provided,
            uses the current working directory.

    Returns:
        True if both uv.lock and pyproject.toml exist in the project path.
    """
    return _find_uv_lock_file(project_path) is not None


def _should_use_uv_export(project_path: Optional[str] = None) -> bool:
    """
    Determine if UV export should be used for dependency inference.

    Returns True if:
    1. MLFLOW_UV_AUTO_DETECT is enabled (default True)
    2. UV project files (uv.lock + pyproject.toml) are present
    3. The `uv` command is available

    Args:
        project_path: Optional explicit path to the UV project directory.

    Returns:
        True if UV export should be used, False otherwise.
    """
    if not MLFLOW_UV_AUTO_DETECT.get():
        _logger.debug("UV auto-detection is disabled via MLFLOW_UV_AUTO_DETECT")
        return False

    if not _is_uv_available():
        _logger.debug("UV is not available in PATH")
        return False

    if not _is_uv_project(project_path):
        _logger.debug("No UV project detected (uv.lock + pyproject.toml not found)")
        return False

    return True


def _get_uv_export_command(uv_lock_path: Path, output_format: str = "requirements") -> list[str]:
    """
    Build the UV export command.

    Args:
        uv_lock_path: Path to the uv.lock file.
        output_format: The export format (default: requirements).

    Returns:
        List of command arguments for subprocess.
    """
    cmd = [
        "uv",
        "export",
        "--frozen",
        f"--format={output_format}",
        f"--project={uv_lock_path.parent}",
    ]
    return cmd


def export_uv_requirements(
    project_path: Optional[str] = None,
    fallback_to_inference: bool = True,
) -> Optional[str]:
    """
    Export requirements from a UV project using `uv export`.

    This function attempts to export locked dependencies from a UV project.
    If UV export fails and fallback_to_inference is True, returns None to
    allow fallback to standard dependency inference.

    Args:
        project_path: Optional explicit path to the UV project directory.
            If not provided, searches from current working directory.
        fallback_to_inference: If True, returns None on export failure to
            allow fallback to standard dependency inference. If False,
            raises an exception on failure.

    Returns:
        String containing the exported requirements, or None if export
        failed and fallback_to_inference is True.

    Raises:
        RuntimeError: If UV export fails and fallback_to_inference is False.
    """
    uv_lock_path = _find_uv_lock_file(project_path)
    if uv_lock_path is None:
        _logger.debug("No UV lock file found")
        return None

    cmd = _get_uv_export_command(uv_lock_path)

    try:
        _logger.info(f"Exporting requirements from UV project: {uv_lock_path.parent}")
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
        )
        _logger.debug("Successfully exported requirements from UV project")
        return result.stdout
    except subprocess.CalledProcessError as e:
        error_msg = f"Failed to export requirements from UV project: {e.stderr}"
        if fallback_to_inference:
            _logger.warning(f"{error_msg}. Falling back to dependency inference.")
            return None
        raise RuntimeError(error_msg) from e
    except FileNotFoundError:
        error_msg = "UV command not found. Ensure UV is installed and in PATH."
        if fallback_to_inference:
            _logger.warning(f"{error_msg}. Falling back to dependency inference.")
            return None
        raise RuntimeError(error_msg)


def get_uv_project_path() -> Optional[str]:
    """
    Get the UV project path from environment variable or auto-detect.

    Returns:
        The UV project path if specified or detected, None otherwise.
    """
    explicit_path = MLFLOW_UV_PROJECT_PATH.get()
    if explicit_path:
        return explicit_path
    return None


def should_log_uv_artifacts() -> bool:
    """
    Check if UV artifacts (uv.lock, pyproject.toml) should be logged.

    Returns:
        True if MLFLOW_UV_LOG_ARTIFACTS is enabled, False otherwise.
    """
    return MLFLOW_UV_LOG_ARTIFACTS.get()


def get_uv_artifact_paths(project_path: Optional[str] = None) -> list[Path]:
    """
    Get paths to UV artifacts that should be logged.

    Args:
        project_path: Optional explicit path to the UV project directory.

    Returns:
        List of paths to UV artifacts (uv.lock, pyproject.toml).
    """
    paths = []
    search_path = Path(project_path) if project_path else Path.cwd()

    uv_lock = search_path / _UV_LOCK_FILE
    pyproject = search_path / _PYPROJECT_TOML

    if uv_lock.exists():
        paths.append(uv_lock)
    if pyproject.exists():
        paths.append(pyproject)

    return paths


def infer_uv_dependencies(
    model_path: str,
    fallback: Optional[list[str]] = None,
) -> list[str]:
    """
    Infer dependencies using UV export if available.

    This is a high-level function that attempts to use UV export for
    dependency inference, with fallback to standard inference if UV is
    not available or export fails.

    Args:
        model_path: Path to the model directory (used for context).
        fallback: Fallback list of requirements if UV export fails.

    Returns:
        List of requirement strings.
    """
    project_path = get_uv_project_path()

    if not _should_use_uv_export(project_path):
        return fallback or []

    exported = export_uv_requirements(project_path, fallback_to_inference=True)
    if exported:
        # Parse the exported requirements text into a list
        reqs = [
            line.strip()
            for line in exported.splitlines()
            if line.strip() and not line.startswith("#")
        ]
        return reqs

    return fallback or []
