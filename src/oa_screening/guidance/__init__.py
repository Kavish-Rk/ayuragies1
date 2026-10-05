"""AYURAGIES AI Yoga & Nutrition Intelligence Package."""
from .exercise_library import (
    EXERCISE_LIBRARY,
    get_camera_trackable_exercises,
    get_exercise_by_id,
    get_exercises_by_category,
    get_exercises_by_difficulty,
)
from .models import (
    DietPreferences,
    EvidenceType,
    ExerciseCategory,
    GuidanceSessionOutput,
    MovementAssessmentData,
    NutritionCategory,
    NutritionRecommendation,
    PatientAssessmentContext,
    RelevanceTier,
    SafetyNotice,
    SymptomContext,
    YogaExercise,
    YogaRecommendation,
)
from .nutrition_library import (
    NUTRITION_LIBRARY,
    NutritionItem,
    get_nutrition_item_by_id,
    get_nutrition_items_by_category,
)
from .recommendation_engine import AyuragiesGuidanceEngine, DEFAULT_GUIDANCE_ENGINE
from .safety_engine import evaluate_safety, validate_exercise_candidate, validate_nutrition_candidate
from .yoga_library import EXERCISE_LIBRARY as YOGA_LIBRARY

__all__ = [
    "ExerciseCategory",
    "NutritionCategory",
    "EvidenceType",
    "RelevanceTier",
    "MovementAssessmentData",
    "SymptomContext",
    "DietPreferences",
    "PatientAssessmentContext",
    "SafetyNotice",
    "YogaExercise",
    "YogaRecommendation",
    "NutritionRecommendation",
    "GuidanceSessionOutput",
    "EXERCISE_LIBRARY",
    "YOGA_LIBRARY",
    "get_exercise_by_id",
    "get_exercises_by_category",
    "get_exercises_by_difficulty",
    "get_camera_trackable_exercises",
    "NutritionItem",
    "NUTRITION_LIBRARY",
    "get_nutrition_items_by_category",
    "get_nutrition_item_by_id",
    "evaluate_safety",
    "validate_exercise_candidate",
    "validate_nutrition_candidate",
    "AyuragiesGuidanceEngine",
    "DEFAULT_GUIDANCE_ENGINE",
]
