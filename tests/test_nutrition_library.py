"""Unit tests for Nutrition Library."""
import pytest
from oa_screening.guidance.models import EvidenceType, NutritionCategory
from oa_screening.guidance.nutrition_library import (
    NUTRITION_LIBRARY,
    get_nutrition_item_by_id,
    get_nutrition_items_by_category,
)


def test_nutrition_library_not_empty():
    assert len(NUTRITION_LIBRARY) >= 10


def test_nutrition_categories():
    categories = {it.category for it in NUTRITION_LIBRARY}
    assert NutritionCategory.PRIORITIZE in categories
    assert NutritionCategory.LIMIT in categories
    assert NutritionCategory.AVOID_OR_CHECK in categories


def test_nutrition_item_integrity():
    for it in NUTRITION_LIBRARY:
        assert it.id.strip()
        assert it.name.strip()
        assert isinstance(it.category, NutritionCategory)
        assert it.general_why.strip()
        assert it.target_nutrients_or_mechanism.strip()
        assert isinstance(it.evidence_type, EvidenceType)


def test_get_nutrition_by_category():
    prioritize_items = get_nutrition_items_by_category(NutritionCategory.PRIORITIZE)
    assert len(prioritize_items) >= 4
    limit_items = get_nutrition_items_by_category(NutritionCategory.LIMIT)
    assert len(limit_items) >= 2
    avoid_items = get_nutrition_items_by_category(NutritionCategory.AVOID_OR_CHECK)
    assert len(avoid_items) >= 3


def test_allergens_metadata_present():
    peanut_item = get_nutrition_item_by_id("NUT-A01")
    assert peanut_item is not None
    assert "peanut" in peanut_item.common_allergens

    shellfish_item = get_nutrition_item_by_id("NUT-A03")
    assert shellfish_item is not None
    assert "shellfish" in shellfish_item.common_allergens


def test_no_false_medical_claims_in_nutrition():
    false_claims = ["cure osteoarthritis", "eliminates inflammation", "reverse cartilage", "cures arthritis"]
    for it in NUTRITION_LIBRARY:
        text = f"{it.general_why} {it.target_nutrients_or_mechanism}".lower()
        for fc in false_claims:
            assert fc not in text, f"Found unsupported medical claim '{fc}' in nutrition item {it.id}"
