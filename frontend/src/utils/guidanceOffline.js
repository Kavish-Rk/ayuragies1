/**
 * AYURAGIES AI Guidance - Client-Side Offline Fallback Engine
 * Provides deterministic 100% offline generation of Yoga and Nutrition
 * guidance without backend connectivity.
 */

export const YOGA_LIBRARY = [
  {
    id: "WU-01",
    category: "Warm-up",
    name: "Ankle Circles",
    target_areas: ["ankle", "calf"],
    difficulty: "Beginner",
    duration: "2–3 mins",
    precautions: ["Avoid if acute ankle injury is present."],
    why: "Improves ankle mobility and warms up lower-extremity joints.",
    instructions: ["Sit on a stable chair.", "Lift one foot slightly.", "Slowly rotate ankle 10 times each direction."],
    evidence: "GENERAL HEALTH GUIDANCE"
  },
  {
    id: "MOB-01",
    category: "Mobility",
    name: "Chair-Supported Knee Flexion",
    target_areas: ["knee", "quadriceps"],
    difficulty: "Beginner",
    duration: "5–10 mins",
    precautions: ["Use chair support to maintain balance."],
    why: "Maintains knee flexion range of motion through gentle active movement.",
    instructions: ["Stand behind a chair.", "Slowly bend knee, bringing heel toward buttock.", "Hold 2-3s, lower slowly."],
    evidence: "REHABILITATION GUIDANCE",
    camera_tracking_available: true
  },
  {
    id: "STR-03",
    category: "Strength / Functional Exercise",
    name: "Isometric Quadriceps Set",
    target_areas: ["quadriceps"],
    difficulty: "Beginner",
    duration: "5 mins",
    precautions: ["Do not hold breath."],
    why: "Activates quadriceps without joint movement, safe for painful/swollen knees.",
    instructions: ["Sit or lie with leg extended.", "Tighten thigh muscle by pressing back of knee flat.", "Hold 5-10s.", "Relax."],
    evidence: "REHABILITATION GUIDANCE"
  },
  {
    id: "STR-01",
    category: "Strength / Functional Exercise",
    name: "Sit-to-Stand",
    target_areas: ["quadriceps", "glutes"],
    difficulty: "Beginner",
    duration: "5 mins",
    precautions: ["Ensure chair is stable."],
    why: "Builds lower-limb functional strength.",
    instructions: ["Sit on chair.", "Lean slightly forward.", "Press through heels to stand.", "Hold 1-2s.", "Lower slowly."],
    evidence: "REHABILITATION GUIDANCE",
    camera_tracking_available: true
  },
  {
    id: "YOGA-01",
    category: "Yoga",
    name: "Chair Pose (Modified)",
    target_areas: ["quads", "glutes", "core"],
    difficulty: "Beginner",
    duration: "5 mins",
    precautions: ["Keep squat depth shallow."],
    why: "Strengthens lower limbs using a familiar yoga posture adapted for knee tolerance.",
    instructions: ["Stand feet hip-width.", "Bend knees to shallow squat.", "Keep trunk upright.", "Hold 10-15s."],
    evidence: "GENERAL HEALTH GUIDANCE",
    camera_tracking_available: true
  },
  {
    id: "BAL-02",
    category: "Balance",
    name: "Single Leg Stance (Supported)",
    target_areas: ["hip", "core"],
    difficulty: "Intermediate",
    duration: "3 mins",
    precautions: ["Keep hand near support surface."],
    why: "Challenges balance on a single limb to build stability.",
    instructions: ["Stand near support.", "Lift one foot slightly.", "Hold 10-20s.", "Switch sides."],
    evidence: "REHABILITATION GUIDANCE",
    camera_tracking_available: true
  }
];

