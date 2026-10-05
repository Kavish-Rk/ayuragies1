"""Safety & Contraindication Engine for AYURAGIES AI Guidance.
Mandatory pre- and post-filtering layer that protects patients by
detecting clinical warning signs, evaluating contraindications, filtering
inappropriate exercises and foods, and generating transparent safety notices.
"""
from __future__ import annotations

from typing import Any

from .exercise_library import EXERCISE_LIBRARY
from .models import (
    DietPreferences,
    MovementAssessmentData,
    PatientAssessmentContext,
    SafetyNotice,
    SymptomContext,
    YogaExercise,
)
from .nutrition_library import NUTRITION_LIBRARY, NutritionItem


class SafetyEvaluationResult:
    def __init__(
        self,
        overall_status: str,  # "safe", "caution_applied", "restricted"
        notices: list[SafetyNotice],
        filtered_exercise_ids: set[str],
        filtered_food_ids: set[str],
        allergy_warning: str | None,
        safety_explanations: list[str],
    ):
        self.overall_status = overall_status
        self.notices = notices
        self.filtered_exercise_ids = filtered_exercise_ids
        self.filtered_food_ids = filtered_food_ids
        self.allergy_warning = allergy_warning
        self.safety_explanations = safety_explanations


def evaluate_safety(context: PatientAssessmentContext) -> SafetyEvaluationResult:
    """Evaluate patient assessment data against clinical safety rules and contraindications.
    Returns filtered exercise IDs, filtered food IDs, safety notices, and overall status.
    """
    notices: list[SafetyNotice] = []
    filtered_exercise_ids: set[str] = set()
    filtered_food_ids: set[str] = set()
    safety_explanations: list[str] = []
    allergy_warning: str | None = None

    symptoms = context.symptoms or SymptomContext()
    movement = context.movement or MovementAssessmentData()
    diet = context.diet or DietPreferences()

    is_high_pain = symptoms.pain_level_0_10 >= 7
    is_moderate_pain = 4 <= symptoms.pain_level_0_10 < 7
    has_acute_swelling = symptoms.has_swelling
    has_prolonged_stiffness = symptoms.morning_stiffness_mins >= 45
    has_instability = symptoms.has_instability
    has_recent_injury = symptoms.previous_knee_injury and symptoms.symptom_duration_weeks <= 6
    is_severe_asymmetry = movement.limp_asymmetry_deg >= 10.0
    is_elevated_bmi = context.bmi >= 30.0
    is_restricted_flexion = (movement.knee_flexion_deg is not None and movement.knee_flexion_deg < 95.0) or movement.knee_deficit_deg >= 15.0

    # ──────────────── RULE 1: HIGH ACUTE PAIN (VAS >= 7) ────────────────
    if is_high_pain:
        filtered_ids = {"YOGA-01", "STR-01", "STR-02", "YOGA-02", "BAL-02"}
        filtered_exercise_ids.update(filtered_ids)
        notices.append(
            SafetyNotice(
                severity="high",
                title="High Reported Pain Protocol Active",
                message="Patient reported high knee pain (VAS >= 7/10). Weight-bearing squats and single-leg balance are filtered. Emphasizing non-weightbearing isometric and supine range-of-motion movements only.",
                trigger_rule="RULE_PAIN_HIGH_VAS_GE_7",
                consult_professional=True,
                filtered_exercises=list(filtered_ids),
            )
        )
        safety_explanations.append(
            f"High pain score ({symptoms.pain_level_0_10}/10) triggered exclusion of deep squats and unsupported balance postures."
        )

    # ──────────────── RULE 2: ACUTE SWELLING OR EFFUSION ────────────────
    if has_acute_swelling:
        filtered_ids = {"YOGA-01", "STR-02", "STR-01", "STR-04"}
        filtered_exercise_ids.update(filtered_ids)
        notices.append(
            SafetyNotice(
                severity="high",
                title="Acute Joint Swelling Detected",
                message="Reported knee swelling indicates active inflammatory state or joint effusion. Deep resistive knee flexion and aggressive quadriceps stretching are filtered. Rest, elevation, and gentle isometrics recommended.",
                trigger_rule="RULE_ACUTE_SWELLING",
                consult_professional=True,
                filtered_exercises=list(filtered_ids),
            )
        )
        safety_explanations.append("Reported joint swelling excluded resistive wall squats and deep knee loading.")

    # ──────────────── RULE 3: JOINT INSTABILITY OR RECENT INJURY ────────────────
    if has_instability or has_recent_injury:
        filtered_ids = {"YOGA-02", "BAL-02", "YOGA-01"}
        filtered_exercise_ids.update(filtered_ids)
        notices.append(
            SafetyNotice(
                severity="moderate",
                title="Joint Instability / Recent Injury Caution",
                message="Knee instability or recent injury within 6 weeks requires elimination of unsupported single-leg postures. Always maintain hand support on a stable wall or chair.",
                trigger_rule="RULE_INSTABILITY_OR_RECENT_INJURY",
                consult_professional=True,
                filtered_exercises=list(filtered_ids),
            )
        )
        safety_explanations.append("Reported knee instability excluded single-leg balance and tree pose.")

    # ──────────────── RULE 4: SEVERE RESTRICTION IN KNEE FLEXION ────────────────
    if is_restricted_flexion:
        filtered_ids = {"STR-02", "YOGA-01", "STR-04"}
        filtered_exercise_ids.update(filtered_ids)
        safety_explanations.append(
            f"Reduced knee flexion range ({movement.knee_flexion_deg:.1f}°) filtered deep knee flexion postures."
        )

    # ──────────────── RULE 5: SEVERE ASYMMETRY / ANTALGIC LIMP ────────────────
    if is_severe_asymmetry:
        safety_explanations.append(
            f"Antalgic gait asymmetry ({movement.limp_asymmetry_deg:.1f}°) requires bilateral seated and chair-supported symmetry restoration drills."
        )

    # ──────────────── RULE 6: ELEVATED BMI (>= 30.0) ────────────────
    if is_elevated_bmi:
        safety_explanations.append(
            f"Elevated BMI ({context.bmi:.1f} kg/m²) prioritizes low-impact chair-seated and supine exercises over floor-level high-impact squats."
        )

    # ──────────────── RULE 7: NUTRITION ALLERGEN & RESTRICTION FILTER ────────────────
    patient_allergies = [a.lower().strip() for a in (diet.allergies or [])]
    patient_intolerances = [i.lower().strip() for i in (diet.food_intolerances or [])]
    all_avoidances = set(patient_allergies + patient_intolerances + [f.lower().strip() for f in (diet.foods_to_avoid or [])])

    if not diet.allergy_info_available:
        allergy_warning = "Allergy information unavailable. Check food ingredients and verify individual tolerance before consumption."
        notices.append(
            SafetyNotice(
                severity="low",
                title="Allergy Documentation Missing",
                message="Patient allergy status is not documented in intake. Core food guidance provided with conservative preparation advice. Please verify food allergies before dietary changes.",
                trigger_rule="RULE_ALLERGY_DATA_UNAVAILABLE",
                consult_professional=False,
            )
        )
    else:
        # Check against nutrition library
        for item in NUTRITION_LIBRARY:
            # Check allergens
            item_allergens = [a.lower().strip() for a in item.common_allergens]
            matched_allergens = [a for a in item_allergens if a in all_avoidances]
            if matched_allergens:
                filtered_food_ids.add(item.id)
                safety_explanations.append(f"Excluded '{item.name}' due to documented allergy/intolerance: {', '.join(matched_allergens)}.")

            # Check diet type compatibility (e.g. vegetarian vs non_vegetarian)
            if diet.diet_type in ["vegetarian", "vegan", "jain", "eggetarian"]:
                if item.dietary_tags and "vegetarian" not in item.dietary_tags and "vegan" not in item.dietary_tags:
                    if diet.diet_type != "eggetarian" or "eggetarian" not in item.dietary_tags:
                        filtered_food_ids.add(item.id)
                        safety_explanations.append(f"Filtered '{item.name}' to respect patient's {diet.diet_type} diet.")

            # Check vegan compatibility
            if diet.diet_type == "vegan":
                if "milk" in item.common_allergens or "dairy" in item.name.lower():
                    filtered_food_ids.add(item.id)

    # Determine overall status
    if is_high_pain or has_acute_swelling:
        overall_status = "restricted"
    elif notices or is_moderate_pain or has_prolonged_stiffness or is_severe_asymmetry:
        overall_status = "caution_applied"
    else:
        overall_status = "safe"

    return SafetyEvaluationResult(
        overall_status=overall_status,
        notices=notices,
        filtered_exercise_ids=filtered_exercise_ids,
        filtered_food_ids=filtered_food_ids,
        allergy_warning=allergy_warning,
        safety_explanations=safety_explanations,
    )


def validate_exercise_candidate(exercise: YogaExercise, safety_result: SafetyEvaluationResult) -> bool:
    """Check if an exercise passes the safety contraindication filter."""
    if exercise.id in safety_result.filtered_exercise_ids:
        return False
    return True


def validate_nutrition_candidate(item: NutritionItem, safety_result: SafetyEvaluationResult) -> bool:
    """Check if a nutrition item passes the safety and allergy filter."""
    if item.id in safety_result.filtered_food_ids:
        return False
    return True
