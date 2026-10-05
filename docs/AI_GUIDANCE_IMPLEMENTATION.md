# AYURAGIES AI Guidance Implementation Specification & Documentation

## 1. System Overview & Purpose

**AYURAGIES AI Guidance** is an evidence-aware, cyber-physical clinical recommendation engine integrated into the OrthoNex Knee Osteoarthritis (KOA) Screening and Triage platform. It bridges optical kinematic gait telemetry, WOMAC/KOOS symptom burden surveys, and patient nutritional profiles into actionable, personalized, and clinically filtered guidance:

1. **AI YOGA & MOVEMENT GUIDANCE**: Structured therapeutic movements distinguished across clinical categories (*Yoga*, *Mobility*, *Strength / Functional Exercise*, *Balance*, *Stretching*, *Warm-up*), with real-time MediaPipe joint angle tracking for trackable postures.
2. **AI NUTRITION GUIDANCE**: Systematic dietary recommendations categorized into *PRIORITIZE*, *LIMIT*, and *AVOID / CHECK FIRST*, accounting for patient allergies, food intolerances, and dietary patterns (Vegetarian / Vegan / Non-Veg).
3. **SAFETY ENGINE & CONTRAINDICATION FILTER**: Mandatory pre- and post-filtering layer that enforces clinical safeguards for acute joint pain (VAS $\ge 7$), joint effusion/swelling, mechanical instability, and known food allergens.
4. **OFFLINE-FIRST ARCHITECTURE**: 100% deterministic local Python engine and browser-side JavaScript fallback engine ensuring full operational readiness in disconnected rural community clinics and PHCs.

---

## 2. Architecture & Data Flow

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      STRUCTURED PATIENT ASSESSMENT                      │
│   - Patient Profile (Age, Sex, BMI, Activity Level, Diet Preferences)   │
│   - Gait Kinematics (Flexion ROM, Extension Deficit, Limp Asymmetry)    │
│   - Clinical Symptoms (VAS Pain 0-10, Morning Stiffness Mins, Swelling) │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     CLINICAL SAFETY ENGINE (FILTER 1)                   │
│   - Evaluates Pain VAS >= 7 (Disqualifies deep squats / single-leg)     │
│   - Detects Acute Effusion / Swelling (Filters resistive knee loading)  │
│   - Assesses Instability / Recent Injury (Filters unsupported balance)  │
│   - Evaluates Documented Allergies (Filters allergen food candidates)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   RULE-BASED CANDIDATE SELECTION POOL                   │
│   - Yoga & Movement Library (17 evidenced exercise specifications)      │
│   - Nutrition Intelligence Library (17 curated dietary categories)      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PERSONALIZATION & AI REASONING                    │
│   - Scored on ROM deficits, stiffness duration, and functional need     │
│   - Grounded "Why am I seeing this?" generation from real patient data  │
│   - Qualitative Relevance Tiers (HIGH / MODERATE / LIMITED)             │
│   - Evidence Source Tagging (REHABILITATION / CLINICAL GUIDELINE / etc) │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FINAL OUTPUT VALIDATION (FILTER 2)                  │
│   - Validates zero allergen leaks                                       │
│   - Enforces no unvalidated cure / cartilage reversal claims            │
│   - Produces Structured GuidanceSessionOutput                           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
            ┌────────────────────────┴────────────────────────┐
            ▼                                                 ▼
