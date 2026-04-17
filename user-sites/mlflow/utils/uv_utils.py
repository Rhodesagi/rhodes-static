"""
Utilities for UV (Astral) package manager support in MLflow.
"""

import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

from mlflow.exceptions import MlflowException

_logger = logging.getLogger(__name__)


def is_uv_available():
    """
    Check if the uv command is available in the system PATH.
    
    Returns:
        bool: True if uv is available, False otherwise.
    """
    return shutil.which("uv") is not None


def is_uv_project(path):
    """
    Check if the given path contains a UV project (has uv.lock and pyproject.toml files).
    
    Args:
        path: Directory path to check.
        
    Returns:
        bool: True if both uv.lock and pyproject.toml exist in the path.
    """
    path = Path(path)
    return (path / "uv.lock").exists() and (path / "pyproject.toml").exists()


def detect_uv_project(model_path):
    """
    Detect if a UV project exists in or above the model directory.
    
    Args:
        model_path: Path to the MLflow model directory.
        
    Returns:
        Path or None: Path to the UV project directory if found, None otherwise.
    """
    model_path = Path(model_path).resolve()
    
    # First check the model directory itself
    if is_uv_project(model_path):
        return model_path
    
    # Check parent directories (up to root)
    for parent in model_path.parents:
        if is_uv_project(parent):
            return parent
    
    return None


def get_uv_requirements(uv_project_path, format="requirements.txt"):
    """
    Export requirements from a UV project using `uv export`.
    
    Args:
        uv_project_path: Path to the UV project directory.
        format: Output format (default: "requirements.txt").
        
    Returns:
        list: List of requirement strings.
        
    Raises:
        MlflowException: If uv export fails.
    """
    if not is_uv_available():
        raise MlflowException("uv is not available")
    
    uv_project_path = Path(uv_project_path).resolve()
    
    try:
        # Run uv export to get requirements
        result = subprocess.run(
            ["uv", "export", "--format", format],
            cwd=uv_project_path,
            capture_output=True,
            text=True,
            check=True,
        )
        
        # Parse the output into requirement lines
        requirements = []
        for line in result.stdout.splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                requirements.append(line)
        
        return requirements
        
    except subprocess.CalledProcessError as e:
        raise MlflowException(f"Failed to export requirements with uv: {e.stderr}") from e
    except FileNotFoundError:
        raise MlflowException("uv command not found")


def get_uv_requirements_from_model(model_path, uv_project_path=None):
    """
    Get requirements for a model by detecting or using specified UV project.
    
    Args:
        model_path: Path to the MLflow model directory.
        uv_project_path: Optional explicit path to UV project. If None, will attempt detection.
        
    Returns:
        tuple: (requirements list, uv_project_path used or None if not using UV)
    """
    # Check for explicit UV project path
    if uv_project_path is not None:
        if not is_uv_project(uv_project_path):
            raise MlflowException(f"Specified UV project path does not contain uv.lock and pyproject.toml: {uv_project_path}")
        requirements = get_uv_requirements(uv_project_path)
        return requirements, uv_project_path
    
    # Auto-detect UV project
    detected_path = detect_uv_project(model_path)
    if detected_path:
        requirements = get_uv_requirements(detected_path)
        return requirements, detected_path
    
    return None, None