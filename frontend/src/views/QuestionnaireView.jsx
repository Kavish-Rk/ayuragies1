import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../utils/i18n';
import { evaluateQuestionnaire } from '../utils/api';

export default function QuestionnaireView({ activePatient, onSurveySubmitted, onOpenTeleconsult, onNavigate }) {
  const [lang, setLang] = useState('en');
  const t = translations[lang] || translations.en;
  const [activeSection, setActiveSection] = useState('A');
  const [restoredDraft, setRestoredDraft] = useState(null);

  const [pain, setPain] = useState(7);
  const [painPeak, setPainPeak] = useState('walking');
  const [stiffness, setStiffness] = useState(35);
  const [workloadMatrix, setWorkloadMatrix] = useState({ teaPlucking: true, heavyLoads: true, deepSquatting: true, slopeWalking: false, coldDamp: true });
  const [walkDiff, setWalkDiff] = useState(2); 
  const [stairsDiff, setStairsDiff] = useState(2);
  const [squatDiff, setSquatDiff] = useState(3);
  const [priorInjury, setPriorInjury] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [surveyOutcome, setSurveyOutcome] = useState(null);
  const [submissionError, setSubmissionError] = useState('');

  const draftKey = `orthonex_survey_draft_${activePatient?.id || 'default'}`;
  const isInitialLoad = useRef(true);

  useEffect(() => {
    isInitialLoad.current = true;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeSection) setActiveSection(parsed.activeSection);
        if (typeof parsed.pain === 'number') setPain(parsed.pain);
        if (parsed.painPeak) setPainPeak(parsed.painPeak);
        if (typeof parsed.stiffness === 'number') setStiffness(parsed.stiffness);
        if (parsed.workloadMatrix) setWorkloadMatrix(parsed.workloadMatrix);
        if (typeof parsed.walkDiff === 'number') setWalkDiff(parsed.walkDiff);
        if (typeof parsed.stairsDiff === 'number') setStairsDiff(parsed.stairsDiff);
        if (typeof parsed.squatDiff === 'number') setSquatDiff(parsed.squatDiff);
        if (typeof parsed.priorInjury === 'boolean') setPriorInjury(parsed.priorInjury);
        if (parsed.lang) setLang(parsed.lang);

        const minutesAgo = parsed.timestamp ? Math.round((Date.now() - parsed.timestamp) / 60000) : 0;
        setRestoredDraft({ section: parsed.activeSection || 'A', timeStr: minutesAgo <= 1 ? 'just now' : `${minutesAgo}m ago` });
      } else {
        setRestoredDraft(null); setActiveSection('A');
      }
    } catch {}
    isInitialLoad.current = false;
  }, [draftKey]);

  useEffect(() => {
    if (isInitialLoad.current) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({
        activeSection, pain, painPeak, stiffness, workloadMatrix, walkDiff, stairsDiff, squatDiff, priorInjury, lang, timestamp: Date.now()
      }));
    } catch {}
  }, [activeSection, pain, painPeak, stiffness, workloadMatrix, walkDiff, stairsDiff, squatDiff, priorInjury, lang, draftKey]);

  const handleResetForm = () => {
    setPain(0); setPainPeak('morning'); setStiffness(10);
    setWorkloadMatrix({ teaPlucking: false, heavyLoads: false, deepSquatting: false, slopeWalking: false, coldDamp: false });
    setWalkDiff(0); setStairsDiff(0); setSquatDiff(0); setPriorInjury(false);
    setActiveSection('A'); setRestoredDraft(null);
    try { localStorage.removeItem(draftKey); } catch {}
  };

  const calculateCompositeScore = () => {
    let score = pain * 1.5;
    const age = activePatient?.age || 52;
    if (age >= 65) score += 3.0; else if (age >= 55) score += 2.0; else if (age >= 45) score += 1.0;
    if (stiffness >= 30) score += 2.0; else if (stiffness >= 15) score += 1.0;
    score += Math.min(10.0, stiffness / 5.0);
    score += 2.0 * (walkDiff + stairsDiff + squatDiff);
    if (priorInjury) score += 4.0;
    score += 2.0; 
    if (workloadMatrix.teaPlucking) score += 4.0;
    if (workloadMatrix.heavyLoads) score += 3.0;
    if (workloadMatrix.deepSquatting) score += 3.0;
    if (workloadMatrix.slopeWalking) score += 2.0;
    return Math.min(40, Math.round(score));
  };

  const compositeScore = calculateCompositeScore();
  const riskTier = compositeScore >= 25 ? 'High Risk' : compositeScore > 20 ? 'Moderate Risk' : 'Low Risk';

  const handleSubmit = async () => {
    setIsSaving(true); setSubmissionError('');
    try {
      const payload = { patient_id: activePatient?.dbId || null, age: activePatient?.age || 52, pain, stiffness, walking_difficulty: walkDiff, stairs_difficulty: stairsDiff, previous_knee_injury: priorInjury, tea_plucking: workloadMatrix.teaPlucking, symptom_duration_weeks: 14, workload: workloadMatrix.teaPlucking ? 'high' : 'low', heavy_loads: workloadMatrix.heavyLoads, deep_squatting: workloadMatrix.deepSquatting, slope_walking: workloadMatrix.slopeWalking, cold_damp: workloadMatrix.coldDamp, squat_difficulty: squatDiff };
      const res = await evaluateQuestionnaire(payload);
      const enrichedRes = { ...res, pain, stiffness, compositeScore };
      setSurveyOutcome(enrichedRes);
      if (onSurveySubmitted) onSurveySubmitted(enrichedRes);
    } catch (error) { setSubmissionError(error.message || 'Questionnaire could not be saved.'); }
    finally { setIsSaving(false); }
  };

  const applySurveyPreset = (presetType) => {
    if (presetType === 'severe') {
      setPain(8); setPainPeak('walking'); setStiffness(45);
      setWorkloadMatrix({ teaPlucking: true, heavyLoads: true, deepSquatting: true, slopeWalking: true, coldDamp: true });
      setWalkDiff(3); setStairsDiff(3); setSquatDiff(3); setPriorInjury(true);
    } else if (presetType === 'moderate') {
      setPain(5); setPainPeak('standing'); setStiffness(25);
      setWorkloadMatrix({ teaPlucking: true, heavyLoads: false, deepSquatting: true, slopeWalking: false, coldDamp: true });
      setWalkDiff(2); setStairsDiff(2); setSquatDiff(2); setPriorInjury(false);
    } else {
      setPain(1); setPainPeak('morning'); setStiffness(5);
      setWorkloadMatrix({ teaPlucking: false, heavyLoads: false, deepSquatting: false, slopeWalking: false, coldDamp: false });
      setWalkDiff(0); setStairsDiff(0); setSquatDiff(0); setPriorInjury(false);
    }
  };

  const sectionTabs = [
    { id: 'A', num: 'A', label: 'Pain & Stiffness', desc: 'Weight: 40%' },
    { id: 'B', num: 'B', label: 'Workload Matrix', desc: 'Weight: 35%' },
    { id: 'C', num: 'C', label: 'Mobility & Function', desc: 'Weight: 25%' },
    { id: 'all', num: '✦', label: 'Continuous View', desc: 'All Sections' }
  ];

  return (
    <div className="flex flex-col w-full max-w-[1500px] mx-auto gap-6 animate-fade-in bg-[#F7F8F4] min-h-screen p-6 text-[#123B3A]">
      <div className="flex items-center justify-between">
        <button onClick={() => (onNavigate ? onNavigate('overview') : window.history.back())} className="flex items-center gap-1.5 text-xs font-bold text-[#58706D] hover:text-[#064E49] transition-colors bg-white px-3 py-1.5 rounded-lg border border-[#D9E5E1]">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span> Back to Overview
        </button>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between bg-white p-6 rounded-[14px] shadow-sm border border-[#D9E5E1] gap-6">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#E5F3EE] text-[#064E49] font-mono text-[10px] font-bold uppercase tracking-widest">KOOS-India V2.4</span>
            <span className="text-[#58706D] text-xs font-bold">Validated Multi-Lingual Clinical Survey</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#123B3A]">{t.title}</h1>
          <p className="text-sm text-[#58706D]">{t.subtitle}</p>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-[10px] text-[#58706D] uppercase font-bold tracking-widest">Fast Presets:</span>
            <button onClick={() => applySurveyPreset('severe')} className="px-3 py-1 rounded bg-[#FDECEC] text-[#D9534F] text-[10px] font-bold uppercase border border-[#D9534F]/30 hover:bg-[#D9534F]/20">Severe OA</button>
            <button onClick={() => applySurveyPreset('moderate')} className="px-3 py-1 rounded bg-[#FFF5DD] text-[#E7A928] text-[10px] font-bold uppercase border border-[#E7A928]/30 hover:bg-[#E7A928]/20">Moderate Early OA</button>
            <button onClick={() => applySurveyPreset('mild')} className="px-3 py-1 rounded bg-[#EAF7F1] text-[#1F9D73] text-[10px] font-bold uppercase border border-[#1F9D73]/30 hover:bg-[#1F9D73]/20">Mild / Control</button>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 justify-center">
          <span className="text-[10px] text-[#58706D] uppercase font-bold tracking-widest">Interview Language</span>
          <div className="flex flex-wrap gap-2">
            {[{ id: 'en', label: 'English' }, { id: 'hi', label: 'हिन्दी' }, { id: 'as', label: 'অসমীয়া' }, { id: 'bn', label: 'বাংলা' }].map(l => (
              <button key={l.id} onClick={() => setLang(l.id)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition border ${lang === l.id ? 'bg-[#064E49] text-white border-[#064E49]' : 'bg-[#F7F8F4] text-[#58706D] border-[#D9E5E1] hover:bg-white'}`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 max-w-full overflow-x-auto">
        {sectionTabs.map(tab => {
          const isActive = activeSection === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)} className={`flex-1 min-w-[200px] px-4 py-3 rounded-[12px] text-left transition flex items-center gap-3 border ${isActive ? 'bg-[#E5F3EE] text-[#064E49] border-[#16877C]/30 shadow-sm' : 'bg-white text-[#58706D] border-[#D9E5E1] hover:bg-[#F7F8F4]'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isActive ? 'bg-[#064E49] text-white' : 'bg-[#F7F8F4] text-[#58706D]'}`}>{tab.num}</div>
              <div className="flex flex-col"><span className={`text-sm font-bold ${isActive ? 'text-[#064E49]' : 'text-[#123B3A]'}`}>{tab.label}</span><span className="text-[10px] opacity-80">{tab.desc}</span></div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {(activeSection === 'A' || activeSection === 'all') && (
            <div className="bg-white p-6 rounded-[14px] shadow-sm border border-[#D9E5E1] animate-fade-in">
              <h2 className="text-lg font-bold text-[#123B3A] mb-1">{t.secA}</h2>
              <p className="text-xs text-[#58706D] mb-6">{t.secADesc}</p>

              <div className={`p-5 rounded-xl border mb-4 transition-colors ${pain >= 7 ? 'bg-[#FDECEC] border-[#D9534F]/30' : pain >= 4 ? 'bg-[#FFF5DD] border-[#E7A928]/30' : 'bg-[#EAF7F1] border-[#1F9D73]/30'}`}>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-[#123B3A]">{t.painLabel}</label>
                  <span className={`px-2 py-1 rounded text-xs font-bold text-white ${pain >= 7 ? 'bg-[#D9534F]' : pain >= 4 ? 'bg-[#E7A928]' : 'bg-[#1F9D73]'}`}>{pain}/10</span>
                </div>
                <input type="range" min="0" max="10" value={pain} onChange={e => setPain(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#064E49] bg-white border border-[#D9E5E1]" />
                <div className="flex justify-between text-[10px] text-[#58706D] mt-2 font-mono"><span>0 (Asymptomatic)</span><span>5 (Moderate)</span><span>10 (Debilitating)</span></div>
                
                <div className="mt-5 pt-4 border-t border-black/10">
                  <span className="text-[10px] uppercase font-bold text-[#123B3A] block mb-2">{t.peakLabel}</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[{ id: 'rest', label: t.rest }, { id: 'walking', label: t.walking }, { id: 'squatting', label: t.squatting }, { id: 'stairs', label: t.stairs }].map(btn => (
                      <button key={btn.id} onClick={() => setPainPeak(btn.id)} className={`px-3 py-2 rounded-lg text-xs font-bold transition border ${painPeak === btn.id ? 'bg-[#064E49] text-white border-[#064E49]' : 'bg-white text-[#58706D] border-[#D9E5E1] hover:bg-[#F7F8F4]'}`}>{btn.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-xl border transition-colors ${stiffness >= 60 ? 'bg-[#FDECEC] border-[#D9534F]/30' : stiffness >= 30 ? 'bg-[#FFF5DD] border-[#E7A928]/30' : 'bg-[#EAF7F1] border-[#1F9D73]/30'}`}>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-[#123B3A]">{t.stiffnessLabel}</label>
                  <span className="font-mono text-sm font-bold text-[#123B3A]">{stiffness} mins</span>
                </div>
                <input type="range" min="0" max="90" step="5" value={stiffness} onChange={e => setStiffness(Number(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#064E49] bg-white border border-[#D9E5E1]" />
                <div className="flex justify-between text-[10px] text-[#58706D] mt-2 font-mono"><span>0m</span><span>30m</span><span>90m+</span></div>
              </div>

              {activeSection === 'A' && (
                <div className="flex justify-end mt-6">
                  <button onClick={() => setActiveSection('B')} className="px-5 py-2.5 bg-[#064E49] text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-[#073F3B]">Continue <span className="material-symbols-outlined text-[16px]">arrow_forward</span></button>
                </div>
              )}
            </div>
          )}

          {(activeSection === 'B' || activeSection === 'all') && (
            <div className="bg-white p-6 rounded-[14px] shadow-sm border border-[#D9E5E1] animate-fade-in">
              <h2 className="text-lg font-bold text-[#123B3A] mb-1">{t.secB}</h2>
              <p className="text-xs text-[#58706D] mb-6">{t.secBDesc}</p>

              <div className="space-y-3">
                {[{ key: 'teaPlucking', label: t.teaPlucking }, { key: 'heavyLoads', label: t.heavyLoads }, { key: 'deepSquatting', label: t.deepSquatting }, { key: 'slopeWalking', label: t.slopeWalking }, { key: 'coldDamp', label: t.coldDamp }].map(item => (
                  <label key={item.key} className={`p-4 rounded-xl flex items-center justify-between cursor-pointer border transition ${workloadMatrix[item.key] ? 'bg-[#FFF5DD] border-[#E7A928]/30' : 'bg-[#F7F8F4] border-[#D9E5E1] hover:bg-white'}`}>
                    <div className="flex items-center gap-4">
                      <input type="checkbox" checked={workloadMatrix[item.key]} onChange={e => setWorkloadMatrix({...workloadMatrix, [item.key]: e.target.checked})} className="w-5 h-5 accent-[#064E49]" />
                      <span className="text-sm font-bold text-[#123B3A]">{item.label}</span>
                    </div>
                    {workloadMatrix[item.key] && <span className="w-2.5 h-2.5 rounded-full bg-[#E7A928]"></span>}
                  </label>
                ))}
              </div>

              {activeSection === 'B' && (
                <div className="flex justify-between mt-6">
                  <button onClick={() => setActiveSection('A')} className="px-5 py-2.5 border border-[#D9E5E1] text-[#123B3A] text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-[#F7F8F4]"><span className="material-symbols-outlined text-[16px]">arrow_back</span> Back</button>
                  <button onClick={() => setActiveSection('C')} className="px-5 py-2.5 bg-[#064E49] text-white text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-[#073F3B]">Continue <span className="material-symbols-outlined text-[16px]">arrow_forward</span></button>
                </div>
              )}
            </div>
          )}

          {(activeSection === 'C' || activeSection === 'all') && (
            <div className="bg-white p-6 rounded-[14px] shadow-sm border border-[#D9E5E1] animate-fade-in">
              <h2 className="text-lg font-bold text-[#123B3A] mb-1">{t.secC}</h2>
              <p className="text-xs text-[#58706D] mb-6">{t.secCDesc}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className={`p-4 rounded-xl border ${walkDiff >= 2 ? 'bg-[#FDECEC] border-[#D9534F]/30' : walkDiff === 1 ? 'bg-[#FFF5DD] border-[#E7A928]/30' : 'bg-[#EAF7F1] border-[#1F9D73]/30'}`}>
                  <label className="text-xs font-bold text-[#123B3A] block mb-2">{t.walkDiff}</label>
                  <select value={walkDiff} onChange={e => setWalkDiff(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[#D9E5E1] text-sm text-[#123B3A] focus:outline-none">
                    <option value={0}>0 - None (Fully Ambulatory)</option>
                    <option value={1}>1 - Mild (Slight limp)</option>
                    <option value={2}>2 - Moderate (Requires rest)</option>
                    <option value={3}>3 - Severe (Requires support)</option>
                  </select>
                </div>
                <div className={`p-4 rounded-xl border ${stairsDiff >= 2 ? 'bg-[#FDECEC] border-[#D9534F]/30' : stairsDiff === 1 ? 'bg-[#FFF5DD] border-[#E7A928]/30' : 'bg-[#EAF7F1] border-[#1F9D73]/30'}`}>
                  <label className="text-xs font-bold text-[#123B3A] block mb-2">{t.stairsDiff}</label>
                  <select value={stairsDiff} onChange={e => setStairsDiff(Number(e.target.value))} className="w-full p-2.5 rounded-lg border border-[#D9E5E1] text-sm text-[#123B3A] focus:outline-none">
                    <option value={0}>0 - None (Normal)</option>
                    <option value={1}>1 - Mild (Slight pain)</option>
                    <option value={2}>2 - Moderate (Step-by-step)</option>
                    <option value={3}>3 - Severe (Unable)</option>
                  </select>
                </div>
              </div>

              <label className={`p-4 rounded-xl border flex items-center gap-4 cursor-pointer transition ${priorInjury ? 'bg-[#FFF5DD] border-[#E7A928]/30' : 'bg-[#F7F8F4] border-[#D9E5E1]'}`}>
                <input type="checkbox" checked={priorInjury} onChange={e => setPriorInjury(e.target.checked)} className="w-5 h-5 accent-[#064E49]" />
                <span className="text-sm font-bold text-[#123B3A]">{t.injuryHist}</span>
              </label>

              {activeSection === 'C' && (
                <div className="flex justify-between mt-6">
                  <button onClick={() => setActiveSection('B')} className="px-5 py-2.5 border border-[#D9E5E1] text-[#123B3A] text-xs font-bold rounded-lg flex items-center gap-2 hover:bg-[#F7F8F4]"><span className="material-symbols-outlined text-[16px]">arrow_back</span> Back</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Score Summary */}
        <div className="xl:col-span-4 sticky top-6">
          <div className="bg-white p-6 rounded-[14px] shadow-sm border border-[#D9E5E1] flex flex-col">
            <h3 className="text-[10px] uppercase font-bold text-[#58706D] tracking-widest text-center mb-2">Current Symptom Index</h3>
            
            <div className="flex flex-col items-center justify-center py-6">
              <div className={`text-6xl font-serif font-bold ${compositeScore >= 25 ? 'text-[#D9534F]' : compositeScore > 20 ? 'text-[#E7A928]' : 'text-[#1F9D73]'}`}>
                {compositeScore}
              </div>
              <div className="text-sm font-bold text-[#58706D] mt-1">/ 40</div>
              
              <div className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${compositeScore >= 25 ? 'bg-[#FDECEC] text-[#D9534F]' : compositeScore > 20 ? 'bg-[#FFF5DD] text-[#E7A928]' : 'bg-[#EAF7F1] text-[#1F9D73]'}`}>
                {riskTier}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-[#D9E5E1]">
               <div>
                 <div className="flex justify-between text-xs font-bold text-[#123B3A] mb-1"><span>Symptom Intensity</span><span>{Math.round((pain / 10) * 100)}%</span></div>
                 <div className="w-full bg-[#E5F3EE] h-1.5 rounded-full overflow-hidden"><div className="bg-[#064E49] h-full" style={{width: `${(pain / 10) * 100}%`}}></div></div>
               </div>
               <div>
                 <div className="flex justify-between text-xs font-bold text-[#123B3A] mb-1"><span>Workload Overload</span><span>{Object.values(workloadMatrix).filter(Boolean).length * 20}%</span></div>
                 <div className="w-full bg-[#E5F3EE] h-1.5 rounded-full overflow-hidden"><div className="bg-[#064E49] h-full" style={{width: `${Object.values(workloadMatrix).filter(Boolean).length * 20}%`}}></div></div>
               </div>
               <div>
                 <div className="flex justify-between text-xs font-bold text-[#123B3A] mb-1"><span>Functional Restriction</span><span>{Math.round(((walkDiff + stairsDiff) / 6) * 100)}%</span></div>
                 <div className="w-full bg-[#E5F3EE] h-1.5 rounded-full overflow-hidden"><div className="bg-[#064E49] h-full" style={{width: `${((walkDiff + stairsDiff) / 6) * 100}%`}}></div></div>
               </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[#D9E5E1] flex flex-col gap-3">
              <button onClick={handleSubmit} disabled={isSaving} className="w-full py-3 bg-[#064E49] text-white text-sm font-bold rounded-lg hover:bg-[#073F3B] transition-colors">
                {isSaving ? 'Calculating...' : t.calcScore}
              </button>
              <button onClick={handleResetForm} className="w-full py-3 bg-white text-[#58706D] text-sm font-bold border border-[#D9E5E1] rounded-lg hover:bg-[#F7F8F4] transition-colors">
                {t.reset}
              </button>
            </div>
            
            {surveyOutcome && (
              <div className="mt-4 p-4 rounded-xl bg-[#EAF7F1] border border-[#1F9D73]/30 text-xs">
                <div className="font-bold text-[#1F9D73] mb-1">Survey Synced!</div>
                <div className="text-[#123B3A]">{surveyOutcome.recommendation}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
