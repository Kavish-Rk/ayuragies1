"""AYURAGIES AI Recommendation Engine for Yoga / Movement and Nutrition Intelligence.
Combines clinical safety rules, biomechanical assessment data, dietary preferences,
and deterministic local explanation generation. Designed for 100% offline-first operation.
"""
from __future__ import annotations

from datetime import datetime, timezone
import secrets
from typing import Any

from .exercise_library import EXERCISE_LIBRARY
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
    SymptomContext,
    YogaExercise,
    YogaRecommendation,
)
from .nutrition_library import NUTRITION_LIBRARY, NutritionItem
from .safety_engine import evaluate_safety, validate_exercise_candidate, validate_nutrition_candidate


class AyuragiesGuidanceEngine:
    """Core recommendation intelligence engine."""

    def __init__(self, use_online_enhancer: bool = False):
        self.use_online_enhancer = use_online_enhancer

    def generate_guidance(self, context: PatientAssessmentContext) -> GuidanceSessionOutput:
        """Generate personalized Yoga & Nutrition guidance grounded in patient assessment data."""
        session_id = f"AYUR-GUIDE-{secrets.token_hex(6).upper()}"
        created_at = datetime.now(timezone.utc).isoformat()

        # Step 1: Pre-recommendation Safety Evaluation
        safety_result = evaluate_safety(context)

        # Step 2: Biomechanical & Symptom Feature Extraction
        symptoms = context.symptoms or SymptomContext()
        movement = context.movement or MovementAssessmentData()
        diet = context.diet or DietPreferences()

        # Step 3: Select and Personalize Yoga & Movement Exercises
        yoga_recs = self._select_and_personalize_exercises(context, safety_result)

        # Step 4: Select and Personalize Nutrition Recommendations
        nutrition_recs = self._select_and_personalize_nutrition(context, safety_result)

        # Step 5: Clinical Summary Formulation
        clinical_summary = self._generate_clinical_summary(context, safety_result, len(yoga_recs), len(nutrition_recs))

        # Step 6: Final Output Validation
        validated_yoga = [r for r in yoga_recs if r.exercise_id not in safety_result.filtered_exercise_ids]
        validated_nutrition = [
            n for n in nutrition_recs
            if n.category == NutritionCategory.AVOID_OR_CHECK.value or not any(a in (diet.allergies or []) for a in n.allergens_flagged)
        ]

        data_provenance = (
            "DEMONSTRATION SYNTHETIC DATA — Research Prototype Benchmark"
            if context.is_demo
            else "CLINICAL TRIAGE ASSESSMENT — Multimodal Sensor & Survey Data"
        )

        return GuidanceSessionOutput(
            session_id=session_id,
            patient_id=context.patient_id,
            created_at=created_at,
            is_demo=context.is_demo,
            data_provenance=data_provenance,
            overall_safety_status=safety_result.overall_status,  # type: ignore[arg-type]
            safety_notices=safety_result.notices,
            clinical_summary=clinical_summary,
            yoga_recommendations=validated_yoga,
            nutrition_recommendations=validated_nutrition,
            allergy_warning=safety_result.allergy_warning,
            offline_generated=True,
        )

    def _select_and_personalize_exercises(
        self,
        context: PatientAssessmentContext,
        safety_result: Any,
    ) -> list[YogaRecommendation]:
        """Select exercises across categories and personalize instructions and explanations."""
        selected_recs: list[YogaRecommendation] = []
        symptoms = context.symptoms or SymptomContext()
        movement = context.movement or MovementAssessmentData()

        # Candidate pool
        available_exercises = [
            ex for ex in EXERCISE_LIBRARY
            if validate_exercise_candidate(ex, safety_result)
        ]

        # Scoring & Selection heuristic
        scored_candidates: list[tuple[float, YogaExercise, list[str], str, str]] = []

        for ex in available_exercises:
            score = 10.0
            reasons: list[str] = []
            personalization_factors: list[str] = []
            tier = RelevanceTier.MODERATE.value

            # 1. Pain alignment
            if symptoms.pain_level_0_10 >= 7:
                if ex.id in ["STR-03", "MOB-03", "WU-01"]:
                    score += 15.0
                    reasons.append(f"Safe non-weightbearing movement calibrated for elevated pain score ({symptoms.pain_level_0_10}/10).")
                    personalization_factors.append("High Pain Management")
                    tier = RelevanceTier.HIGH.value
                elif ex.category in [ExerciseCategory.STRENGTH, ExerciseCategory.BALANCE]:
                    score -= 8.0
            elif symptoms.pain_level_0_10 >= 4:
                if ex.id in ["MOB-01", "STR-01", "YOGA-01", "WU-02"]:
                    score += 8.0
                    reasons.append(f"Low-impact movement option matching moderate pain level ({symptoms.pain_level_0_10}/10).")
                    personalization_factors.append("Moderate Load Tolerance")

            # 2. Stiffness alignment
            if symptoms.morning_stiffness_mins >= 30:
                if ex.category in [ExerciseCategory.MOBILITY, ExerciseCategory.WARM_UP, ExerciseCategory.STRETCHING]:
                    score += 7.0
                    reasons.append(f"Selected to relieve morning joint stiffness reported at {symptoms.morning_stiffness_mins} minutes.")
                    personalization_factors.append("Stiffness Alleviation")
                    tier = RelevanceTier.HIGH.value

            # 3. Knee Flexion & Range of Motion Deficit
            if (movement.knee_flexion_deg is not None and movement.knee_flexion_deg < 115.0) or (movement.knee_deficit_deg is not None and movement.knee_deficit_deg >= 8.0):
                if ex.id in ["MOB-01", "MOB-02", "MOB-03"]:
                    score += 12.0
                    flexion_str = f"{movement.knee_flexion_deg:.1f}°" if movement.knee_flexion_deg is not None else "measured"
                    deficit_str = f"{movement.knee_deficit_deg:.1f}°" if movement.knee_deficit_deg is not None else "significant"
                    reasons.append(f"Targeted to address knee flexion limitation ({flexion_str}) and {deficit_str} extension deficit.")
                    personalization_factors.append("ROM Restoration")
                    tier = RelevanceTier.HIGH.value

            # 4. Asymmetry / Antalgic Limp
            if movement.limp_asymmetry_deg >= 6.0:
                if ex.category in [ExerciseCategory.BALANCE, ExerciseCategory.MOBILITY, ExerciseCategory.STRENGTH]:
                    score += 6.0
                    reasons.append(f"Supports bilateral joint symmetry to mitigate observed {movement.limp_asymmetry_deg:.1f}° kinematic asymmetry.")
                    personalization_factors.append("Gait Symmetry Support")

            # 5. Sit-to-Stand / Functional Capacity
            if movement.sit_to_stand_completed and movement.sit_to_stand_repetitions < 6:
                if ex.id in ["STR-01", "STR-03", "YOGA-01"]:
                    score += 9.0
                    reasons.append(f"Targets quadriceps functional endurance following sit-to-stand assessment ({movement.sit_to_stand_repetitions} reps).")
                    personalization_factors.append("Functional Muscle Strength")
                    tier = RelevanceTier.HIGH.value

            # 6. Low Activity Level / Sedentary
            if context.activity_level in ["sedentary", "low"]:
                if ex.difficulty == "Beginner":
                    score += 5.0
                    personalization_factors.append("Gentle Progression for Low Baseline Activity")

            # Combine rationale
            if not reasons:
                why_selected = f"Selected as a foundational {ex.category.value.lower()} exercise to support overall joint mobility and peri-articular muscle health."
            else:
                why_selected = " ".join(reasons)

            scored_candidates.append((score, ex, personalization_factors, why_selected, tier))

        # Sort candidates by relevance score
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        # Ensure balanced representation across categories
        category_counts: dict[ExerciseCategory, int] = {cat: 0 for cat in ExerciseCategory}
        max_per_category = 2

        for score, ex, factors, why, tier in scored_candidates:
            if category_counts[ex.category] < max_per_category and len(selected_recs) < 6:
                category_counts[ex.category] += 1

                # Tailor duration/frequency for age and pain
                duration = ex.recommended_duration
                frequency = ex.recommended_frequency
                if context.age >= 65 or symptoms.pain_level_0_10 >= 6:
                    duration = "5–8 minutes (with rest intervals as needed)"
                    frequency = "3–4 sessions per week (gradual progression)"

                selected_recs.append(
                    YogaRecommendation(
                        exercise_id=ex.id,
                        name=ex.name,
                        sanskrit_name=ex.sanskrit_name,
                        category=ex.category.value,
                        why_selected=why,
                        target_areas=ex.target_areas,
                        difficulty=ex.difficulty,
                        recommended_duration=duration,
                        recommended_repetitions=ex.recommended_repetitions,
                        recommended_frequency=frequency,
                        instructions=ex.instructions,
                        expected_purpose=ex.expected_purpose,
                        precautions=ex.precautions,
                        stop_conditions=ex.stop_conditions,
                        camera_tracking_available=ex.camera_tracking_available,
                        tracking_metric=ex.tracking_metric,
                        required_equipment=ex.required_equipment,
                        evidence_type=ex.evidence_type.value,
                        confidence_tier=tier,
                        personalization_factors=factors,
                    )
                )

        return selected_recs

    def _select_and_personalize_nutrition(
        self,
        context: PatientAssessmentContext,
        safety_result: Any,
    ) -> list[NutritionRecommendation]:
        """Generate structured PRIORITIZE, LIMIT, and AVOID / CHECK FIRST recommendations."""
        nutrition_recs: list[NutritionRecommendation] = []
        diet = context.diet or DietPreferences()
        patient_allergies = [a.lower().strip() for a in (diet.allergies or [])]
        patient_intolerances = [i.lower().strip() for i in (diet.food_intolerances or [])]

        # ─── 1. PRIORITIZE ITEMS ───
        prioritize_items = [
            item for item in NUTRITION_LIBRARY
            if item.category == NutritionCategory.PRIORITIZE and validate_nutrition_candidate(item, safety_result)
        ]

        for item in prioritize_items[:5]:
            personalization_reasons = []
            tier = RelevanceTier.HIGH.value

            # Tailor alternative based on diet type
            alt = item.default_alternative
            if diet.diet_type == "vegan":
                if "Dairy" in item.name or "dairy" in str(alt).lower():
                    alt = "Fortified plant milk (soy/almond/oat), tofu, sesame seeds, and green leafy vegetables."
                    personalization_reasons.append("100% Plant-Based Alternative")
            elif diet.diet_type in ["vegetarian", "jain", "eggetarian"]:
                if "Marine" in item.name or "fish" in str(alt).lower():
                    alt = "Ground flaxseeds, chia seeds, and walnuts for plant-derived omega-3 ALA."
                    personalization_reasons.append("Vegetarian Omega-3 Source")

            if context.bmi >= 28.0:
                personalization_reasons.append(f"Calibrated for metabolic weight support (BMI: {context.bmi:.1f} kg/m²)")

            if context.age >= 50 and "Calcium" in item.name:
                personalization_reasons.append(f"Essential bone density support for age tier ({context.age} years)")
                tier = RelevanceTier.HIGH.value

            why_text = f"{item.general_why} Recommended for maintaining musculoskeletal comfort and nutrient density."
            if personalization_reasons:
                why_text += f" (Personalized for: {', '.join(personalization_reasons)})"

            nutrition_recs.append(
                NutritionRecommendation(
                    item_name=item.name,
                    category=item.category.value,
                    recommendation_level=item.default_level,
                    why_selected=why_text,
                    alternative_option=alt,
                    target_nutrients_or_mechanism=item.target_nutrients_or_mechanism,
                    precautions_or_notes="Consume as part of a balanced whole-food meal pattern.",
                    personalization_reason="; ".join(personalization_reasons) or "General joint wellness guidance",
                    evidence_type=item.evidence_type.value,
                    confidence_tier=tier,
                    allergens_flagged=[],
                )
            )

        # ─── 2. LIMIT ITEMS ───
        limit_items = [
            item for item in NUTRITION_LIBRARY
            if item.category == NutritionCategory.LIMIT and validate_nutrition_candidate(item, safety_result)
        ]

        for item in limit_items[:3]:
            personalization_reasons = []
            if context.bmi >= 25.0:
                personalization_reasons.append(f"Supports joint load optimization (BMI: {context.bmi:.1f} kg/m²)")
            if context.symptoms and context.symptoms.pain_level_0_10 >= 5:
                personalization_reasons.append("Minimizes dietary pro-inflammatory lipid burden")

            why_text = f"{item.general_why} Limiting frequency may support overall metabolic and musculoskeletal health."
            if personalization_reasons:
                why_text += f" (Clinical factor: {', '.join(personalization_reasons)})"

            nutrition_recs.append(
                NutritionRecommendation(
                    item_name=item.name,
                    category=item.category.value,
                    recommendation_level=item.default_level,
                    why_selected=why_text,
                    alternative_option=item.default_alternative,
                    target_nutrients_or_mechanism=item.target_nutrients_or_mechanism,
                    precautions_or_notes="Gradual moderation rather than abrupt elimination is recommended for sustainable adherence.",
                    personalization_reason="; ".join(personalization_reasons) or "Metabolic and cardiovascular wellness",
                    evidence_type=item.evidence_type.value,
                    confidence_tier=RelevanceTier.HIGH.value,
                    allergens_flagged=[],
                )
            )

        # ─── 3. AVOID / CHECK FIRST (Allergies & Sensitivities) ───
        for item in NUTRITION_LIBRARY:
            if item.category == NutritionCategory.AVOID_OR_CHECK:
                item_allergens = [a.lower().strip() for a in item.common_allergens]
                matched = [a for a in item_allergens if a in patient_allergies or a in patient_intolerances]

                # Check if patient is vegetarian and item contains animal allergens
                is_veg_conflict = (
                    diet.diet_type in ["vegetarian", "vegan", "jain", "eggetarian"]
                    and any(a in ["shellfish", "crustaceans", "meat"] for a in item_allergens)
                )

                if matched or is_veg_conflict:
                    flagged_text = f"Documented allergy/restriction: {', '.join(matched) if matched else 'Dietary restriction'}"
                    nutrition_recs.append(
                        NutritionRecommendation(
                            item_name=item.name,
                            category=NutritionCategory.AVOID_OR_CHECK.value,
                            recommendation_level="Strict Avoidance / Restricted",
                            why_selected=f"Patient intake identified {flagged_text}. Avoid consumption to prevent adverse reactions.",
                            alternative_option=item.default_alternative,
                            target_nutrients_or_mechanism=item.target_nutrients_or_mechanism,
                            precautions_or_notes="Always inspect packaged product food labels for hidden allergen traces.",
                            personalization_reason=flagged_text,
                            evidence_type=EvidenceType.PROJECT_RULE.value,
                            confidence_tier=RelevanceTier.HIGH.value,
                            allergens_flagged=matched or ["dietary_choice"],
                        )
                    )
                elif not diet.allergy_info_available and len(nutrition_recs) < 9:
                    # Provide check first advice
                    nutrition_recs.append(
                        NutritionRecommendation(
                            item_name=item.name,
                            category=NutritionCategory.AVOID_OR_CHECK.value,
                            recommendation_level="Verify Personal Tolerance",
                            why_selected="Allergy status is unverified. If you have known food sensitivities, substitute with recommended alternatives.",
                            alternative_option=item.default_alternative,
                            target_nutrients_or_mechanism=item.target_nutrients_or_mechanism,
                            precautions_or_notes="Consult a nutritionist or clinical officer if you suspect a food allergy.",
                            personalization_reason="Unknown allergy documentation status",
                            evidence_type=EvidenceType.GENERAL_HEALTH.value,
                            confidence_tier=RelevanceTier.LIMITED.value,
                            allergens_flagged=[],
                        )
                    )

        return nutrition_recs

    def _generate_clinical_summary(
        self,
        context: PatientAssessmentContext,
        safety_result: Any,
        num_yoga: int,
        num_nutrition: int,
    ) -> str:
        """Formulate a grounded, evidence-aware clinical overview summary."""
        symptoms = context.symptoms or SymptomContext()
        movement = context.movement or MovementAssessmentData()

        summary_parts = [
            f"AYURAGIES guidance generated for {context.name} (Age: {context.age}, Sex: {context.sex.capitalize()}, BMI: {context.bmi:.1f} kg/m²)."
        ]

        if symptoms.pain_level_0_10 >= 7:
            summary_parts.append(
                f"Elevated pain level (VAS {symptoms.pain_level_0_10}/10) prioritized non-weightbearing mobility and gentle isometric strengthening."
            )
        elif symptoms.pain_level_0_10 >= 4:
            summary_parts.append(
                f"Moderate joint discomfort (VAS {symptoms.pain_level_0_10}/10) with {symptoms.morning_stiffness_mins} mins stiffness guided a low-impact progressive routine."
            )
        else:
            summary_parts.append("Low baseline discomfort indicates readiness for functional strength and balance progression.")

        if (movement.knee_flexion_deg is not None and movement.knee_flexion_deg < 115.0) or (movement.limp_asymmetry_deg is not None and movement.limp_asymmetry_deg >= 6.0):
            flexion_s = f"{movement.knee_flexion_deg:.1f}°" if movement.knee_flexion_deg is not None else "measured"
            asym_s = f"{movement.limp_asymmetry_deg:.1f}°" if movement.limp_asymmetry_deg is not None else "significant"
            summary_parts.append(
                f"Kinematic indicators (Flexion: {flexion_s}, Asymmetry: {asym_s}) were incorporated to tailor exercise ROM."
            )

        summary_parts.append(
            f"Resulting protocol comprises {num_yoga} structured movement recommendations and {num_nutrition} dietary guidance entries."
        )

        if safety_result.notices:
            summary_parts.append(f"Safety status: {safety_result.overall_status.upper()} ({len(safety_result.notices)} caution notices active).")

        return " ".join(summary_parts)


# Module singleton for convenience
DEFAULT_GUIDANCE_ENGINE = AyuragiesGuidanceEngine()
