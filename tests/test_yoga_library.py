"""Unit tests for Yoga / Movement Library."""
import pytest
from oa_screening.guidance.exercise_library import (
    EXERCISE_LIBRARY,
    get_camera_trackable_exercises,
    get_exercise_by_id,
    get_exercises_by_category,
    get_exercises_by_difficulty,
)
from oa_screening.guidance.models import EvidenceType, ExerciseCategory


def test_library_not_empty():
    assert len(EXERCISE_LIBRARY) >= 12


def test_distinct_categories():
    categories = {ex.category for ex in EXERCISE_LIBRARY}
    assert ExerciseCategory.YOGA in categories
    assert ExerciseCategory.MOBILITY in categories
    assert ExerciseCategory.STRENGTH in categories
    assert ExerciseCategory.BALANCE in categories
    assert ExerciseCategory.STRETCHING in categories
    assert ExerciseCategory.WARM_UP in categories


def test_exercise_fields_integrity():
    for ex in EXERCISE_LIBRARY:
        assert ex.id.strip()
        assert ex.name.strip()
        assert isinstance(ex.category, ExerciseCategory)
        assert len(ex.target_areas) > 0
        assert ex.difficulty in ["Beginner", "Intermediate", "Advanced"]
        assert len(ex.instructions) >= 2
        assert ex.expected_purpose.strip()
        assert len(ex.precautions) >= 1
        assert len(ex.stop_conditions) >= 1
        assert isinstance(ex.evidence_type, EvidenceType)
        assert isinstance(ex.camera_tracking_available, bool)


def test_camera_trackable_exercises():
    trackables = get_camera_trackable_exercises()
    assert len(trackables) >= 3
    for ex in trackables:
        assert ex.camera_tracking_available is True
        assert ex.tracking_metric is not None


def test_get_exercise_by_id():
    ex = get_exercise_by_id("MOB-01")
    assert ex is not None
    assert ex.name == "Chair-Supported Knee Flexion"
    assert ex.category == ExerciseCategory.MOBILITY

    non_ex = get_exercise_by_id("NON-EXISTENT")
    assert non_ex is None


def test_no_cure_claims_in_library():
    cure_keywords = ["cure osteoarthritis", "reverse cartilage", "eliminates disease", "cure knee oa"]
    for ex in EXERCISE_LIBRARY:
        text = f"{ex.expected_purpose} {' '.join(ex.instructions)} {' '.join(ex.precautions)}".lower()
        for kw in cure_keywords:
            assert kw not in text, f"Found unsupported medical claim '{kw}' in exercise {ex.id}"
