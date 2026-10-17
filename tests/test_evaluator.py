import numpy as np

from app.evaluator.camera import CameraIntrinsics, CameraPose, look_at
from app.evaluator.coverage import compute_coverage
from app.evaluator.geometry import make_unit_cube_cloud

INTRINSICS = CameraIntrinsics(fx=500.0, fy=500.0, cx=320.0, cy=240.0, width=640, height=480)


def _pose(eye, target):
    return CameraPose(intrinsics=INTRINSICS, extrinsics=look_at(np.array(eye), np.array(target)))


class TestGeometry:
    def test_unit_cube_point_count(self):
        pts, norms = make_unit_cube_cloud(points_per_face=25)
        assert pts.shape == (150, 3)
        assert norms.shape == (150, 3)

    def test_normals_are_unit_length(self):
        _, norms = make_unit_cube_cloud(points_per_face=25)
        lengths = np.linalg.norm(norms, axis=1)
        np.testing.assert_allclose(lengths, 1.0)

    def test_points_on_cube_surface(self):
        pts, _ = make_unit_cube_cloud(points_per_face=25)
        # every point should have at least one coord at ±0.5
        on_surface = np.any(np.abs(np.abs(pts) - 0.5) < 1e-9, axis=1)
        assert np.all(on_surface)

    def test_deterministic(self):
        p1, n1 = make_unit_cube_cloud(points_per_face=25)
        p2, n2 = make_unit_cube_cloud(points_per_face=25)
        np.testing.assert_array_equal(p1, p2)
        np.testing.assert_array_equal(n1, n2)


class TestCoverage:
    def setup_method(self):
        self.points, self.normals = make_unit_cube_cloud(points_per_face=25)

    def test_facing_z_face(self):
        """Camera at (0,0,3) looking at origin — sees exactly the +Z face (25 pts)."""
        r = compute_coverage(_pose([0, 0, 3], [0, 0, 0]), self.points, self.normals)
        assert r.visible_count == 25
        assert r.total_count == 150
        assert r.coverage_fraction == 25 / 150

    def test_pointing_away(self):
        """Camera at (0,0,3) looking away — sees nothing."""
        r = compute_coverage(_pose([0, 0, 3], [0, 0, 6]), self.points, self.normals)
        assert r.visible_count == 0
        assert r.coverage_fraction == 0.0

    def test_corner_view_three_faces(self):
        """Camera at (2,2,2) looking at origin — sees 3 faces (75 pts)."""
        r = compute_coverage(_pose([2, 2, 2], [0, 0, 0]), self.points, self.normals)
        assert r.visible_count == 75
        assert r.coverage_fraction == 0.5

    def test_narrow_fov(self):
        """Narrow-FOV camera close up — still sees the +Z face."""
        intr = CameraIntrinsics(fx=200.0, fy=200.0, cx=160.0, cy=120.0, width=320, height=240)
        pose = CameraPose(intrinsics=intr, extrinsics=look_at(np.array([0.0, 0.0, 1.5]), np.array([0.0, 0.0, 0.0])))
        r = compute_coverage(pose, self.points, self.normals)
        assert r.visible_count == 25
        assert r.coverage_fraction == 25 / 150

    def test_facing_beats_away(self):
        r_at = compute_coverage(_pose([0, 0, 3], [0, 0, 0]), self.points, self.normals)
        r_away = compute_coverage(_pose([0, 0, 3], [0, 0, 6]), self.points, self.normals)
        assert r_at.coverage_fraction > r_away.coverage_fraction

    def test_deterministic(self):
        r1 = compute_coverage(_pose([0, 0, 3], [0, 0, 0]), self.points, self.normals)
        r2 = compute_coverage(_pose([0, 0, 3], [0, 0, 0]), self.points, self.normals)
        assert r1.visible_count == r2.visible_count
        assert r1.coverage_fraction == r2.coverage_fraction
        np.testing.assert_array_equal(r1.visible_mask, r2.visible_mask)

    def test_visible_mask_shape(self):
        r = compute_coverage(_pose([0, 0, 3], [0, 0, 0]), self.points, self.normals)
        assert r.visible_mask.shape == (150,)
        assert r.visible_mask.dtype == bool
        assert np.sum(r.visible_mask) == r.visible_count
