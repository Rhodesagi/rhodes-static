"""
Utilities for UV package manager integration.
"""

import os
import subprocess
import tempfile
from pathlib import Path
from typing import List, Optional

from mlflow.environment_variables import (
    MLFLOW_ENABLE_UV_PROJECT_DETECTION,
    MLFLOW_UV_PROJECT_PATH,
)
from mlflow.exceptions import MlflowException


def is_uv_available() -> bool:
    """Check if UV is available on the system."""
    try:
        subprocess.run(["uv", "--version"], capture_output=True, check=True)
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        return False


def detect_uv_project(model_path: Path) -> Optional[Path]:
    """
    Detect if a UV project exists at the given path or in parent directories.
    
    Args:
        model_path: Path to the model directory.
        
    Returns:
        Path to the UV project directory if found, None otherwise.
    """
    # Check environment variable first
    env_path = MLFLOW_UV_PROJECT_PATH.get()
    if env_path:
        env_path = Path(env_path)
        if env_path.exists():
            return env_path.resolve()
        else:
            raise MlflowException(
                f"UV project path specified by MLFLOW_UV_PROJECT_PATH does not exist: {env_path}"
            )
    
    # Auto-detect by checking for uv.lock and pyproject.toml
    current = model_path.resolve()
    while current != current.parent:  # Stop at root
        uv_lock = current / "uv.lock"
        pyproject_toml = current / "pyproject.toml"
        if uv_lock.exists() and pyproject_toml.exists():
            return current
        current = current.parent
    
    return None


def export_uv_requirements(project_path: Path) -> List[str]:
    """
    Export locked requirements from a UV project using `uv export`.
    
    Args:
        project_path: Path to the UV project directory.
        
    Returns:
        List of requirement strings.
        
    Raises:
        MlflowException: If uv export fails or UV is not available.
    """
    if not is_uv_available():
        raise MlflowException("UV is not available. Please install UV to use UV project detection.")
    
    try:
        # Run uv export to get requirements
        result = subprocess.run(
            ["uv", "export", "--no-hashes", "--no-editable"],
            cwd=project_path,
            capture_output=True,
            text=True,
            check=True,
        )
        
        requirements = []
        for line in result.stdout.strip().splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                requirements.append(line)
        
        return requirements
    except subprocess.CalledProcessError as e:
        raise MlflowException(
            f"Failed to export requirements from UV project: {e.stderr}"
        ) from e
    except FileNotFoundError:
        raise MlflowException(
            "UV command not found. Please install UV to use UV project detection."
        )


def infer_requirements_from_uv_project(model_path: Path) -> Optional[List[str]]:
    """
    Infer requirements from a UV project if available.
    
    Args:
        model_path: Path to the model directory.
        
    Returns:
        List of requirement strings if UV project is detected and requirements
        can be exported, None otherwise.
    """
    if not MLFLOW_ENABLE_UV_PROJECT_DETECTION.get():
        return None
    
    try:
        project_path = detect_uv_project(model_path)
        if project_path is None:
            return None
        
        return export_uv_requirements(project_path)
    except MlflowException as e:
        # Log warning but don't fail - fall back to regular inference
        import logging
        logging.getLogger(__name__).warning(
            f"Failed to infer requirements from UV project, falling back to "
            f"regular inference: {e}"
        )
        return None