import React, { useState, useEffect, useRef } from 'react';


const CAPABILITIES = [
  { icon: 'videocam', title: 'Camera Gait Analysis', desc: 'Browser-based MediaPipe pose tracking. Hip-Knee-Ankle landmark extraction with real-time knee angle geometry, confidence filtering, and temporal smoothing.' },
  { icon: 'sensors', title: 'IMU Motion Analysis', desc: 'Inertial measurement unit data acquisition for gait velocity, cadence, stride length asymmetry, and sagittal-plane kinematics.' },
  { icon: 'clinical_notes', title: 'Clinical Assessment', desc: 'Validated musculoskeletal questionnaires \u2014 WOMAC, Lequesne, VAS pain scales \u2014 with composite scoring and risk stratification.' },
  { icon: 'architecture', title: 'Biomechanics Engine', desc: 'Vector-based joint angle computation: acos(dot(v1,v2)/(|v1|\u00b7|v2|)). Left/right knee tracking, movement state machine, repetition counting.' },
  { icon: 'psychology', title: 'AI & Analytics', desc: 'Machine learning risk classification, recommendation engine, safety checks, nutrition guidance, and exercise prescription.' },
  { icon: 'memory', title: 'Edge Processing', desc: 'All computation runs locally in the browser and on-device. No cloud dependency for pose detection or angle measurement.' },
  { icon: 'science', title: 'Research Infrastructure', desc: 'SQLite persistence, PDF report generation, patient cohort management, and longitudinal tracking for clinical studies.' },
];

const PIPELINE = [
  { icon: 'person', label: 'Patient', sub: 'Demographics' },
  { icon: 'videocam', label: 'Camera', sub: 'MediaPipe Pose' },
  { icon: 'sensors', label: 'IMU', sub: 'Motion Data' },
  { icon: 'quiz', label: 'Questionnaire', sub: 'WOMAC/VAS' },
  { icon: 'analytics', label: 'Analysis', sub: 'AI Risk Engine' },
  { icon: 'description', label: 'Report', sub: 'PDF / Clinical' },
];

const TECH = [
  { name: 'MediaPipe', desc: 'Real-time pose detection' },
  { name: 'TensorFlow', desc: 'ML risk classification' },
  { name: 'FastAPI', desc: 'Backend API server' },
  { name: 'SQLite', desc: 'Local data persistence' },
  { name: 'React', desc: 'Frontend framework' },
  { name: 'Vite', desc: 'Build toolchain' },
];

