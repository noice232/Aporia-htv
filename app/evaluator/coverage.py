from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.evaluator.camera import CameraPose


@dataclass(frozen=True)
class CoverageResult:
    visible_count: int
    total_count: int
    coverage_fraction: float
    visible_mask: np.ndarray  # bool (N,)


def compute_coverage(
    pose: CameraPose,
    points: np.ndarray,
    normals: np.ndarray,
    occlusion_grid_size: int = 64,
) -> CoverageResult:
    N = points.shape[0]
    intr = pose.intrinsics
    W2C = pose.extrinsics  # 4x4

    # --- transform points to camera frame ---
    ones = np.ones((N, 1))
    pts_h = np.hstack([points, ones])  # (N, 4)
    pts_cam = (W2C @ pts_h.T).T[:, :3]  # (N, 3)

    # --- 1. depth test: z > 0 (in front of camera) ---
    in_front = pts_cam[:, 2] > 0

    # --- 2. front-facing test ---
    # camera position in world frame
    R = W2C[:3, :3]
    t = W2C[:3, 3]
    cam_pos_world = -R.T @ t  # (3,)

    view_dirs = points - cam_pos_world  # point - camera_pos
    view_dirs_norm = np.linalg.norm(view_dirs, axis=1, keepdims=True)
    view_dirs_norm = np.where(view_dirs_norm < 1e-12, 1.0, view_dirs_norm)
    view_dirs = view_dirs / view_dirs_norm

    # surface faces camera when dot(normal, -view_dir) > 0
    cos_angle = np.sum(normals * (-view_dirs), axis=1)
    front_facing = cos_angle > 0

    # --- 3. FOV test: project to pixel coords ---
    z = pts_cam[:, 2]
    z_safe = np.where(z > 0, z, 1.0)
    u = intr.fx * (pts_cam[:, 0] / z_safe) + intr.cx
    v = intr.fy * (pts_cam[:, 1] / z_safe) + intr.cy

    in_fov = (u >= 0) & (u < intr.width) & (v >= 0) & (v < intr.height)

    # --- combine pre-occlusion mask ---
    candidate = in_front & front_facing & in_fov

    # --- 4. simple occlusion via depth grid ---
    visible = candidate.copy()
    if occlusion_grid_size > 0:
        cell_w = intr.width / occlusion_grid_size
        cell_h = intr.height / occlusion_grid_size

        cand_idx = np.where(candidate)[0]
        if len(cand_idx) > 0:
            cu = u[cand_idx]
            cv = v[cand_idx]
            cz = z[cand_idx]

            gi = np.clip((cu / cell_w).astype(int), 0, occlusion_grid_size - 1)
            gj = np.clip((cv / cell_h).astype(int), 0, occlusion_grid_size - 1)
            cell_id = gj * occlusion_grid_size + gi

            # for each cell, find minimum depth
            n_cells = occlusion_grid_size * occlusion_grid_size
            min_depth = np.full(n_cells, np.inf)
            np.minimum.at(min_depth, cell_id, cz)

            # keep point if its depth is within tolerance of the cell minimum
            tol = 1e-4
            kept = cz <= (min_depth[cell_id] + tol)
            occluded = cand_idx[~kept]
            visible[occluded] = False

    vis_count = int(np.sum(visible))
    return CoverageResult(
        visible_count=vis_count,
        total_count=N,
        coverage_fraction=vis_count / N if N > 0 else 0.0,
        visible_mask=visible,
    )
