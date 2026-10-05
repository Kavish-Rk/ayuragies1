from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


RiskCategory = Literal["low", "moderate", "high"]


class PatientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=160)
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = Field(default=None, max_length=40)
    occupation: str | None = Field(default=None, max_length=160)
    region: str | None = Field(default=None, max_length=160)
    state: str | None = Field(default=None, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    abha_id: str | None = Field(default=None, max_length=60)
    height_cm: float | None = Field(default=None, ge=50, le=250)
    weight_kg: float | None = Field(default=None, ge=20, le=300)
    bmi: float | None = Field(default=None, ge=10, le=80)
    assigned_station: str | None = Field(default=None, max_length=160)
    triage_status: str | None = Field(default="pending_survey", max_length=60)
    referral_status: str | None = Field(default="none", max_length=60)
    consent: bool = False


class PatientVitalsUpdate(BaseModel):
    height_cm: float | None = Field(default=None, ge=50, le=250)
    weight_kg: float | None = Field(default=None, ge=20, le=300)
    bmi: float | None = Field(default=None, ge=10, le=80)
    blood_pressure: str | None = Field(default=None, max_length=30)
    affected_joint: str | None = Field(default=None, max_length=120)


class QuestionnairePayload(BaseModel):
    patient_id: int | None = Field(default=None, ge=1)
    age: int = Field(..., ge=18, le=120)
    pain: int = Field(..., ge=0, le=10)
    stiffness: int = Field(..., ge=0, le=90)
    walking_difficulty: int = Field(..., ge=0, le=3)
    stairs_difficulty: int = Field(..., ge=0, le=3)
    squat_difficulty: int = Field(default=0, ge=0, le=3)
    previous_knee_injury: bool = False
    symptom_duration_weeks: int = Field(..., ge=0, le=520)
    workload: Literal["low", "moderate", "high"] = "low"
    tea_plucking: bool = False
    heavy_loads: bool = False
    deep_squatting: bool = False
    slope_walking: bool = False
    cold_damp: bool = False


class AnalysisRequest(BaseModel):
    patient_id: int | None = Field(default=None, ge=1)
    movement_category: RiskCategory
    questionnaire_category: RiskCategory


class DeviceConfig(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    device_type: str = Field(default="esp32-cam", max_length=60)
    ip: str | None = Field(default=None, max_length=255)
    status: str = Field(default="disconnected", max_length=40)
    config_json: str | None = Field(default=None, max_length=20_000)


class ScreeningCreate(BaseModel):
    patient_id: int | None = Field(default=None, ge=1)
    status: Literal["draft", "completed"] = "completed"
    questionnaire_score: int | None = Field(default=None, ge=0, le=40)
    questionnaire_category: str | None = Field(default=None, max_length=60)
    movement_category: str | None = Field(default=None, max_length=60)
    movement_confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    gait_metrics: dict | None = None
    vitals: dict | None = None
    clinical_symptoms: dict | None = None
    clinical_prediction: dict | None = None
    clinical_risk_category: str | None = Field(default=None, max_length=60)
    clinical_probability: float | None = Field(default=None, ge=0.0, le=1.0)
    xray_grade: str | None = Field(default=None, max_length=60)
    combined_result: str | None = Field(default=None, max_length=100)
    recommendation: str | None = Field(default=None, max_length=2_000)
    data_source: str | None = Field(default="backend_model", max_length=60)
    simulation_status: str | None = Field(default="real", max_length=60)
    movement_result: str | None = Field(default=None, max_length=20_000)
    questionnaire_result: str | None = Field(default=None, max_length=20_000)


class ClinicalPredictRequest(BaseModel):
    age: float = 60.0
    sex: int = 1  # 1=Male, 2=Female
    bmi: float = 26.5
    side: int = 1  # 1=Right, 2=Left
    bp_sys: float = 130.0
    bp_dias: float = 85.0
    pain: float = 5.0  # VAS 0-10
    stiffness: float = 30.0  # Mins
    gait_speed: float | None = 0.95  # m/s
    knee_flexion_deg: float | None = 135.0
    knee_deficit_deg: float | None = 10.0


# ═════════════════════ AYURAGIES AI GUIDANCE SCHEMAS ═════════════════════

class SymptomPayload(BaseModel):
    pain_level_0_10: int = Field(default=4, ge=0, le=10)
    morning_stiffness_mins: int = Field(default=20, ge=0, le=240)
    has_swelling: bool = False
    has_instability: bool = False
    previous_knee_injury: bool = False
    symptom_duration_weeks: int = Field(default=12, ge=0, le=520)
    walking_difficulty_0_3: int = Field(default=1, ge=0, le=3)
    stairs_difficulty_0_3: int = Field(default=1, ge=0, le=3)
    squat_difficulty_0_3: int = Field(default=1, ge=0, le=3)


class MovementPayload(BaseModel):
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
    raw_movement_metrics: dict | None = None


class DietPayload(BaseModel):
    diet_type: Literal["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain", "unknown"] = "vegetarian"
    allergies: list[str] = Field(default_factory=list)
    food_intolerances: list[str] = Field(default_factory=list)
    foods_to_avoid: list[str] = Field(default_factory=list)
    cultural_or_religious_notes: str | None = None
    allergy_info_available: bool = True


class GuidanceGenerateRequest(BaseModel):
    patient_id: str | int | None = Field(default="DEMO-001")
    screening_id: int | None = None
    name: str = "Demo Patient"
    age: int = Field(default=58, ge=0, le=130)
    sex: Literal["female", "male", "other"] = "female"
    bmi: float = Field(default=27.2, ge=10.0, le=80.0)
    activity_level: Literal["sedentary", "low", "moderate", "high"] = "low"
    occupation: str = "Community Worker"
    assessment_type: str = "functional_knee_assessment"
    is_demo: bool = False
    symptoms: SymptomPayload | None = None
    movement: MovementPayload | None = None
    diet: DietPayload | None = None


class YogaRecSchema(BaseModel):
    exercise_id: str
    name: str
    sanskrit_name: str | None = None
    category: str
    why_selected: str
    target_areas: list[str] = Field(default_factory=list)
    difficulty: str
    recommended_duration: str
    recommended_repetitions: str
    recommended_frequency: str
    instructions: list[str] = Field(default_factory=list)
    expected_purpose: str
    precautions: list[str] = Field(default_factory=list)
    stop_conditions: list[str] = Field(default_factory=list)
    camera_tracking_available: bool = False
    tracking_metric: str | None = None
    required_equipment: list[str] = Field(default_factory=list)
    evidence_type: str
    confidence_tier: str
    personalization_factors: list[str] = Field(default_factory=list)


class NutritionRecSchema(BaseModel):
    item_name: str
    category: str
    recommendation_level: str
    why_selected: str
    alternative_option: str | None = None
    target_nutrients_or_mechanism: str
    precautions_or_notes: str | None = None
    personalization_reason: str
    evidence_type: str
    confidence_tier: str
    allergens_flagged: list[str] = Field(default_factory=list)


class SafetyNoticeSchema(BaseModel):
    severity: Literal["low", "moderate", "high", "critical"]
    title: str
    message: str
    trigger_rule: str
    consult_professional: bool = True
    filtered_exercises: list[str] = Field(default_factory=list)
    filtered_foods: list[str] = Field(default_factory=list)


class GuidanceSaveRequest(BaseModel):
    patient_id: int | None = None
    screening_id: int | None = None
    session_code: str
    is_demo: bool = False
    data_provenance: str | None = None
    overall_safety_status: str = "safe"
    clinical_summary: str | None = None
    safety_notices: list[SafetyNoticeSchema] = Field(default_factory=list)
    allergy_warning: str | None = None
    patient_context: dict | None = None
    yoga_recommendations: list[YogaRecSchema] = Field(default_factory=list)
    nutrition_recommendations: list[NutritionRecSchema] = Field(default_factory=list)