export const NUTRITION_LIBRARY = [
  {
    id: "NUT-P01",
    category: "PRIORITIZE",
    level: "High Priority",
    name: "Colorful Vegetables & Dark Leafy Greens",
    why: "Abundant in vitamins and polyphenols that support musculoskeletal tissue health.",
    alternative: "Spinach, methi, mustard greens, broccoli, carrots.",
    evidence: "CLINICAL NUTRITION GUIDELINE"
  },
  {
    id: "NUT-P02",
    category: "PRIORITIZE",
    level: "High Priority",
    name: "Omega-3 Fatty Acid Sources",
    why: "Omega-3 fatty acids help modulate pro-inflammatory cytokine signaling.",
    alternative: "Flaxseeds, chia seeds, walnuts, or wild salmon.",
    evidence: "RESEARCH LITERATURE"
  },
  {
    id: "NUT-L01",
    category: "LIMIT",
    level: "Limit Moderately",
    name: "Ultra-Processed Foods & Deep-Fried Snacks",
    why: "High in industrial trans fats and AGEs that promote low-grade systemic inflammation.",
    alternative: "Air-popped makhana, steamed snacks.",
    evidence: "CLINICAL NUTRITION GUIDELINE"
  },
  {
    id: "NUT-A01",
    category: "AVOID / CHECK FIRST",
    level: "Strict Avoidance",
    name: "Peanut-Containing Foods",
    why: "Peanuts are a potent allergen.",
    alternative: "Sunflower seed butter, pumpkin seeds.",
    evidence: "PROJECT RULE",
    allergens: ["peanut"]
  }
];

export function generateGuidanceOffline(context) {
  const pain = context?.symptoms?.pain_level_0_10 || 4;
  const isDemo = context?.is_demo || false;
  
  let safetyStatus = "safe";
  let notices = [];
  let yogaRecs = [];
  let nutrRecs = [];
  
  if (pain >= 7) {
    safetyStatus = "restricted";
    notices.push({
      severity: "high",
      title: "High Reported Pain",
      message: `Pain level ${pain}/10. High-load exercises filtered.`,
    });
    yogaRecs = YOGA_LIBRARY.filter(y => ["WU-01", "STR-03"].includes(y.id));
  } else {
    yogaRecs = [...YOGA_LIBRARY];
  }

  // Map to schemas
  yogaRecs = yogaRecs.map(y => ({
    exercise_id: y.id,
    name: y.name,
    category: y.category,
    why_selected: y.why,
    target_areas: y.target_areas,
    difficulty: y.difficulty,
    recommended_duration: y.duration,
    recommended_repetitions: "Varies",
    recommended_frequency: "3-4 sessions/week",
    instructions: y.instructions,
    expected_purpose: "Joint stabilization",
    precautions: y.precautions,
    stop_conditions: ["Sharp pain"],
    camera_tracking_available: !!y.camera_tracking_available,
    evidence_type: y.evidence,
    confidence_tier: "MODERATE RELEVANCE"
  }));

  const allergies = context?.diet?.allergies || [];
  
  nutrRecs = NUTRITION_LIBRARY.map(n => {
    let cat = n.category;
    let rLevel = n.level;
    let why = n.why;
    let flagged = [];
    
    if (n.allergens?.some(a => allergies.includes(a))) {
      cat = "AVOID / CHECK FIRST";
      rLevel = "Strict Avoidance";
      why = `Documented patient allergy matching ${n.name}. Do not consume.`;
      flagged = n.allergens;
    }
    
    return {
      item_name: n.name,
      category: cat,
      recommendation_level: rLevel,
      why_selected: why,
      alternative_option: n.alternative,
      personalization_reason: flagged.length ? "Allergy matching" : "Baseline alignment",
      evidence_type: n.evidence,
      confidence_tier: "HIGH RELEVANCE",
      allergens_flagged: flagged
    };
  });

  return {
    session_id: `OFFLINE-${Date.now()}`,
    patient_id: context?.patient_id || "DEMO-001",
    created_at: new Date().toISOString(),
    is_demo: isDemo,
    overall_safety_status: safetyStatus,
    safety_notices: notices,
    clinical_summary: `Offline generated safety protocol (Pain: ${pain}/10).`,
    yoga_recommendations: yogaRecs,
    nutrition_recommendations: nutrRecs,
    allergy_warning: allergies.length === 0 ? "Allergy info unverified." : null,
    offline_generated: true,
  };
}