┌───────────────────────────────┐                 ┌───────────────────────┐
│      FASTAPI / SQLITE DB      │                 │    REACT 18 + VITE    │
│  - guidance_sessions          │                 │  - AYURAGIES View     │
│  - yoga_recommendations       │                 │  - Pose Camera HUD    │
│  - nutrition_recommendations  │                 │  - PDF Dossier Print  │
└───────────────────────────────┘                 └───────────────────────┘
```

---

## 3. Core Modules & Directory Structure

```text
oa-screening/
├── backend/
│   ├── db.py                       # SQLite schema & migrations for guidance sessions
│   ├── main.py                     # FastAPI REST routes for guidance generation, save & history
│   └── schemas.py                  # Pydantic v2 domain schemas for API I/O
├── src/oa_screening/guidance/
│   ├── __init__.py                 # Export interface
│   ├── models.py                   # Dataclasses (Patient context, Yoga, Nutrition, Safety)
│   ├── exercise_library.py         # Curated 17-exercise movement library with contraindications
│   ├── yoga_library.py             # Re-export alias module
│   ├── nutrition_library.py        # Curated 17-item nutrition intelligence database
│   ├── safety_engine.py            # Clinical contraindication evaluation engine
│   └── recommendation_engine.py    # Hybrid scoring, personalization, and explanation engine
├── frontend/src/
│   ├── views/AyuragiesGuidanceView.jsx  # Interactive UI with Exercise Cards, Pose Tracking & History
│   ├── views/DiagnosticReportView.jsx   # Multimodal diagnostic PDF report integration
│   ├── views/OverviewView.jsx           # Triage quick launch banner
│   ├── utils/guidanceOffline.js         # Browser-side 100% offline fallback engine
│   ├── utils/api.js                     # API client methods for guidance endpoints
│   ├── utils/auth.js                    # Role permission configuration with 'guidance' tab
│   └── components/Header.jsx            # Top navigation bar with AYURAGIES AI Guidance tab
└── tests/
    ├── test_yoga_library.py             # Exercise schema integrity & category tests
    ├── test_nutrition_library.py        # Nutrition schema integrity & claim safety tests
    ├── test_safety_engine.py            # Clinical contraindication & allergen filter tests
    ├── test_recommendation_engine.py    # Personalization scoring & qualitative relevance tests
    ├── test_guidance_api.py             # FastAPI REST endpoint integration tests
    ├── test_persistence_and_demo.py     # DEMO-001 end-to-end database persistence tests
    └── test_offline_fallback.py         # Complete zero-network offline execution tests
