"""Unit tests for AYURAGIES Recommendation Intelligence Engine."""
import pytest
from oa_screening.guidance.models import (
    DietPreferences,
    EvidenceType,
    ExerciseCategory,
    MovementAssessmentData,
    PatientAssessmentContext,
    RelevanceTier,
    SymptomContext,
)
from oa_screening.guidance.recommendation_engine import AyuragiesGuidanceEngine


def test_recommendation_generation_structure():
    engine = AyuragiesGuidanceEngine()
    ctx = PatientAssessmentContext(
        patient_id="DEMO-001",
        name="Demo Patient",
        age=58,
        sex="female",
        bmi=27.2,
        symptoms=SymptomContext(pain_level_0_10=4, morning_stiffness_mins=20),
        movement=MovementAssessmentData(knee_flexion_deg=118.0, limp_asymmetry_deg=6.0),
        diet=DietPreferences(diet_type="vegetarian", allergies=["peanut"]),
    )
    output = engine.generate_guidance(ctx)

    assert output.session_id.startswith("AYUR-GUIDE-")
    assert output.patient_id == "DEMO-001"
    assert len(output.yoga_recommendations) >= 4
    assert len(output.nutrition_recommendations) >= 5
    assert output.overall_safety_status in ["safe", "caution_applied", "restricted"]


def test_yoga_recommendation_fields():
    engine = AyuragiesGuidanceEngine()
    ctx = PatientAssessmentContext()
    output = engine.generate_guidance(ctx)

    for rec in output.yoga_recommendations:
        assert rec.exercise_id
        assert rec.name
        assert rec.category
        assert rec.why_selected
        assert len(rec.target_areas) > 0
        assert rec.difficulty in ["Beginner", "Intermediate", "Advanced"]
        assert rec.recommended_duration
        assert len(rec.instructions) >= 2
        assert rec.expected_purpose
        assert len(rec.precautions) >= 1
        assert len(rec.stop_conditions) >= 1
        assert rec.confidence_tier in [t.value for t in RelevanceTier]
        assert rec.evidence_type in [e.value for e in EvidenceType]


def test_high_pain_personalization():
    engine = AyuragiesGuidanceEngine()
    ctx = PatientAssessmentContext(
        patient_id="HIGH-PAIN-01",
        symptoms=SymptomContext(pain_level_0_10=8, morning_stiffness_mins=45),
    )
    output = engine.generate_guidance(ctx)

    # Isometric and gentle mobility should be favored
    ex_ids = [r.exercise_id for r in output.yoga_recommendations]
    assert "STR-03" in ex_ids or "MOB-03" in ex_ids or "WU-01" in ex_ids
    # Wall mini squats and chair pose should NOT be present
    assert "STR-02" not in ex_ids
    assert "YOGA-01" not in ex_ids


def test_nutrition_allergen_personalization():
    engine = AyuragiesGuidanceEngine()
    ctx = PatientAssessmentContext(
        diet=DietPreferences(diet_type="vegetarian", allergies=["peanut"]),
    )
    output = engine.generate_guidance(ctx)

    # Prioritize items should NOT recommend peanut butter directly without alternative
    avoid_items = [n for n in output.nutrition_recommendations if n.category == "AVOID / CHECK FIRST"]
    assert any("peanut" in n.item_name.lower() or "peanut" in " ".join(n.allergens_flagged).lower() for n in avoid_items)


def test_no_fake_confidence_percentages():
    engine = AyuragiesGuidanceEngine()
    ctx = PatientAssessmentContext()
    output = engine.generate_guidance(ctx)

    for r in output.yoga_recommendations:
        # Confidence must be qualitative
        assert not any(c in r.confidence_tier for c in ["98.48%", "97%", "99%", "%"])
        assert r.confidence_tier in ["HIGH RELEVANCE", "MODERATE RELEVANCE", "LIMITED PERSONALIZATION"]
