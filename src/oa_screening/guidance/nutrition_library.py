"""Curated Nutrition Library for AYURAGIES AI Nutrition Guidance.
Provides structured food groups, anti-inflammatory dietary elements,
allergen metadata, dietary profile compatibility (veg/vegan/non-veg),
and evidence classifications.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from .models import EvidenceType, NutritionCategory


@dataclass
class NutritionItem:
    id: str
    name: str
    category: NutritionCategory
    default_level: str  # "High Priority", "Moderate Priority", "Moderate Consumption", "Limit Strictly", "Allergen / Check First"
    general_why: str
    target_nutrients_or_mechanism: str
    default_alternative: str | None
    common_allergens: list[str] = field(default_factory=list)  # e.g., ["peanut", "milk", "shellfish", "gluten", "soy", "tree_nuts", "egg"]
    dietary_tags: list[str] = field(default_factory=list)  # e.g., ["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain_compatible"]
    suitable_for_bmi: Literal["all", "elevated", "normal"] = "all"
    suitable_for_activity: list[str] = field(default_factory=lambda: ["sedentary", "low", "moderate", "high"])
    evidence_type: EvidenceType = EvidenceType.CLINICAL_GUIDELINE


NUTRITION_LIBRARY: list[NutritionItem] = [
    # ═════════════════════ PRIORITIZE ═════════════════════
    NutritionItem(
        id="NUT-P01",
        name="Colorful Vegetables & Dark Leafy Greens",
        category=NutritionCategory.PRIORITIZE,
        default_level="High Priority",
        general_why="Abundant in vitamins (A, C, K), polyphenols, and antioxidant carotenoids that support musculoskeletal tissue health and cellular repair.",
        target_nutrients_or_mechanism="Polyphenols, Vitamin C, Beta-Carotene, Dietary Fiber",
        default_alternative="Spinach, methi (fenugreek leaves), mustard greens, broccoli, carrots, bell peppers, or local seasonal greens.",
        common_allergens=[],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain_compatible"],
        evidence_type=EvidenceType.CLINICAL_GUIDELINE,
    ),
    NutritionItem(
        id="NUT-P02",
        name="Omega-3 Fatty Acid Sources (Plant & Marine)",
        category=NutritionCategory.PRIORITIZE,
        default_level="High Priority",
        general_why="Omega-3 polyunsaturated fatty acids (ALA, EPA, DHA) participate in modulating the synthesis of pro-inflammatory eicosanoids and cytokine signaling.",
        target_nutrients_or_mechanism="Alpha-Linolenic Acid (ALA), Eicosapentaenoic Acid (EPA), Docosahexaenoic Acid (DHA)",
        default_alternative="Flaxseeds (ground), chia seeds, walnuts for plant diets; wild salmon, mackerel, or sardines for pesco/non-vegetarian diets.",
        common_allergens=["fish", "shellfish", "tree_nuts"],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        evidence_type=EvidenceType.RESEARCH_LITERATURE,
    ),
    NutritionItem(
        id="NUT-P03",
        name="Adequate Quality Protein (Legumes, Pulses, Dairy / Tofu)",
        category=NutritionCategory.PRIORITIZE,
        default_level="High Priority",
        general_why="Adequate protein intake is essential for maintaining peri-articular muscle mass (quadriceps/hamstrings) and joint stabilizing tendon integrity.",
        target_nutrients_or_mechanism="Essential Amino Acids, Leucine, Calcium, Zinc",
        default_alternative="Lentils (dal), chickpeas, moong, tofu, tempeh, paneer/cottage cheese, or boiled eggs based on dietary choice.",
        common_allergens=["milk", "soy", "egg"],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        evidence_type=EvidenceType.CLINICAL_GUIDELINE,
    ),
    NutritionItem(
        id="NUT-P04",
        name="Traditional Culinary Spices (Turmeric with Black Pepper & Ginger)",
        category=NutritionCategory.PRIORITIZE,
        default_level="Moderate Priority",
        general_why="Culinary bioactive compounds like curcumin and gingerols exhibit mild natural antioxidant and cyclooxygenase-modulating properties in observational studies.",
        target_nutrients_or_mechanism="Curcumin, Gingerols, Piperine (enhances bioavailability)",
        default_alternative="Incorporate 1/2 tsp turmeric powder with a pinch of black pepper into warm milk, soups, or vegetable curries; fresh ginger tea.",
        common_allergens=[],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain_compatible"],
        evidence_type=EvidenceType.RESEARCH_LITERATURE,
    ),
    NutritionItem(
        id="NUT-P05",
        name="Whole Grains & Complex Fiber",
        category=NutritionCategory.PRIORITIZE,
        default_level="Moderate Priority",
        general_why="High-fiber whole grains promote gut microbiome diversity and slow postprandial glycemic spikes, which is linked to lower systemic inflammatory markers.",
        target_nutrients_or_mechanism="Beta-glucan, Soluble & Insoluble Fiber, B-Vitamins, Magnesium",
        default_alternative="Millets (ragi, jowar, bajra), oats, brown or red rice, quinoa, and whole wheat flatbreads.",
        common_allergens=["gluten"],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain_compatible"],
        evidence_type=EvidenceType.CLINICAL_GUIDELINE,
    ),
    NutritionItem(
        id="NUT-P06",
        name="Calcium & Vitamin D-Rich Whole Foods",
        category=NutritionCategory.PRIORITIZE,
        default_level="High Priority",
        general_why="Maintains subchondral bone mineral density and prevents age-related bone density loss in weight-bearing joints.",
        target_nutrients_or_mechanism="Bioavailable Calcium, Ergocalciferol/Cholecalciferol, Phosphorus",
        default_alternative="Curd/yogurt, fortified plant milks (almond/soy), sesame seeds (til), ragi, moringa (drumstick leaves), or canned sardines.",
        common_allergens=["milk", "soy", "sesame", "fish"],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        evidence_type=EvidenceType.CLINICAL_GUIDELINE,
    ),
    NutritionItem(
        id="NUT-P07",
        name="Optimal Hydration & Electrolyte Balance",
        category=NutritionCategory.PRIORITIZE,
        default_level="High Priority",
        general_why="Cartilage extracellular matrix is comprised of over 70% water bound to proteoglycans; adequate hydration maintains articular viscoelasticity.",
        target_nutrients_or_mechanism="Water, Potassium, Magnesium",
        default_alternative="2.0 to 2.5 Liters of water daily; plain water, coconut water, lemon water, herbal infusions.",
        common_allergens=[],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain_compatible"],
        evidence_type=EvidenceType.GENERAL_HEALTH,
    ),

    # ═════════════════════ LIMIT ═════════════════════
    NutritionItem(
        id="NUT-L01",
        name="Ultra-Processed Foods & Deep-Fried Snacks",
        category=NutritionCategory.LIMIT,
        default_level="Limit Moderately to Strictly",
        general_why="High in industrial trans-fatty acids, oxidized lipids, and advanced glycation end-products (AGEs) that can promote low-grade systemic inflammation.",
        target_nutrients_or_mechanism="Industrial trans fats, Excess saturated lipids, High sodium, AGEs",
        default_alternative="Choose air-popped roasted pulses (chana, makhana), baked vegetable cutlets, or steamed snacks instead of deep-fried namkeen/chips.",
        common_allergens=[],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain_compatible"],
        evidence_type=EvidenceType.CLINICAL_GUIDELINE,
    ),
    NutritionItem(
        id="NUT-L02",
        name="Excess Refined Sugars & Sugar-Sweetened Beverages",
        category=NutritionCategory.LIMIT,
        default_level="Limit Strictly",
        general_why="Rapidly elevating blood glucose stimulates reactive oxygen species generation and accelerates cartilage matrix cross-linking via glycation.",
        target_nutrients_or_mechanism="High-Fructose Corn Syrup, Sucrose, Refined simple carbs",
        default_alternative="Satisfy sweet cravings with whole fresh seasonal fruits (papaya, guava, berries, apples) or dilute buttermilk with roasted cumin.",
        common_allergens=[],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain_compatible"],
        evidence_type=EvidenceType.RESEARCH_LITERATURE,
    ),
    NutritionItem(
        id="NUT-L03",
        name="Excess Saturated Animal Fats & Processed Meats",
        category=NutritionCategory.LIMIT,
        default_level="Moderate Consumption",
        general_why="Excess saturated arachidonic acid and processed meat nitrates correlate with elevated C-reactive protein (CRP) and oxidative load.",
        target_nutrients_or_mechanism="Arachidonic acid, Saturated fatty acids, Sodium nitrates",
        default_alternative="Substitute with plant proteins (lentils, beans, tofu) or skinless grilled poultry / small oily fish 1-2 times weekly.",
        common_allergens=[],
        dietary_tags=["non_vegetarian"],
        evidence_type=EvidenceType.CLINICAL_GUIDELINE,
    ),
    NutritionItem(
        id="NUT-L04",
        name="High-Sodium Processed Condiments & Preserved Pickles",
        category=NutritionCategory.LIMIT,
        default_level="Limit Moderately",
        general_why="Excessive salt intake contributes to water retention, elevated blood pressure, and potential calcium excretion in urine.",
        target_nutrients_or_mechanism="Sodium chloride, Preservatives",
        default_alternative="Flavor dishes with fresh coriander, mint, lemon juice, roasted cumin powder, or garlic instead of excess table salt and commercial pickles.",
        common_allergens=[],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain_compatible"],
        evidence_type=EvidenceType.GENERAL_HEALTH,
    ),

    # ═════════════════════ AVOID / CHECK FIRST ═════════════════════
    NutritionItem(
        id="NUT-A01",
        name="Peanut-Containing Foods",
        category=NutritionCategory.AVOID_OR_CHECK,
        default_level="Strict Avoidance If Allergic",
        general_why="Peanuts are a potent food allergen that trigger IgE-mediated allergic responses in sensitized individuals.",
        target_nutrients_or_mechanism="Ara h protein allergens",
        default_alternative="Sunflower seed butter, roasted pumpkin seeds, chia seeds, or roasted chickpeas for protein and healthy fats.",
        common_allergens=["peanut"],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain_compatible"],
        evidence_type=EvidenceType.PROJECT_RULE,
    ),
    NutritionItem(
        id="NUT-A02",
        name="Dairy & Cow Milk Products",
        category=NutritionCategory.AVOID_OR_CHECK,
        default_level="Check Tolerance / Substitute If Allergic or Lactose Intolerant",
        general_why="Cow milk proteins (casein, whey) and lactose can provoke severe immune or gastrointestinal adverse reactions in allergic or intolerant individuals.",
        target_nutrients_or_mechanism="Casein, Beta-lactoglobulin, Lactose disaccharide",
        default_alternative="Fortified soy milk, almond milk, oat milk, or calcium-set tofu.",
        common_allergens=["milk", "dairy"],
        dietary_tags=["vegetarian", "eggetarian", "non_vegetarian"],
        evidence_type=EvidenceType.PROJECT_RULE,
    ),
    NutritionItem(
        id="NUT-A03",
        name="Shellfish & Crustaceans",
        category=NutritionCategory.AVOID_OR_CHECK,
        default_level="Strict Avoidance If Allergic or Strictly Vegetarian",
        general_why="Tropomyosin protein in shellfish is a major allergen; additionally incompatible with vegetarian/vegan/religious restrictions.",
        target_nutrients_or_mechanism="Tropomyosin allergen",
        default_alternative="Ground flaxseeds, chia seeds, walnut oil, or algae-derived DHA oil for omega-3 fatty acids without marine allergens.",
        common_allergens=["shellfish", "crustaceans"],
        dietary_tags=["non_vegetarian"],
        evidence_type=EvidenceType.PROJECT_RULE,
    ),
    NutritionItem(
        id="NUT-A04",
        name="Wheat Gluten-Containing Grains",
        category=NutritionCategory.AVOID_OR_CHECK,
        default_level="Check First If Celiac Disease or Non-Celiac Gluten Sensitivity",
        general_why="Gluten peptides (gliadin, glutenin) trigger mucosal damage and inflammatory response in individuals with celiac disease or gluten sensitivity.",
        target_nutrients_or_mechanism="Gliadin, Glutenin proteins",
        default_alternative="Naturally gluten-free grains: Millets (jowar, ragi, bajra), brown rice, amaranth (rajgira), buckwheat (kuttu), and certified gluten-free oats.",
        common_allergens=["gluten", "wheat"],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain_compatible"],
        evidence_type=EvidenceType.PROJECT_RULE,
    ),
    NutritionItem(
        id="NUT-A05",
        name="Soy & Soy-Derived Products",
        category=NutritionCategory.AVOID_OR_CHECK,
        default_level="Check First If Soy Allergy Present",
        general_why="Soy proteins (Gly m) can cause IgE-mediated allergic reactions in sensitive individuals.",
        target_nutrients_or_mechanism="Soybean globulins (Gly m)",
        default_alternative="Lentils, chickpeas, green peas, pumpkin seeds, hemp seeds, or dairy paneer (if milk-tolerant).",
        common_allergens=["soy", "soybean"],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian"],
        evidence_type=EvidenceType.PROJECT_RULE,
    ),
    NutritionItem(
        id="NUT-A06",
        name="Tree Nuts (Almonds, Cashews, Walnuts)",
        category=NutritionCategory.AVOID_OR_CHECK,
        default_level="Check First If Tree Nut Allergy Present",
        general_why="Tree nuts can trigger severe anaphylactic reactions in allergic individuals.",
        target_nutrients_or_mechanism="Tree nut seed storage proteins",
        default_alternative="Sunflower seeds, pumpkin seeds, roasted watermelon seeds, or roasted chickpeas.",
        common_allergens=["tree_nuts", "walnut", "cashew", "almond", "pistachio"],
        dietary_tags=["vegetarian", "vegan", "non_vegetarian", "eggetarian", "jain_compatible"],
        evidence_type=EvidenceType.PROJECT_RULE,
    ),
]


def get_nutrition_items_by_category(category: NutritionCategory) -> list[NutritionItem]:
    return [item for item in NUTRITION_LIBRARY if item.category == category]


def get_nutrition_item_by_id(item_id: str) -> NutritionItem | None:
    for item in NUTRITION_LIBRARY:
        if item.id == item_id:
            return item
    return None
