import React, { useState } from 'react';

const DEMO_PATIENTS = [
  { id: 'DEMO-001', name: 'Shalu Anand', age: 46, sex: 'Female', occupation: 'Desk Executive', screeningType: 'Knee Pain Assessment', status: 'New Screening', statusColor: '#0EA5E9', avatar: 'SA' },
  { id: 'DEMO-002', name: 'Rajesh Kumar', age: 62, sex: 'Male', occupation: 'Agricultural Worker', screeningType: 'Post-operative Follow-up', status: 'Follow-up', statusColor: '#F59E0B', avatar: 'RK' },
  { id: 'DEMO-003', name: 'Meera Patel', age: 55, sex: 'Female', occupation: 'Teacher', screeningType: 'Bilateral Knee Assessment', status: 'Re-screening', statusColor: '#8B5CF6', avatar: 'MP' },
  { id: 'DEMO-004', name: 'Arjun Singh', age: 38, sex: 'Male', occupation: 'Construction Worker', screeningType: 'Occupational Risk Screening', status: 'New Screening', statusColor: '#0EA5E9', avatar: 'AS' },
];

export default function DemoPage({ onStartDemo, onBack }) {
    const [selected, setSelected] = useState(null);
  const [step, setStep] = useState(1);
  const [demoRole, setDemoRole] = useState(null);

  const selectedPatient = DEMO_PATIENTS.find(p => p.id === selected);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAF5', fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 flex items-center justify-between h-14">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70" style={{ color: '#1B4332' }}>
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center">
              <img src="/logo-icon.svg" alt="AYURAGIES Icon" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold tracking-tight" style={{ color: '#1B4332' }}>AYURAGIES</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/AYURAGIES.apk" download className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border-2 transition-all hover:bg-slate-50" style={{ color: '#1B4332', borderColor: '#E2E8F0', background: 'white' }}>
              <span className="material-symbols-outlined text-[18px]">android</span>
              Download APK
            </a>
          </div>
        </div>
      </div>

      {/* DEMO BANNER */}
      <div className="px-6 lg:px-8 pt-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-xl px-5 py-3 flex items-start gap-3" style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
            <span className="material-symbols-outlined text-xl mt-0.5" style={{ color: '#92400E' }}>info</span>
            <div>
              <div className="text-sm font-bold" style={{ color: '#92400E' }}>DEMONSTRATION MODE \u2022 SYNTHETIC DATA</div>
              <div className="text-xs mt-0.5" style={{ color: '#B45309' }}>This demonstration uses synthetic/sample data and does not represent real patient measurements or medical conclusions.</div>
            </div>
          </div>
        </div>
      </div>

            {/* CONTENT */}
      <div className="flex-1 px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {step === 1 ? (
            <div className="max-w-xl mx-auto bg-white p-10 rounded-2xl border border-slate-200 shadow-sm mt-8 animate-fade-in" style={{ borderColor: '#E2E8F0' }}>
              <div className="text-center mb-10">
                 <h1 className="text-2xl font-bold tracking-tight text-slate-800 mb-2">Demo Access Portal</h1>
                 <p className="text-sm text-slate-500">Select your active role to enter the testing environment.</p>
              </div>
              <div className="flex flex-col gap-4">
                 <button onClick={() => { setDemoRole('hospital'); setStep(2); }} className="flex items-center gap-5 p-4 border rounded-xl transition-all text-left hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: '#1B4332' }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{ background: '#1B4332' }}>
                      <span className="material-symbols-outlined">domain</span>
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-800 text-sm">Hospital Workspace</h3>
                       <p className="text-xs text-slate-500 mt-0.5">Fleet management, cohorts & hardware</p>
                    </div>
                 </button>
                 <button onClick={() => { setDemoRole('doctor'); setStep(2); }} className="flex items-center gap-5 p-4 border rounded-xl transition-all text-left hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: '#1B4332' }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{ background: '#1B4332' }}>
                      <span className="material-symbols-outlined">stethoscope</span>
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-800 text-sm">Clinical Doctor</h3>
                       <p className="text-xs text-slate-500 mt-0.5">Screenings, AI assessments & reports</p>
                    </div>
                 </button>
                 <button onClick={() => { setDemoRole('patient'); setStep(2); }} className="flex items-center gap-5 p-4 border rounded-xl transition-all text-left hover:-translate-y-0.5 hover:shadow-md" style={{ borderColor: '#1B4332' }}>
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{ background: '#1B4332' }}>
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-800 text-sm">Patient Portal</h3>
                       <p className="text-xs text-slate-500 mt-0.5">Self-guided assessment & history</p>
                    </div>
                 </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-10">
                <button onClick={() => setStep(1)} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition" style={{ color: '#1B4332' }}>
                   <span className="material-symbols-outlined text-sm">arrow_back</span>
                </button>
                <div className="text-left">
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-800 mb-1">Choose a patient to begin</h1>
                  <p className="text-sm text-slate-500">Select a demo patient profile to start the screening workflow</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
                {DEMO_PATIENTS.map((patient) => {
                  const isSelected = selected === patient.id;
                  return (
                    <button
                      key={patient.id}
                      onClick={() => setSelected(patient.id)}
                      className={`text-left rounded-xl p-5 border-2 transition-all hover:shadow-md ${isSelected ? 'shadow-lg scale-[1.01]' : 'hover:-translate-y-0.5'}`}
                      style={{
                        background: isSelected ? '#F0FDF4' : '#FFFFFF',
                        borderColor: isSelected ? '#1B4332' : '#E2E8F0',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm" style={{ background: isSelected ? '#1B4332' : '#64748B' }}>
                          {patient.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-base" style={{ color: '#1E293B' }}>{patient.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: patient.statusColor + '18', color: patient.statusColor }}>{patient.status}</span>
                          </div>
                          <div className="text-xs mb-2.5" style={{ color: '#64748B', fontFamily: "'JetBrains Mono'" }}>{patient.id}</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div><span style={{ color: '#94A3B8' }}>Age/Sex:</span> <span style={{ color: '#475569' }}>{patient.age}y {patient.sex}</span></div>
                            <div><span style={{ color: '#94A3B8' }}>Occupation:</span> <span style={{ color: '#475569' }}>{patient.occupation}</span></div>
                            <div className="col-span-2"><span style={{ color: '#94A3B8' }}>Screening:</span> <span className="font-medium" style={{ color: '#1B4332' }}>{patient.screeningType}</span></div>
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: '#D1FAE5' }}>
                          <span className="material-symbols-outlined text-lg" style={{ color: '#1B4332' }}>check_circle</span>
                          <span className="text-xs font-semibold" style={{ color: '#1B4332' }}>Selected for demo screening</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
{/* BOTTOM ACTION BAR */}
      {selectedPatient && (
        <div className="sticky bottom-0 z-40 border-t bg-white/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.06)]" style={{ borderColor: '#E2E8F0' }}>
          <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: '#1B4332' }}>
                {selectedPatient.avatar}
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: '#1E293B' }}>{selectedPatient.name}</div>
                <div className="text-xs" style={{ color: '#64748B' }}>{selectedPatient.screeningType} \u2022 {selectedPatient.age}y {selectedPatient.sex}</div>
              </div>
            </div>
            <button
              onClick={() => onStartDemo({ id: selectedPatient.id, name: selectedPatient.name, age: selectedPatient.age, sex: selectedPatient.sex, occupation: selectedPatient.occupation, screeningType: selectedPatient.screeningType, dbId: null, isDemo: true })}
              className="px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1B4332, #134E4A)' }}
            >
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              START DEMO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