```

---

## 4. Safety Engine & Contraindication Rules

| Rule Identifier | Trigger Condition | Excluded Movements / Foods | Clinical Action & Notice |
| :--- | :--- | :--- | :--- |
| `RULE_PAIN_HIGH_VAS_GE_7` | VAS Pain $\ge 7/10$ | `YOGA-01` (Chair Pose), `STR-02` (Wall Squat), `STR-01` (Sit-to-Stand), `BAL-02` | Restricts to supine/seated non-weightbearing isometrics (`STR-03`, `MOB-03`). Shows High Pain Notice. |
| `RULE_ACUTE_SWELLING` | Reported joint swelling / effusion | `STR-02` (Wall Squat), `YOGA-01`, `STR-04` | Restricts resistive loading; advises joint elevation and cold therapy. |
| `RULE_INSTABILITY_OR_RECENT_INJURY` | Instability or injury $\le 6$ weeks | `BAL-02` (Single leg stance), `YOGA-02` (Tree pose) | Enforces dual-support balance and stable counter contact. |
| `RULE_RESTRICTED_ROM` | Knee Flexion $< 95^\circ$ or Deficit $\ge 15^\circ$ | Deep squats & extreme flexion stretches | Provides chair-supported knee flexion and active glides. |
| `RULE_ALLERGEN_MATCH` | Allergen in patient's documented list | Matching items (`NUT-A01` Peanut, `NUT-A03` Shellfish, etc.) | Excludes item from `PRIORITIZE`; flags strict avoidance card with safe alternatives. |
| `RULE_ALLERGY_DATA_UNAVAILABLE` | `allergy_info_available == False` | None | Displays conservative caution: *"Allergy info unverified. Check food ingredients."* |

---

## 5. Yoga & Movement Library Architecture

The library is cataloged into 6 clinical categories:
- **Warm-up**: Ankle Circles (`WU-01`), Marching in Place (`WU-02`)
- **Mobility**: Chair-Supported Knee Flexion (`MOB-01`), Seated Knee Extension (`MOB-02`), Supine Heel Slides (`MOB-03`)
- **Strength / Functional Exercise**: Chair Sit-to-Stand (`STR-01`), Wall Mini-Squat (`STR-02`), Isometric Quadriceps Sets (`STR-03`)
- **Balance**: Tandem Stance (`BAL-01`), Supported Single-Leg Stance (`BAL-02`)
- **Yoga (Classical Postures Adapted)**: Modified Chair Pose (*Utkatasana*, `YOGA-01`), Modified Tree Pose (*Vrksasana*, `YOGA-02`), Seated Spinal Twist (*Ardha Matsyendrasana*, `YOGA-03`), Supine Bound Angle (*Supta Baddha Konasana*, `YOGA-04`)
- **Stretching**: Standing Quadriceps Stretch (`STR-04`), Seated Hamstring Stretch (`STR-05`), Calf Wall Stretch (`STR-06`)

### Camera-Guided Pose Tracking
Exercises with `camera_tracking_available: true` connect directly to the browser MediaPipe pose estimation pipeline:
- **Knee Alignment & Angle**: Evaluates sagittal flexion angle ($0^\circ - 140^\circ$)
- **Trunk Verticality**: Detects excessive forward leaning during chair sit-to-stand
- **Real-Time Biofeedback**: Visual HUD with live angle gauge, repetition counter, and hold timer
- **Fallback Handling**: Non-camera exercises display a clear *"Camera guidance unavailable"* tag.

---

## 6. Nutrition Intelligence Classification

Organized into 3 clinical guidance tiers:
1. **`PRIORITIZE`**:
   - Colorful Vegetables & Dark Leafy Greens (Polyphenols, carotenoids, vitamins A/C/K)
   - Omega-3 Fatty Acids (Flaxseeds, chia, walnuts, wild marine sources for anti-inflammatory eicosanoids)
   - Adequate Quality Protein (Legumes, lentils, tofu, paneer for peri-articular muscle support)
   - Traditional Culinary Spices (Turmeric with black pepper, fresh ginger for antioxidant bioactives)
   - Whole Grains & Complex Millets (Ragi, jowar, bajra, oats for glycemic and metabolic stability)
   - Calcium & Vitamin D-Rich Whole Foods (Curd, fortified plant milks, sesame seeds)
   - Optimal Hydration (2.0–2.5L daily to maintain cartilage extracellular matrix hydration)
2. **`LIMIT`**:
   - Ultra-Processed Foods & Deep-Fried Snacks (Trans fats, oxidized lipids, AGEs)
   - Refined Simple Sugars & Sweetened Drinks (Glycation stress)
   - Excess Saturated Animal Fats & Processed Meats (Elevated inflammatory markers)
   - High-Sodium Processed Condiments & Preserved Pickles
3. **`AVOID / CHECK FIRST`**:
   - Specific Allergen Avoidance (Peanuts, Dairy, Shellfish, Gluten, Soy, Tree nuts)
   - Personalized safe substitutes provided for every restricted item (e.g. sunflower seed butter for peanut allergy; millets for gluten sensitivity; flaxseeds for vegetarian omega-3).

---

## 7. Evidence-Aware Qualitative Relevance

To maintain strict scientific integrity, the engine **never outputs fabricated confidence percentages** (e.g., `98.48%` is never displayed). Instead, recommendations use validated qualitative tiers:
- **`HIGH RELEVANCE`**: Directly addresses an identified primary assessment deficit (e.g., knee flexion $< 110^\circ$, pain VAS $\ge 7$, documented allergy).
- **`MODERATE RELEVANCE`**: Foundational musculoskeletal conditioning appropriate for baseline age and activity tier.
- **`LIMITED PERSONALIZATION`**: General health guidance provided when specific clinical intake fields are unverified or omitted.

---

## 8. Database Schema & Persistence

SQLite database located at `backend/screening.db`:

```sql
-- Guidance Sessions Table
CREATE TABLE guidance_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_code TEXT UNIQUE NOT NULL,
    patient_id INTEGER,
    screening_id INTEGER,
    mode TEXT NOT NULL DEFAULT 'offline_rules',
    status TEXT NOT NULL DEFAULT 'completed',
    overall_safety_status TEXT NOT NULL DEFAULT 'safe',
    data_provenance TEXT,
    clinical_summary TEXT,
    safety_notices_json TEXT,
    allergy_warning TEXT,
    patient_context_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (screening_id) REFERENCES screenings(id) ON DELETE SET NULL
);

