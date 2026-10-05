import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  generateAiGuidance,
  saveAiGuidance,
  getAiGuidanceHistory,
  getDemoGuidanceContext
} from '../utils/api';

export default function AyuragiesGuidanceView({
  activePatient,
  surveyResult,
  gaitResult,
  onNavigate,
  currentUser,
  camera
}) {
  const isDemo = Boolean(currentUser?.isDemo || activePatient?.id?.includes('DEMO') || !activePatient);
  const [loading, setLoading] = useState(false);
  const [guidanceData, setGuidanceData] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [trackingExercise, setTrackingExercise] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [nutritionFilter, setNutritionFilter] = useState('ALL'); // ALL, PRIORITIZE, LIMIT, AVOID
  const [exerciseFilter, setExerciseFilter] = useState('ALL');

  // Camera exercise tracking state
  const [trackingSeconds, setTrackingSeconds] = useState(0);
  const [repCount, /* */] = useState(0);
  const [repStateOld, setRepStateOld] = useState('up'); // 'up' or 'down'
  const [currentFeedback, setCurrentFeedback] = useState('Stand in camera view to begin');
  const timerRef = useRef(null);

  // Derive assessment context from live props or fallback to demo
  const patientContext = useMemo(() => {
    const painVal = surveyResult?.pain ?? (activePatient?.surveyScore?.includes('28') ? 7 : (activePatient?.surveyScore?.includes('24') ? 5 : 4));
    const stiffVal = surveyResult?.stiffness ?? (activePatient?.surveyScore?.includes('28') ? 45 : 30);
    const asymVal = gaitResult?.kneeAngleAsymmetry
      ? parseFloat(String(gaitResult.kneeAngleAsymmetry).replace(/[^0-9.]/g, ''))
      : (activePatient?.gaitRisk?.includes('High') ? 14.6 : 7.2);
    const flexionVal = gaitResult?.maxFlexion
      ? parseFloat(String(gaitResult.maxFlexion).replace(/[^0-9.]/g, ''))
      : (activePatient?.gaitRisk?.includes('High') ? 108.5 : 125.0);

    return {
      patient_id: activePatient?.dbId || (isDemo ? 'DEMO-001' : activePatient?.id || 'IND-PATIENT-01'),
      name: activePatient?.name || (isDemo ? 'DEMO-001: Rajesh Khurana (Demo Patient)' : 'Registered Patient'),
      age: activePatient?.age || 58,
      sex: activePatient?.gender?.toLowerCase() === 'female' ? 'female' : 'male',
      bmi: activePatient?.bmi || 27.4,
      activity_level: 'low',
      occupation: activePatient?.occupation || 'Desk Executive / Sedentary Urban Worker',
      assessment_type: 'functional_knee_assessment',
      is_demo: isDemo,
      movement: {
        stand_completed: true,
        stand_repetitions: 1,
        sit_to_stand_completed: true,
        sit_to_stand_repetitions: 5,
        sit_to_stand_knee_angle: 91.4,
        squat_completed: true,
        squat_repetitions: 4,
        squat_knee_angle: 94.2,
        lunge_completed: false,
        lunge_repetitions: 0,
        knee_raise_completed: true,
        knee_raise_repetitions: 5,
        knee_flexion_deg: flexionVal,
        knee_deficit_deg: asymVal,
        gait_speed_mps: gaitResult?.velocity || 0.84,
        cadence_spm: gaitResult?.cadence || 92.0,
        limp_asymmetry_deg: asymVal
      },
      symptoms: {
        pain_level_0_10: painVal,
        morning_stiffness_mins: stiffVal,
        has_swelling: Boolean(surveyResult?.swelling || activePatient?.symptoms?.includes('swelling')),
        has_instability: false,
        previous_knee_injury: Boolean(surveyResult?.previousInjury),
        symptom_duration_weeks: 16,
        walking_difficulty_0_3: surveyResult?.walkDiff ?? 1,
        stairs_difficulty_0_3: surveyResult?.stairsDiff ?? 2,
        squat_difficulty_0_3: 2
      },
      diet: {
        diet_type: 'vegetarian',
        allergies: ['peanut'],
        food_intolerances: [],
        foods_to_avoid: ['deep_fried_snacks'],
        cultural_or_religious_notes: 'Vegetarian Indian dietary pattern',
        allergy_info_available: true
      }
    };
  }, [activePatient, surveyResult, gaitResult, isDemo]);

  // Initial generation
  useEffect(() => {
    let isMounted = true;
    async function loadGuidance() {
      setLoading(true);
      try {
        const res = await generateAiGuidance(patientContext);
        if (isMounted) {
          setGuidanceData(res);
        }
      } catch (err) {
        console.error('Error generating AI guidance:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadGuidance();
    return () => {
      isMounted = false;
    };
  }, [patientContext]);

  // Save guidance
  const handleSaveGuidance = async () => {
    if (!guidanceData) return;
    setSaveStatus('saving');
    try {
      const payload = {
        patient_id: typeof activePatient?.dbId === 'number' ? activePatient.dbId : null,
        screening_id: null,
        session_code: guidanceData.session_id,
        is_demo: guidanceData.is_demo,
        data_provenance: guidanceData.data_provenance,
        overall_safety_status: guidanceData.overall_safety_status,
        clinical_summary: guidanceData.clinical_summary,
        safety_notices: guidanceData.safety_notices,
        allergy_warning: guidanceData.allergy_warning,
        patient_context: patientContext,
        yoga_recommendations: guidanceData.yoga_recommendations,
        nutrition_recommendations: guidanceData.nutrition_recommendations
      };
      await saveAiGuidance(payload);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 4000);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
    }
  };

  // History loader
  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    const pid = activePatient?.dbId || 'demo';
    const list = await getAiGuidanceHistory(pid);
    setHistoryList(list || []);
  };

  // Camera exercise tracking effect
  useEffect(() => {
    if (trackingExercise) {
      setTrackingSeconds(0);
      /* */(0);
      /* */('up');
      setCurrentFeedback('Aligning posture...');

      if (camera && !camera.isWebcamActive && !camera.isEspStreamActive) {
        camera.startCamera();
      }

      timerRef.current = setInterval(() => {
        setTrackingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [trackingExercise, camera]);

  // Real-Time Feedback mapped from Biomechanics State Machine
  useEffect(() => {
    if (!trackingExercise) return;
    const { activeAngle, qualityLeft, qualityRight, activeSide } = camera?.poseData || {};
    const { state, reps } = camera?.repData || { state: 'STANDING', reps: 0 };
    
    if (activeAngle === null) {
      setCurrentFeedback(`Landmarks missing. Quality: ${activeSide === 'RIGHT' ? qualityRight : qualityLeft}`);
      return;
    }
    
    if (state === 'STANDING') setCurrentFeedback('Stand straight to begin rep.');
    else if (state === 'DESCENDING') setCurrentFeedback('Lowering... control the movement.');
    else if (state === 'LOWER') setCurrentFeedback('Hold... excellent depth.');
    else if (state === 'ASCENDING') setCurrentFeedback('Pushing up...');
    
  }, [camera?.poseData?.activeAngle, camera?.repData?.state]);

  // Filtered lists
  const filteredYoga = useMemo(() => {
    if (!guidanceData?.yoga_recommendations) return [];
    if (exerciseFilter === 'ALL') return guidanceData.yoga_recommendations;
    return guidanceData.yoga_recommendations.filter(
      (y) => y.category.toLowerCase().includes(exerciseFilter.toLowerCase())
    );
  }, [guidanceData, exerciseFilter]);

  const filteredNutrition = useMemo(() => {
    if (!guidanceData?.nutrition_recommendations) return [];
    if (nutritionFilter === 'ALL') return guidanceData.nutrition_recommendations;
    return guidanceData.nutrition_recommendations.filter(
      (n) => n.category.toUpperCase().includes(nutritionFilter.toUpperCase())
    );
  }, [guidanceData, nutritionFilter]);

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in print:p-0">
      {/* ────────────────── TOP CLINICAL HEADER ────────────────── */}
      <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">self_improvement</span>
              AYURAGIES AI GUIDANCE
            </span>
            {isDemo ? (
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[11px] rounded-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">science</span>
                DEMONSTRATION DATA
              </span>
            ) : (
              <span className="px-2.5 py-0.5 bg-cyan-100 text-cyan-900 border border-cyan-300 font-semibold text-[11px] rounded-md flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                CLINICAL TRIAGE DATA
              </span>
            )}
            <span className="text-xs text-on-surface-variant font-data-mono">
              Session: {guidanceData?.session_id || 'Generating...'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            AI Yoga, Movement & Nutrition Intelligence
          </h1>
          <p className="text-sm text-on-surface-variant max-w-3xl">
            Evidence-aware, personalized rehabilitation prescriptions and dietary modulation calibrated against sagittal kinematics, KOOS pain indices, and documented allergies.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch md:self-auto shrink-0 print:hidden">
          <button
            onClick={() => handleSaveGuidance()}
            disabled={loading || saveStatus === 'saving'}
            className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-2 shadow-xs ${
              saveStatus === 'saved'
                ? 'bg-emerald-600 text-white'
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {saveStatus === 'saved' ? 'check' : 'save'}
            </span>
            {saveStatus === 'saved' ? 'Saved to Record' : saveStatus === 'saving' ? 'Saving...' : 'Save Guidance'}
          </button>

          <button
            onClick={handleOpenHistory}
            className="px-3.5 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs rounded-xl border border-surface-container transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            History
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs rounded-xl border border-surface-container transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print / PDF
          </button>
        </div>
      </div>

      {/* ────────────────── PATIENT CONTEXT STRIP ────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-3 flex flex-col">
          <span className="text-[11px] text-on-surface-variant font-medium">Patient</span>
          <span className="text-sm font-bold text-on-surface truncate">{patientContext.name}</span>
          <span className="text-[11px] text-on-surface-variant font-data-mono">{patientContext.age}y · {patientContext.sex}</span>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-3 flex flex-col">
          <span className="text-[11px] text-on-surface-variant font-medium">Reported Pain</span>
          <span className="text-sm font-bold text-on-surface flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${patientContext.symptoms.pain_level_0_10 >= 7 ? 'bg-error' : patientContext.symptoms.pain_level_0_10 >= 4 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            VAS {patientContext.symptoms.pain_level_0_10}/10
          </span>
          <span className="text-[11px] text-on-surface-variant">Stiffness: {patientContext.symptoms.morning_stiffness_mins}m</span>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-3 flex flex-col">
          <span className="text-[11px] text-on-surface-variant font-medium">Knee Kinematics</span>
          <span className="text-sm font-bold text-on-surface">
            {(patientContext.movement.knee_flexion_deg ?? 0).toFixed(1)}° Flex
          </span>
          <span className="text-[11px] text-on-surface-variant">Deficit: +{(patientContext.movement.knee_deficit_deg ?? 0).toFixed(1)}°</span>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-3 flex flex-col">
          <span className="text-[11px] text-on-surface-variant font-medium">Antalgic Asymmetry</span>
          <span className="text-sm font-bold text-on-surface">
            +{(patientContext.movement.limp_asymmetry_deg ?? 0).toFixed(1)}° Lag
          </span>
          <span className="text-[11px] text-on-surface-variant">Cadence: {patientContext.movement.cadence_spm} spm</span>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-3 flex flex-col">
          <span className="text-[11px] text-on-surface-variant font-medium">Dietary Profile</span>
          <span className="text-sm font-bold text-on-surface capitalize">{patientContext.diet.diet_type}</span>
          <span className="text-[11px] text-on-surface-variant">BMI: {patientContext.bmi} kg/m²</span>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container rounded-xl p-3 flex flex-col">
          <span className="text-[11px] text-on-surface-variant font-medium">Documented Allergies</span>
          <span className="text-sm font-bold text-error truncate">
            {patientContext.diet.allergies?.length ? patientContext.diet.allergies.join(', ') : 'None documented'}
          </span>
          <span className="text-[11px] text-on-surface-variant">Safety filter: ACTIVE</span>
        </div>
      </div>

      {/* ────────────────── SAFETY NOTICES DRAWER / BANNER ────────────────── */}
      {guidanceData?.safety_notices?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <span className="material-symbols-outlined text-amber-600">gva</span>
            <span>CLINICAL SAFETY ENGINE — ACTIVE CONTRAINDICATION RULES</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guidanceData.safety_notices.map((sn, idx) => (
              <div key={idx} className="bg-white/90 border border-amber-200 rounded-xl p-3.5 flex flex-col gap-1 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-amber-950">{sn.title}</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-data-mono text-[10px] rounded uppercase font-semibold">
                    {sn.severity}
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">{sn.message}</p>
                {sn.filtered_exercises?.length > 0 && (
                  <span className="text-[11px] text-amber-800 font-medium mt-1">
                    Filtered movements: {sn.filtered_exercises.join(', ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────── SECTION 1: AI YOGA & MOVEMENT GUIDANCE ────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 text-[26px]">fitness_center</span>
            <div>
              <h2 className="text-lg font-bold text-on-surface">AI YOGA & MOVEMENT GUIDANCE</h2>
              <p className="text-xs text-on-surface-variant">
                Targeted therapeutic exercises distinguished by clinical category with real-time pose validation.
              </p>
            </div>
          </div>

          {/* Exercise Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold print:hidden">
            {['ALL', 'Yoga', 'Mobility', 'Strength', 'Balance', 'Stretching', 'Warm-up'].map((cat) => (
              <button
                key={cat}
                onClick={() => setExerciseFilter(cat)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  exerciseFilter === cat
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface-variant border-surface-container hover:bg-surface-container-low'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-48 bg-surface-container-lowest rounded-2xl border border-surface-container flex items-center justify-center">
            <span className="animate-spin material-symbols-outlined text-primary text-[32px]">progress_activity</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredYoga.map((rec) => {
              const isYoga = rec.category.toLowerCase().includes('yoga');
              const isMobility = rec.category.toLowerCase().includes('mobility');
              const isStrength = rec.category.toLowerCase().includes('strength');

              const badgeColor = isYoga
                ? 'bg-purple-100 text-purple-900 border-purple-200'
                : isMobility
                ? 'bg-blue-100 text-blue-900 border-blue-200'
                : isStrength
                ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                : 'bg-amber-100 text-amber-900 border-amber-200';

              return (
                <div
                  key={rec.exercise_id}
                  className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col gap-3">
                    {/* Header Strip */}
                    <div className="flex items-start justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${badgeColor}`}>
                        {rec.category}
                      </span>
                      <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">
                        {rec.difficulty}
                      </span>
                    </div>

                    {/* Name & Sanskrit */}
                    <div>
                      <h3 className="text-base font-bold text-on-surface">{rec.name}</h3>
                      {rec.sanskrit_name && (
                        <span className="text-xs text-on-surface-variant italic font-medium">
                          {rec.sanskrit_name}
                        </span>
                      )}
                    </div>

                    {/* Why Recommended (Clinically Grounded Rationale) */}
                    <div className="bg-surface-container-low/80 rounded-xl p-3 border border-surface-container">
                      <span className="text-[11px] font-bold text-primary flex items-center gap-1 mb-1">
                        <span className="material-symbols-outlined text-[14px]">psychology</span>
                        Why Recommended
                      </span>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {rec.why_selected}
                      </p>
                    </div>

                    {/* Target Areas & Timing */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-surface-container-lowest border border-surface-container/60 rounded-lg p-2">
                        <span className="text-[10px] text-on-surface-variant font-medium block">Target</span>
                        <span className="font-semibold text-on-surface truncate block">
                          {rec.target_areas.join(', ')}
                        </span>
                      </div>
                      <div className="bg-surface-container-lowest border border-surface-container/60 rounded-lg p-2">
                        <span className="text-[10px] text-on-surface-variant font-medium block">Duration</span>
                        <span className="font-semibold text-on-surface truncate block">
                          {rec.recommended_duration}
                        </span>
                      </div>
                    </div>

                    {/* Evidence and Confidence */}
                    <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium pt-1 border-t border-surface-container/50">
                      <span>{rec.evidence_type}</span>
                      <span className="font-semibold text-primary">{rec.confidence_tier}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-surface-container print:hidden">
                    <button
                      onClick={() => setSelectedExercise(rec)}
                      className="flex-1 py-2 px-3 bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs rounded-xl border border-surface-container transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                      Instructions
                    </button>

                    {rec.camera_tracking_available ? (
                      <button
                        onClick={() => setTrackingExercise(rec)}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">videocam</span>
                        Start Camera
                      </button>
                    ) : (
                      <span
                        title="Camera guidance unavailable for this pose"
                        className="py-2 px-2.5 bg-surface-container-low/50 text-on-surface-variant text-[11px] font-medium rounded-xl border border-dashed border-surface-container flex items-center gap-1 cursor-default"
                      >
                        <span className="material-symbols-outlined text-[14px]">videocam_off</span>
                        No Camera
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ────────────────── SECTION 2: AI NUTRITION GUIDANCE ────────────────── */}
      <section className="flex flex-col gap-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600 text-[26px]">nutrition</span>
            <div>
              <h2 className="text-lg font-bold text-on-surface">AI NUTRITION GUIDANCE</h2>
              <p className="text-xs text-on-surface-variant">
                Metabolic and anti-inflammatory food categorization strictly aligned with patient allergies and dietary constraints.
              </p>
            </div>
          </div>

          {/* Nutrition Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold print:hidden">
            {['ALL', 'PRIORITIZE', 'LIMIT', 'AVOID'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setNutritionFilter(lvl)}
                className={`px-3 py-1.5 rounded-lg border transition-all ${
                  nutritionFilter === lvl
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-surface-container-lowest text-on-surface-variant border-surface-container hover:bg-surface-container-low'
                }`}
              >
                {lvl === 'AVOID' ? 'AVOID / CHECK FIRST' : lvl}
              </button>
            ))}
          </div>
        </div>

        {guidanceData?.allergy_warning && (
          <div className="bg-cyan-50 border border-cyan-200 text-cyan-900 rounded-xl p-3 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-cyan-700">info</span>
            <span>{guidanceData.allergy_warning}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredNutrition.map((item, idx) => {
            const isPrioritize = item.category === 'PRIORITIZE';
            const isLimit = item.category === 'LIMIT';
            const isAvoid = item.category.includes('AVOID') || item.category.includes('CHECK');

            const cardHeaderColor = isPrioritize
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : isLimit
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-rose-50 border-rose-200 text-rose-950';

            const badgeColor = isPrioritize
              ? 'bg-emerald-600 text-white'
              : isLimit
              ? 'bg-amber-600 text-white'
              : 'bg-rose-600 text-white';

            return (
              <div
                key={idx}
                className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                      {item.category}
                    </span>
                    <span className="text-[11px] font-semibold text-on-surface-variant font-data-mono">
                      {item.recommendation_level}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-on-surface">{item.item_name}</h4>

                  <div className={`rounded-xl p-3 border text-xs leading-relaxed ${cardHeaderColor}`}>
                    <span className="font-bold block mb-1">Clinical Rationale:</span>
                    {item.why_selected}
                  </div>

                  {item.alternative_option && (
                    <div className="bg-surface-container-low rounded-xl p-3 border border-surface-container text-xs">
                      <span className="font-bold text-on-surface block mb-1">Recommended Alternative:</span>
                      <span className="text-on-surface-variant">{item.alternative_option}</span>
                    </div>
                  )}

                  <div className="text-[11px] text-on-surface-variant">
                    <span className="font-semibold text-on-surface">Target mechanism:</span> {item.target_nutrients_or_mechanism}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-on-surface-variant pt-2 border-t border-surface-container/60">
                  <span>{item.evidence_type}</span>
                  <span className="font-semibold text-teal-700">{item.confidence_tier}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ────────────────── EVIDENCE & SAFETY DISCLAIMER ────────────────── */}
      <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 text-xs text-on-surface-variant flex flex-col gap-2">
        <div className="flex items-center gap-2 font-bold text-on-surface">
          <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
          <span>DATA PROVENANCE & CLINICAL SAFETY NOTICE</span>
        </div>
        <p className="leading-relaxed">
          {guidanceData?.data_provenance || 'CLINICAL TRIAGE RESEARCH SYSTEM'} — All yoga postures and dietary modifications are generated using deterministic rule-based clinical boundary filters and validated local knowledge bases.
        </p>
        <p className="text-[11px] text-on-surface-variant/80 italic">
          Disclaimer: This guidance is for clinical triage, rehabilitation support, and research demonstration. It does not constitute a guaranteed medical cure or replace surgical/orthopedic evaluation. Stop any movement if sharp discomfort occurs.
        </p>
      </div>

      {/* ────────────────── EXERCISE DETAIL MODAL ────────────────── */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b border-surface-container pb-3">
              <div>
                <span className="text-xs font-bold text-primary uppercase">{selectedExercise.category}</span>
                <h3 className="text-lg font-bold text-on-surface">{selectedExercise.name}</h3>
                {selectedExercise.sanskrit_name && (
                  <span className="text-xs text-on-surface-variant italic">{selectedExercise.sanskrit_name}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <span className="font-bold text-on-surface block mb-1">Step-by-Step Instructions:</span>
                <ol className="list-decimal list-inside space-y-1 text-on-surface-variant">
                  {selectedExercise.instructions?.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-950">
                <span className="font-bold block mb-1">Safety Precautions:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {selectedExercise.precautions?.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-950">
                <span className="font-bold block mb-1">Stop Conditions:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {selectedExercise.stop_conditions?.map((sc, idx) => (
                    <li key={idx}>{sc}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-container">
              <button
                onClick={() => setSelectedExercise(null)}
                className="px-4 py-2 bg-surface-container-low hover:bg-surface-container font-semibold text-xs rounded-xl"
              >
                Close
              </button>
              {selectedExercise.camera_tracking_available && (
                <button
                  onClick={() => {
                    const ex = selectedExercise;
                    setSelectedExercise(null);
                    setTrackingExercise(ex);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">videocam</span>
                  Start Camera Pose Tracking
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── LIVE CAMERA POSE TRACKING MODAL ────────────────── */}
      {trackingExercise && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] text-white rounded-3xl border border-white/20 max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-sm tracking-wide uppercase text-emerald-400">
                  REAL-TIME POSE TRACKING ACTIVE
                </span>
              </div>
              <button
                onClick={() => setTrackingExercise(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Main Video + HUD Display */}
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
              {/* Camera Video or Mock Mesh */}
              {camera?.isWebcamActive ? (
                <video
                  ref={camera.webcamVideoRef} style={{opacity: camera.developerMode ? 0.3 : 1}}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <span className="material-symbols-outlined text-5xl text-emerald-400 animate-pulse">
                    accessibility_new
                  </span>
                  <span className="text-xs font-semibold">MediaPipe Pose Landmarks Active</span>
                </div>
              )}

              
              {/* Developer Debug Pane */}
              {camera?.developerMode && camera?.poseData && (
                <div className="absolute left-4 top-1/4 bg-black/60 font-mono text-[10px] text-green-400 p-2 rounded flex flex-col gap-1 border border-green-700/50">
                  <div>=== BIOMECHANICS DEBUG ===</div>
                  <div>Side: {camera.poseData.activeSide}</div>
                  <div>Quality L: {camera.poseData.qualityLeft} ({camera.poseData.confLeft.toFixed(2)})</div>
                  <div>Quality R: {camera.poseData.qualityRight} ({camera.poseData.confRight.toFixed(2)})</div>
                  <div>Raw L: {camera.poseData.rawAngleLeft?.toFixed(1) || 'NaN'}</div>
                  <div>Raw R: {camera.poseData.rawAngleRight?.toFixed(1) || 'NaN'}</div>
                  <div>Smooth L: {camera.poseData.smoothedAngleLeft?.toFixed(1) || 'NaN'}</div>
                  <div>Smooth R: {camera.poseData.smoothedAngleRight?.toFixed(1) || 'NaN'}</div>
                  <div>Active Angle Emit: {camera.poseData.activeAngle?.toFixed(1) || 'NULL'}</div>
                  <div>State Machine: {camera.repData?.state} ({camera.repData?.reps} reps)</div>
                </div>
              )}

              {/* HUD Overlays */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md rounded-xl p-3 border border-white/15 flex flex-col gap-1 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Exercise</span>
                <span className="font-bold text-white text-sm">{trackingExercise.name}</span>
                <span className="text-emerald-400 font-data-mono">
                  Target: {trackingExercise.category}
                </span>
              </div>

              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md rounded-xl p-3 border border-white/15 flex flex-col items-end gap-1 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Session Timer</span>
                <span className="font-bold text-white text-base font-data-mono">
                  {Math.floor(trackingSeconds / 60)}:{String(trackingSeconds % 60).padStart(2, '0')}
                </span>
                <span className="text-cyan-400 font-bold">Reps: {camera?.repData?.reps || 0}</span>
              </div>

              {/* Real-Time Posture Feedback Box */}
              <div className="absolute bottom-4 inset-x-4 bg-black/80 backdrop-blur-md rounded-xl p-3 border border-white/15 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-emerald-400 text-[22px]">check_circle</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Biomechanic Feedback</span>
                    <span className="font-bold text-white">{currentFeedback}</span>
                  </div>
                </div>
                <div className="text-right font-data-mono text-cyan-300">
                  Angle: {camera?.poseData?.activeAngle ? `${camera.poseData.activeAngle.toFixed(1)}°` : 'UNAVAILABLE'}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-400">
                Exercise Metric: {trackingExercise.tracking_metric || 'Sagittal Knee Flexion Tracking'}
              </span>
              <button
                onClick={() => camera.setDeveloperMode?.(!camera.developerMode)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-xl transition-all mr-2"
              >
                Developer Debug
              </button>
              <button
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                Finish Tracking Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── HISTORY MODAL ────────────────── */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl border border-surface-container max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-surface-container pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                <h3 className="text-base font-bold text-on-surface">Recommendation Session History</h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
              {historyList.length === 0 ? (
                <div className="py-8 text-center text-xs text-on-surface-variant">
                  No saved guidance sessions found for this patient.
                </div>
              ) : (
                historyList.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-surface-container-low/70 border border-surface-container rounded-xl p-3.5 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-on-surface font-data-mono">
                        {item.session_code || item.session_id}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{item.clinical_summary}</p>
                    <div className="flex items-center gap-3 text-[11px] text-primary font-semibold mt-1">
                      <span>Status: {item.overall_safety_status}</span>
                      <span>Mode: {item.mode}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-surface-container">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-surface-container-low hover:bg-surface-container font-semibold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
