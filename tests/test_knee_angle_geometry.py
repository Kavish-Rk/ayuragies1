import math
import numpy as np

def test_angle_90_degrees():
    from oa_screening.features import _angle
    # Hip at (0, 1), Knee at (0, 0), Ankle at (1, 0)
    # v1 = Hip - Knee = (0, 1)
    # v2 = Ankle - Knee = (1, 0)
    # Dot product = 0 -> 90 degrees
    val = _angle(np.array([0., 1.]), np.array([0., 0.]), np.array([1., 0.]))
    assert math.isclose(val, 90.0)

def test_angle_180_degrees():
    from oa_screening.features import _angle
    # Hip at (0, 1), Knee at (0, 0), Ankle at (0, -1)
    val = _angle(np.array([0., 1.]), np.array([0., 0.]), np.array([0., -1.]))
    assert math.isclose(val, 180.0)

def test_angle_45_degrees():
    from oa_screening.features import _angle
    # Hip at (0, 1), Knee at (0, 0), Ankle at (1, 1)
    val = _angle(np.array([0., 1.]), np.array([0., 0.]), np.array([1., 1.]))
    assert math.isclose(val, 45.0)

def test_degenerate_angle_is_nan():
    from oa_screening.features import _angle
    # Zero length vector (Hip == Knee)
    val = _angle(np.array([0., 0.]), np.array([0., 0.]), np.array([1., 0.]))
    assert math.isnan(val)
