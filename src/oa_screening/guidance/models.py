"""Data models and type definitions for the AYURAGIES AI Guidance System.
Supports personalized Yoga/Movement, Nutrition, Safety contraindications,
explanations, and offline persistence.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Literal


class ExerciseCategory(str, Enum):
    YOGA = "Yoga"
    MOBILITY = "Mobility"
    STRENGTH = "Strength / Functional Exercise"
    BALANCE = "Balance"
    STRETCHING = "Stretching"
    WARM_UP = "Warm-up"


class NutritionCategory(str, Enum):
    PRIORITIZE = "PRIORITIZE"
    LIMIT = "LIMIT"
    AVOID_OR_CHECK = "AVOID / CHECK FIRST"


class EvidenceType(str, Enum):
    GENERAL_HEALTH = "GENERAL HEALTH GUIDANCE"
    REHABILITATION = "REHABILITATION GUIDANCE"
    RESEARCH_LITERATURE = "RESEARCH LITERATURE"
    CLINICAL_GUIDELINE = "CLINICAL NUTRITION GUIDELINE"
    PROJECT_RULE = "PROJECT RULE"
    AI_EXPLANATION = "AI-GENERATED EXPLANATION"


class RelevanceTier(str, Enum):
    HIGH = "HIGH RELEVANCE"
    MODERATE = "MODERATE RELEVANCE"
    LIMITED = "LIMITED PERSONALIZATION"


@dataclass
class MovementAssessmentData:
    stand_completed: bool = True
    stand_repetitions: int = 1
    sit_to_stand_completed: bool = True
    sit_to_stand_repetitions: int = 5
    sit_to_stand_knee_angle: float | None = None
    squat_completed: bool = True
    squat_repetitions: int = 5
    squat_knee_angle: float | None = None
    lunge_completed: bool = False
    lunge_repetitions: int = 0
    knee_raise_completed: bool = True
    knee_raise_repetitions: int = 5
    knee_flexion_deg: float | None = None
    knee_deficit_deg: float = 10.0
    gait_speed_mps: float = 0.95
    cadence_spm: float = 98.0
    limp_asymmetry_deg: float = 6.5
    raw_movement_metrics: dict[str, Any] = field(default_factory=dict)


@dataclass
class SymptomContext:
    pain_level_0_10: int = 4
    morning_stiffness_mins: int = 20
    has_swelling: bool = False
    has_instability: bool = False
    previous_knee_injury: bool = False
    symptom_duration_weeks: int = 12
    walking_difficulty_0_3: int = 1
    stairs_difficulty_0_3: int = 1
    squat_difficulty_0_3: int = 1


@dataclass
class DietPreferences:
    diet_type: Literal["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain", "unknown"] = "vegetarian"
    allergies: list[str] = field(default_factory=list)  # e.g., ["peanut", "milk", "shellfish"]
    food_intolerances: list[str] = field(default_factory=list)  # e.g., ["lactose", "gluten"]
    foods_to_avoid: list[str] = field(default_factory=list)
    cultural_or_religious_notes: str | None = None
    allergy_info_available: bool = True


@dataclass
class PatientAssessmentContext:
    patient_id: str = "DEMO-001"
    name: str = "Demo Patient"
    age: int = 58
    sex: Literal["female", "male", "other"] = "female"
    bmi: float = 27.2
    activity_level: Literal["sedentary", "low", "moderate", "high"] = "low"
    occupation: str = "Community Worker"
    assessment_type: str = "functional_knee_assessment"
    is_demo: bool = False
    symptoms: SymptomContext = field(default_factory=SymptomContext)
    movement: MovementAssessmentData = field(default_factory=MovementAssessmentData)
    diet: DietPreferences = field(default_factory=DietPreferences)


@dataclass
class SafetyNotice:
    severity: Literal["low", "moderate", "high", "critical"]
    title: str
    message: str
    trigger_rule: str
    consult_professional: bool = True
    filtered_exercises: list[str] = field(default_factory=list)
    filtered_foods: list[str] = field(default_factory=list)


@dataclass
class YogaExercise:
    id: str
    name: str
    sanskrit_name: str | None
    category: ExerciseCategory
    target_areas: list[str]
    difficulty: Literal["Beginner", "Intermediate", "Advanced"]
    recommended_duration: str
    recommended_repetitions: str
    recommended_frequency: str
    instructions: list[str]
    expected_purpose: str
    precautions: list[str]
    stop_conditions: list[str]
    indications: list[str]
    contraindications: list[str]
    camera_tracking_available: bool
    tracking_metric: str | None
    required_equipment: list[str]
    evidence_type: EvidenceType = EvidenceType.REHABILITATION


@dataclass
class YogaRecommendation:
    exercise_id: str
    name: str
    sanskrit_name: str | None
    category: str
    why_selected: str
    target_areas: list[str]
    difficulty: str
    recommended_duration: str
    recommended_repetitions: str
    recommended_frequency: str
    instructions: list[str]
    expected_purpose: str
    precautions: list[str]
    stop_conditions: list[str]
    camera_tracking_available: bool
    tracking_metric: str | None
    required_equipment: list[str]
    evidence_type: str
    confidence_tier: str
    personalization_factors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class NutritionRecommendation:
    item_name: str
    category: str  # PRIORITIZE, LIMIT, AVOID / CHECK FIRST
    recommendation_level: str  # e.g., "High Priority", "Moderation", "Caution / Restricted"
    why_selected: str
    alternative_option: str | None
    target_nutrients_or_mechanism: str
    precautions_or_notes: str | None
    personalization_reason: str
    evidence_type: str
    confidence_tier: str
    allergens_flagged: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class GuidanceSessionOutput:
    session_id: str
    patient_id: str
    created_at: str
    is_demo: bool
    data_provenance: str
    overall_safety_status: Literal["safe", "caution_applied", "restricted"]
    safety_notices: list[SafetyNotice]
    clinical_summary: str
    yoga_recommendations: list[YogaRecommendation]
    nutrition_recommendations: list[NutritionRecommendation]
    allergy_warning: str | None = None
    offline_generated: bool = True

    def to_dict(self) -> dict[str, Any]:
        return {
            "session_id": self.session_id,
            "patient_id": self.patient_id,
            "created_at": self.created_at,
            "is_demo": self.is_demo,
            "data_provenance": self.data_provenance,
            "overall_safety_status": self.overall_safety_status,
            "safety_notices": [asdict(s) for s in self.safety_notices],
            "clinical_summary": self.clinical_summary,
            "yoga_recommendations": [r.to_dict() for r in self.yoga_recommendations],
            "nutrition_recommendations": [n.to_dict() for n in self.nutrition_recommendations],
            "allergy_warning": self.allergy_warning,
            "offline_generated": self.offline_generated,
        }
