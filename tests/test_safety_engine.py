"""Unit tests for Safety & Contraindication Engine."""
import pytest
from oa_screening.guidance.models import (
    DietPreferences,
    MovementAssessmentData,
    PatientAssessmentContext,
    SymptomContext,
)
from oa_screening.guidance.safety_engine import evaluate_safety


def test_safety_normal_patient():
    ctx = PatientAssessmentContext(
        patient_id="PAT-01",
        age=55,
        symptoms=SymptomContext(pain_level_0_10=3, morning_stiffness_mins=15, has_swelling=False),
        movement=MovementAssessmentData(knee_flexion_deg=125.0, limp_asymmetry_deg=4.0),
        diet=DietPreferences(diet_type="vegetarian", allergies=[]),
    )
    result = evaluate_safety(ctx)
    assert result.overall_status == "safe"
    assert len(result.notices) == 0
    assert len(result.filtered_exercise_ids) == 0


def test_safety_high_pain_triggers_filtration():
    ctx = PatientAssessmentContext(
        patient_id="PAT-HIGH-PAIN",
        symptoms=SymptomContext(pain_level_0_10=8, morning_stiffness_mins=30),
    )
    result = evaluate_safety(ctx)
    assert result.overall_status == "restricted"
    assert any(n.trigger_rule == "RULE_PAIN_HIGH_VAS_GE_7" for n in result.notices)
    # Deep squats and single leg balance should be filtered
    assert "YOGA-01" in result.filtered_exercise_ids  # Chair pose
    assert "STR-02" in result.filtered_exercise_ids   # Wall mini-squat
    assert "BAL-02" in result.filtered_exercise_ids   # Single leg stance


def test_safety_acute_swelling():
    ctx = PatientAssessmentContext(
        patient_id="PAT-SWELLING",
        symptoms=SymptomContext(pain_level_0_10=4, has_swelling=True),
    )
    result = evaluate_safety(ctx)
    assert result.overall_status == "restricted"
    assert any(n.trigger_rule == "RULE_ACUTE_SWELLING" for n in result.notices)
    assert "STR-02" in result.filtered_exercise_ids


def test_safety_instability_and_recent_injury():
    ctx = PatientAssessmentContext(
        patient_id="PAT-INSTABILITY",
        symptoms=SymptomContext(has_instability=True, previous_knee_injury=True, symptom_duration_weeks=4),
    )
    result = evaluate_safety(ctx)
    assert any(n.trigger_rule == "RULE_INSTABILITY_OR_RECENT_INJURY" for n in result.notices)
    assert "BAL-02" in result.filtered_exercise_ids  # Unsupported single-leg balance filtered


def test_safety_allergy_filtering():
    ctx = PatientAssessmentContext(
        patient_id="PAT-ALLERGY",
        diet=DietPreferences(diet_type="non_vegetarian", allergies=["peanut", "shellfish"]),
    )
    result = evaluate_safety(ctx)
    assert "NUT-A01" in result.filtered_food_ids  # Peanut food item
    assert "NUT-A03" in result.filtered_food_ids  # Shellfish item


def test_safety_vegetarian_filtering():
    ctx = PatientAssessmentContext(
        patient_id="PAT-VEG",
        diet=DietPreferences(diet_type="vegetarian", allergies=[]),
    )
    result = evaluate_safety(ctx)
    assert "NUT-A03" in result.filtered_food_ids  # Shellfish filtered for vegetarian


def test_safety_missing_allergy_data_handled():
    ctx = PatientAssessmentContext(
        patient_id="PAT-NO-ALLERGY-DATA",
        diet=DietPreferences(diet_type="unknown", allergies=[], allergy_info_available=False),
    )
    result = evaluate_safety(ctx)
    assert result.allergy_warning is not None
    assert "Allergy information unavailable" in result.allergy_warning
    assert any(n.trigger_rule == "RULE_ALLERGY_DATA_UNAVAILABLE" for n in result.notices)
