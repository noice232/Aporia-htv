from __future__ import annotations

from dataclasses import dataclass

import numpy as np


@dataclass(frozen=True)
class CameraIntrinsics:
    fx: float
    fy: float
    cx: float
    cy: float
    width: int
    height: int


@dataclass(frozen=True)
class CameraPose:
    intrinsics: CameraIntrinsics
    extrinsics: np.ndarray  # 4x4 world-to-camera


def look_at(
    eye: np.ndarray,
    target: np.ndarray,
    up: np.ndarray | None = None,
) -> np.ndarray:
    """Build a 4x4 world-to-camera matrix (OpenCV convention: +Z forward)."""
    if up is None:
        up = np.array([0.0, 1.0, 0.0])

    forward = target - eye
    forward = forward / np.linalg.norm(forward)

    right = np.cross(forward, up)
    norm = np.linalg.norm(right)
    if norm < 1e-9:
        up = np.array([1.0, 0.0, 0.0])
        right = np.cross(forward, up)
        norm = np.linalg.norm(right)
    right = right / norm

    true_up = np.cross(right, forward)

    R = np.eye(3)
    R[0, :] = right
    R[1, :] = true_up
    R[2, :] = forward

    t = -R @ eye

    mat = np.eye(4)
    mat[:3, :3] = R
    mat[:3, 3] = t
    return mat
