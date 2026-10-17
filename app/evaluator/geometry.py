from __future__ import annotations

import numpy as np


def make_unit_cube_cloud(
    points_per_face: int = 25,
) -> tuple[np.ndarray, np.ndarray]:
    """Deterministic unit-cube point cloud with outward normals.

    Returns (points (N,3), normals (N,3)) for a cube spanning [-0.5, 0.5]^3.
    Each face gets a regular grid of *points_per_face* samples (must be a
    perfect square). No randomness — fully deterministic from the grid alone.
    """
    side = int(np.sqrt(points_per_face))
    if side * side != points_per_face:
        raise ValueError("points_per_face must be a perfect square")

    lin = np.linspace(-0.5, 0.5, side, endpoint=True)
    u, v = np.meshgrid(lin, lin)
    u = u.ravel()
    v = v.ravel()

    faces: list[tuple[np.ndarray, np.ndarray]] = []

    half = np.full_like(u, 0.5)

    # +X face
    faces.append(
        (np.column_stack([half, u, v]), np.tile([1.0, 0.0, 0.0], (len(u), 1)))
    )
    # -X face
    faces.append(
        (np.column_stack([-half, u, v]), np.tile([-1.0, 0.0, 0.0], (len(u), 1)))
    )
    # +Y face
    faces.append(
        (np.column_stack([u, half, v]), np.tile([0.0, 1.0, 0.0], (len(u), 1)))
    )
    # -Y face
    faces.append(
        (np.column_stack([u, -half, v]), np.tile([0.0, -1.0, 0.0], (len(u), 1)))
    )
    # +Z face
    faces.append(
        (np.column_stack([u, v, half]), np.tile([0.0, 0.0, 1.0], (len(u), 1)))
    )
    # -Z face
    faces.append(
        (np.column_stack([u, v, -half]), np.tile([0.0, 0.0, -1.0], (len(u), 1)))
    )

    all_points = np.vstack([f[0] for f in faces])
    all_normals = np.vstack([f[1] for f in faces])
    return all_points, all_normals