-- Yoga Recommendations Table
CREATE TABLE yoga_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    exercise_id TEXT NOT NULL,
    name TEXT NOT NULL,
    sanskrit_name TEXT,
    category TEXT NOT NULL,
    why_selected TEXT NOT NULL,
    target_areas_json TEXT,
    difficulty TEXT,
    recommended_duration TEXT,
    recommended_repetitions TEXT,
    recommended_frequency TEXT,
    instructions_json TEXT,
    expected_purpose TEXT,
    precautions_json TEXT,
    stop_conditions_json TEXT,
    camera_tracking_available INTEGER DEFAULT 0,
    tracking_metric TEXT,
    required_equipment_json TEXT,
    evidence_type TEXT,
    confidence_tier TEXT,
    personalization_factors_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES guidance_sessions(id) ON DELETE CASCADE
);

-- Nutrition Recommendations Table
CREATE TABLE nutrition_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    recommendation_level TEXT,
    why_selected TEXT NOT NULL,
    alternative_option TEXT,
    target_nutrients_or_mechanism TEXT,
    precautions_or_notes TEXT,
    personalization_reason TEXT,
    evidence_type TEXT,
    confidence_tier TEXT,
    allergens_flagged_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES guidance_sessions(id) ON DELETE CASCADE
);
```

---

## 9. Testing & Quality Verification

Run the comprehensive pytest suite:

```bash
# Execute unit & integration tests
.venv/Scripts/python -m pytest -v
```

### Verified Test Matrix:
1. `test_yoga_library.py`: Exercise metadata integrity, category enumeration, non-empty instructions, safety claims verification (**6 tests passed**).
2. `test_nutrition_library.py`: Nutrient profiles, allergen tagging, alternative availability, claim safety (**6 tests passed**).
3. `test_safety_engine.py`: High pain (VAS $\ge 7$) filtration, acute swelling rule, joint instability rule, allergy filtering, vegetarian diet handling, missing data handling (**7 tests passed**).
4. `test_recommendation_engine.py`: Personalized candidate selection, explanation generation, qualitative confidence tiers (**5 tests passed**).
5. `test_guidance_api.py`: FastAPI endpoints (`/generate`, `/save`, `/history`, `/session/{id}`, `/yoga-library`, `/nutrition-library`, `/demo-context`) (**4 tests passed**).
6. `test_persistence_and_demo.py`: Complete DEMO-001 end-to-end database persistence and history retrieval (**1 test passed**).
7. `test_offline_fallback.py`: Verification of 100% offline self-containment with zero external network access (**1 test passed**).

**Total Test Suite Result**: **`30 passed in 2.79s` (100% pass rate)**.

---

## 10. Commands to Run the Application

### 1. Start FastAPI Backend:
```bash
# Activate virtual environment and launch uvicorn
.venv/Scripts/python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```
- API Documentation: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

### 2. Start Frontend Web Application:
```bash
cd frontend
npm run dev
```
- Access web application: `http://localhost:5173`
- Direct link to AI Guidance: `http://localhost:5173/#guidance`

### 3. Build Frontend Production Bundle:
```bash
cd frontend
npm run build
```

---

## 11. Known Limitations & Clinical Boundaries

1. **Non-Diagnostic Scope**: AYURAGIES AI Guidance operates as a clinical decision support and patient rehabilitation education tool. It does not replace physical orthopedic examination, radiological staging, or formal physical therapy prescription.
2. **Offline Natural Language**: Natural language explanations are generated deterministically using rule-based templating to guarantee 100% offline performance without cloud LLM dependencies.
3. **Hardware Pose Resolution**: Optical camera pose tracking accuracy depends on patient framing, clothing contrast, and adequate ambient lighting in frontline community clinic settings.