export default function LandingPage({ onNavigateDemo, onNavigateDashboard }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF5', fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}>

      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
              <img src="/logo-icon.svg" alt="AYURAGIES Icon" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: '#1B4332' }}>AYURAGIES</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[['Home', () => scrollTo('hero')], ['Features', () => scrollTo('capabilities')], ['How It Works', () => scrollTo('pipeline')], ['Technology', () => scrollTo('tech')]].map(([label, fn]) => (
              <button key={label} onClick={fn} className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: '#1E293B' }}>{label}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onNavigateDemo} className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]" style={{ background: '#1B4332' }}>
              TRY DEMO
            </button>
            <button onClick={onNavigateDashboard} className="px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all hover:opacity-80" style={{ color: '#1B4332', borderColor: '#1B4332' }}>
              SIGN IN
            </button>
            <a href="/AYURAGIES.apk" download className="px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all hover:opacity-80 flex items-center gap-1" style={{ color: '#1E293B', borderColor: '#E2E8F0', background: '#ffffff' }}>
              <span className="material-symbols-outlined text-[16px]">android</span>
              APP
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero" className="pt-28 pb-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6" style={{ background: '#D1FAE5', color: '#1B4332' }}>
              <span className="material-symbols-outlined text-sm">science</span>
              Research Prototype \u2014 v1.0
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-6" style={{ color: '#1E293B' }}>
              Measure movement.<br />
              <span style={{ color: '#1B4332' }}>Understand risk.</span><br />
              Support earlier care.
            </h1>
            <p className="text-lg leading-relaxed mb-8" style={{ color: '#475569' }}>
              Camera-based knee angle tracking, biomechanical analysis, and AI-powered risk stratification \u2014 all running locally in your browser. No cloud. No special hardware.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={onNavigateDemo} className="px-8 py-3.5 rounded-xl text-base font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] shadow-lg active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #1B4332, #134E4A)' }}>
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">play_arrow</span>
                  Start Demo
                </span>
              </button>
              <button onClick={() => scrollTo('capabilities')} className="px-6 py-3.5 rounded-xl text-base font-semibold transition-all hover:opacity-80" style={{ color: '#1B4332' }}>
                Learn More \u2192
              </button>
            </div>
          </div>

          {/* HERO SVG */}
          <div className="flex-1 flex justify-center">
            <svg viewBox="0 0 400 400" className="w-80 h-80 lg:w-96 lg:h-96">
              <defs>
                <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#1B4332" stopOpacity="0.15"/>
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.08"/>
                </linearGradient>
                <linearGradient id="boneGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B4332"/>
                  <stop offset="100%" stopColor="#134E4A"/>
                </linearGradient>
              </defs>
              <circle cx="200" cy="200" r="180" fill="url(#arcGrad)" stroke="#D1FAE5" strokeWidth="1.5"/>
              <circle cx="200" cy="200" r="140" fill="none" stroke="#1B4332" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.3"/>
              <circle cx="200" cy="200" r="100" fill="none" stroke="#134E4A" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.2"/>
              <circle cx="200" cy="120" r="8" fill="#1B4332" opacity="0.9"/>
              <text x="220" y="118" fontSize="11" fill="#1B4332" fontWeight="600" fontFamily="'JetBrains Mono'">HIP</text>
              <circle cx="200" cy="210" r="10" fill="#0EA5E9" stroke="#1B4332" strokeWidth="2"/>
              <text x="222" y="208" fontSize="11" fill="#0EA5E9" fontWeight="700" fontFamily="'JetBrains Mono'">KNEE</text>
              <circle cx="240" cy="310" r="7" fill="#1B4332" opacity="0.9"/>
              <text x="256" y="308" fontSize="11" fill="#1B4332" fontWeight="600" fontFamily="'JetBrains Mono'">ANKLE</text>
              <line x1="200" y1="128" x2="200" y2="200" stroke="url(#boneGrad)" strokeWidth="3" strokeLinecap="round"/>
              <line x1="200" y1="220" x2="240" y2="303" stroke="url(#boneGrad)" strokeWidth="3" strokeLinecap="round"/>
              <path d="M 200 170 A 40 40 0 0 1 222 248" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="4 3" opacity="0.8"/>
              <rect x="134" y="228" width="56" height="24" rx="6" fill="#0EA5E9" opacity="0.12"/>
              <text x="162" y="244" fontSize="12" fill="#0EA5E9" fontWeight="700" textAnchor="middle" fontFamily="'JetBrains Mono'">{'\u03b8 = f(t)'}</text>
              {[{x:80, y:160}, {x:120, y:280}, {x:310, y:150}, {x:320, y:260}, {x:160, y:340}].map((p, i) => (
                <g key={i}>
                  <circle cx={p.x} cy={p.y} r="3" fill="#1B4332" opacity="0.25"/>
                  <circle cx={p.x} cy={p.y} r="6" fill="none" stroke="#1B4332" strokeWidth="0.5" opacity="0.15"/>
                </g>
              ))}
              <line x1="70" y1="120" x2="70" y2="310" stroke="#1B4332" strokeWidth="0.7" opacity="0.15"/>
              <line x1="65" y1="120" x2="75" y2="120" stroke="#1B4332" strokeWidth="0.7" opacity="0.15"/>
              <line x1="65" y1="310" x2="75" y2="310" stroke="#1B4332" strokeWidth="0.7" opacity="0.15"/>
              <text x="60" y="220" fontSize="9" fill="#1B4332" opacity="0.3" textAnchor="middle" transform="rotate(-90 60 220)" fontFamily="'JetBrains Mono'">SAGITTAL</text>
            </svg>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="py-6 px-6 lg:px-8" style={{ background: '#1B4332' }}>
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-8 text-white">
          {[['17', 'Exercise Library'], ['33', 'Pose Landmarks'], ['<100ms', 'Latency'], ['0', 'Cloud Dependencies']].map(([val, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl lg:text-3xl font-bold" style={{ fontFamily: "'JetBrains Mono'" }}>{val}</div>
              <div className="text-xs uppercase tracking-wide opacity-70 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4" style={{ color: '#1E293B' }}>Capabilities</h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: '#64748B' }}>Integrated modules for comprehensive musculoskeletal screening</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {CAPABILITIES.map((cap, i) => (
              <div key={i} className="group bg-white rounded-xl p-6 border transition-all hover:shadow-lg hover:-translate-y-0.5" style={{ borderColor: '#E2E8F0' }}>
                <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ background: '#D1FAE5' }}>
                  <span className="material-symbols-outlined text-xl" style={{ color: '#1B4332' }}>{cap.icon}</span>
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: '#1E293B' }}>{cap.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="pipeline" className="py-20 px-6 lg:px-8" style={{ background: '#F1F5F9' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4" style={{ color: '#1E293B' }}>How It Works</h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#64748B' }}>End-to-end screening pipeline in six steps</p>
          </div>
          <div className="flex flex-wrap items-start justify-center gap-4 lg:gap-6">
            {PIPELINE.map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center text-center w-28">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm" style={{ background: '#1B4332' }}>
                    <span className="material-symbols-outlined text-2xl text-white">{step.icon}</span>
                  </div>
                  <div className="text-sm font-bold" style={{ color: '#1E293B' }}>{step.label}</div>
                  <div className="text-xs mt-1" style={{ color: '#64748B' }}>{step.sub}</div>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="hidden lg:flex items-center pt-5">
                    <span className="material-symbols-outlined text-xl" style={{ color: '#CBD5E1' }}>chevron_right</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* TECHNOLOGY */}
      <section id="tech" className="py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4" style={{ color: '#1E293B' }}>Technology Stack</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {TECH.map((t, i) => (
              <div key={i} className="bg-white rounded-xl p-5 text-center border transition-all hover:shadow-md" style={{ borderColor: '#E2E8F0' }}>
                <div className="text-base font-bold mb-1" style={{ color: '#1B4332', fontFamily: "'JetBrains Mono'" }}>{t.name}</div>
                <div className="text-xs" style={{ color: '#64748B' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* CTA */}
      <section className="py-20 px-6 lg:px-8" style={{ background: 'linear-gradient(135deg, #1B4332, #134E4A)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to explore?</h2>
          <p className="text-base text-white/70 mb-8 max-w-lg mx-auto">Run the complete screening pipeline with synthetic demo data. No signup required.</p>
          <button onClick={onNavigateDemo} className="px-10 py-4 rounded-xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl" style={{ background: '#D1FAE5', color: '#1B4332' }}>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined">rocket_launch</span>
              Launch Demo
            </span>
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 lg:px-8" style={{ background: '#0F172A' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: '#94A3B8' }}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">AYURAGIES</span>
            <span>\u00b7</span>
            <span>AI Movement Screening Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="px-2 py-0.5 rounded text-xs" style={{ background: '#1E293B', color: '#94A3B8', fontFamily: "'JetBrains Mono'" }}>Research Prototype</span>
            <span style={{ fontFamily: "'JetBrains Mono'" }}>v1.0.0</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-4 pt-4 border-t text-center text-xs" style={{ borderColor: '#1E293B', color: '#475569' }}>
          This tool is for research and educational use only. Not a medical device. Not clinically validated. Does not provide medical advice, diagnosis, or treatment.
        </div>
      </footer>
    </div>
  );
}
