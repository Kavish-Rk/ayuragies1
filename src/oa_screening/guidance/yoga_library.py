"""Yoga & Movement Library module for AYURAGIES AI Guidance.
Re-exports the exercise library and helpers.
"""
from .exercise_library import (
    EXERCISE_LIBRARY,
    get_camera_trackable_exercises,
    get_exercise_by_id,
    get_exercises_by_category,
    get_exercises_by_difficulty,
)

__all__ = [
    "EXERCISE_LIBRARY",
    "get_exercise_by_id",
    "get_exercises_by_category",
    "get_exercises_by_difficulty",
    "get_camera_trackable_exercises",
]
