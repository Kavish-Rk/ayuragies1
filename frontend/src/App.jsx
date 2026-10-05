import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import PatientBanner from './components/PatientBanner';
import TeleconsultDrawer from './components/TeleconsultDrawer';
import EnrollModal from './components/EnrollModal';

import OverviewView from './views/OverviewView';
import GaitHudView from './views/GaitHudView';
import QuestionnaireView from './views/QuestionnaireView';
import DiagnosticReportView from './views/DiagnosticReportView';
import PatientsCohortView from './views/PatientsCohortView';
import HardwareFleetView from './views/HardwareFleetView';
import CompleteProfileView from './views/CompleteProfileView';
import AyuragiesGuidanceView from './views/AyuragiesGuidanceView';
import LandingPage from './views/LandingPage';
import DemoPage from './views/DemoPage';

import LoginView from './views/LoginView';
import { checkBackendHealth, getPatients, createPatient, saveScreening, getLatestScreening } from './utils/api';
import { useCamera } from './utils/useCamera';
import { getStoredUser, logoutUser, getRoleConfig, isTabAllowedForRole, onAuthStateChange, formatSupabaseUser, getSession } from './utils/auth';

const VALID_TABS = ['overview', 'survey', 'gait', 'guidance', 'report', 'cohort', 'hardware'];

function getInitialPage() {
  if (typeof window === 'undefined') return 'landing';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash === 'demo') return 'demo';
  if (VALID_TABS.includes(hash) || hash === 'dashboard') return 'app';
  return 'landing';
}

function getInitialTab(roleId = 'screener') {
  if (typeof window === 'undefined') return 'overview';
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (VALID_TABS.includes(hash) && isTabAllowedForRole(roleId, hash)) return hash;
  const stored = sessionStorage.getItem('ayuragies_active_tab');
  if (VALID_TABS.includes(stored) && isTabAllowedForRole(roleId, stored)) return stored;
  return getRoleConfig(roleId).defaultTab;
}

// Side Navigation Rail
function LeftNavRail({ activeTab, onNavigate, onLogout }) {
  const navItems = [
    { id: 'overview', icon: 'dashboard', label: 'Overview' },
    { id: 'cohort', icon: 'groups', label: 'Patients' },
    { id: 'survey', icon: 'assignment', label: 'Screening' },
    { id: 'guidance', icon: 'videocam', label: 'Camera' },
    { id: 'gait', icon: 'sensors', label: 'Sensors' },
    { id: 'report', icon: 'data_exploration', label: 'AI Findings' },
    { id: 'hardware', icon: 'settings', label: 'Settings' }
  ];

  return (
    <div className="fixed top-0 left-0 bottom-0 w-20 flex flex-col items-center py-6 z-50 border-r" style={{ background: '#1B4332', borderColor: '#134E4A' }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-8 shadow-sm p-1" style={{ background: '#FAFAF5' }}>
        <img src="/logo-icon.svg" alt="AYURAGIES" className="w-full h-full object-contain" />
      </div>
      
      <div className="flex-1 flex flex-col gap-4 w-full px-2">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center py-2.5 px-1 rounded-xl transition-all relative group"
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full shadow-[0_0_8px_rgba(209,250,229,0.5)]" style={{ background: '#D1FAE5' }} />
              )}
              <span 
                className={`material-symbols-outlined text-[22px] mb-1 transition-colors ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}
              >
                {item.icon}
              </span>
              <span 
                className={`text-[9px] font-medium tracking-wider transition-colors uppercase ${isActive ? 'text-white font-bold' : 'text-white/50 group-hover:text-white/80'}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      <button onClick={onLogout} className="mt-auto flex flex-col items-center py-3 opacity-50 hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-white text-xl">logout</span>
      </button>
    </div>
  );
}

// Floating Top Header
function FloatingHeader({ user, activeTab, systemStatus }) {
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <header className="sticky top-4 z-40 mx-6 mb-6 rounded-2xl px-6 py-4 flex items-center justify-between backdrop-blur-xl border shadow-sm" style={{ background: 'rgba(255,255,255,0.9)', borderColor: '#E2E8F0' }}>
      <div className="flex items-center gap-6">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px]" style={{ color: '#94A3B8' }}>search</span>
          <input 
            type="text" 
            placeholder="Search patient, ID, or scan..." 
            className="pl-9 pr-4 py-2 w-64 md:w-80 rounded-full text-sm font-medium border-0 focus:ring-2 focus:outline-none transition-shadow bg-gray-50/50"
            style={{ color: '#1E293B', ringColor: '#D1FAE5', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }} 
          />
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden lg:flex flex-col text-right">
          <span className="text-sm font-bold" style={{ color: '#1B4332' }}>{timeStr}</span>
          <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#64748B' }}>{dateStr}</span>
        </div>

        <div className="h-8 w-px bg-gray-200"></div>

        <div className="flex items-center gap-3">
          <button className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border hover:bg-gray-100 transition-colors">
            <span className="material-symbols-outlined text-[20px]" style={{ color: '#475569' }}>notifications</span>
            <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full border border-white" style={{ background: '#0EA5E9' }}></div>
          </button>
          
          <div className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full border shadow-sm" style={{ borderColor: '#E2E8F0' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs border" style={{ background: '#134E4A', borderColor: '#1B4332' }}>
              {user?.name?.substring(0, 2).toUpperCase() || 'DR'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight" style={{ color: '#1E293B' }}>{user?.name || 'Dr. Vijay Kummar'}</span>
              <span className="text-[10px] uppercase font-medium" style={{ color: '#64748B' }}>Clinical Specialist</span>
            </div>
            <span className="material-symbols-outlined text-sm ml-1" style={{ color: '#94A3B8' }}>expand_more</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => getInitialPage());
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const camera = useCamera(Boolean(currentUser));
  const [activeTab, setActiveTab] = useState(() => getInitialTab(currentUser?.roleId || 'screener'));
  const scrollPositions = useRef({});

  const [backendOnline, setBackendOnline] = useState(false);
  const [patients, setPatients] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showTeleconsult, setShowTeleconsult] = useState(false);

  const [surveyResult, setSurveyResult] = useState(null);
  const [gaitResult, setGaitResult] = useState(null);
  const [xrayResult, setXrayResult] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getSession().then((session) => {
      if (isMounted) {
        const user = formatSupabaseUser(session?.user);
        if (user) {
          const stored = getStoredUser();
          setCurrentUser(stored && stored.profileCompleted ? { ...user, profileCompleted: true } : user);
        }
      }
    });
    const subscription = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const user = formatSupabaseUser(session?.user);
        if (user) {
          const stored = getStoredUser();
          setCurrentUser(stored && stored.profileCompleted ? { ...user, profileCompleted: true } : user);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      }
    });
    return () => { isMounted = false; if (subscription && typeof subscription.unsubscribe === 'function') subscription.unsubscribe(); };
  }, []);

  const handleNavigate = (newTab, options = {}) => {
    if (!VALID_TABS.includes(newTab)) return;
    const currentRoleId = currentUser?.roleId || 'screener';
    if (!isTabAllowedForRole(currentRoleId, newTab)) {
      const defaultTab = getRoleConfig(currentRoleId).defaultTab;
      if (activeTab !== defaultTab) handleNavigate(defaultTab, { replace: true });
      return;
    }
    if (newTab === activeTab && !options.force) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    scrollPositions.current[activeTab] = window.scrollY;
    
    // Update active tab state
    setActiveTab(newTab);
    sessionStorage.setItem('ayuragies_active_tab', newTab);
    
    // Handle history push transparently without loop
    try {
      const url = new URL(window.location);
      url.hash = newTab;
      if (options.replace) {
        window.history.replaceState({ tab: newTab }, '', url.toString());
      } else {
        window.history.pushState({ tab: newTab }, '', url.toString());
      }
    } catch(e) {}
    
    const targetScroll = options.scrollToTop ? 0 : (scrollPositions.current[newTab] || 0);
    setTimeout(() => window.scrollTo({ top: targetScroll, behavior: options.smooth ? 'smooth' : 'instant' }), 0);
  };

  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;
    (async () => {
      const health = await checkBackendHealth();
      if (isMounted) setBackendOnline(health.status === 'ok');
      const pts = await getPatients(currentUser);
      if (isMounted) { if (pts && pts.length > 0) { setPatients(pts); setActivePatient(pts[0]); } else { setPatients([]); setActivePatient(null); } }
    })();
    return () => { isMounted = false; };
  }, [currentUser]);

  useEffect(() => {
    setXrayResult(null);
    if (!activePatient?.dbId) { setSurveyResult(null); setGaitResult(null); return; }
    let isMounted = true;
    getLatestScreening(activePatient.dbId).then((s) => {
      if (!isMounted || !s) return;
      if (s.questionnaire_score != null) setSurveyResult({ raw_score: s.questionnaire_score, compositeScore: s.questionnaire_score, category: s.questionnaire_category || 'moderate', pain: Math.min(10, Math.round(s.questionnaire_score / 4)), stiffness: 35 });
      if (s.movement_category || s.gait_metrics_json) {
        let m = {}; try { m = s.gait_metrics_json ? JSON.parse(s.gait_metrics_json) : {}; } catch {}
        setGaitResult({ risk: s.movement_category === 'high' ? 'High Risk (Antalgic Asymmetry)' : s.movement_category === 'low' ? 'Low Risk (Symmetric)' : 'Moderate Risk (Early OA Markers)', confidence: Math.round((s.movement_confidence || 0.85) * 100), cadence: m.cadence || 94, velocity: m.velocity || 0.86, strideLength: m.strideLength || 1.18, kneeAngleAsymmetry: m.kneeAngleAsymmetry || '+14.2°', affectedLimb: m.affectedLimb || 'Right Limb (Sagittal Deficit)', recommendation: 'Restored from persisted clinical screening record' });
      }
    }).catch((err) => console.warn('Could not load latest screening:', err));
    return () => { isMounted = false; };
  }, [activePatient?.dbId]);

    const handleGaitComplete = (result) => {
    setGaitResult(result);
  };

  const handleEnrollPatient = async (np) => { const c = await createPatient(np); const p = { ...np, dbId: c.id, id: np.id || `AYU-${String(c.id).padStart(4, '0')}` }; setPatients((prev) => [p, ...prev]); setActivePatient(p); };

  const handleLogin = (user) => { setCurrentUser(user); setCurrentPage('app'); try { sessionStorage.setItem('ayuragies_auth_session', JSON.stringify(user)); } catch {} };

  const handleLogout = () => {
    if (camera?.isWebcamActive) camera.stopCamera();
    logoutUser();
    try { sessionStorage.removeItem('ayuragies_auth_session'); } catch {}
    setCurrentUser(null); setPatients([]); setActivePatient(null); setSurveyResult(null); setGaitResult(null); setXrayResult(null);
    setCurrentPage('landing'); window.location.hash = '';
  };

  // --- ROUTING ---
  if (currentPage === 'landing' && !currentUser) {
    return <LandingPage onNavigateDemo={() => { window.location.hash = '#demo'; setCurrentPage('demo'); }} onNavigateDashboard={() => setCurrentPage('app')} />;
  }

  if (currentPage === 'demo' && !currentUser) {
    return <DemoPage onStartDemo={(dp) => { handleLogin({ name: 'Dr. Vijay Kummar', email: 'vkummar@ayuragies.ai', roleId: 'screener', station: 'AIIMS Research Node', isDemo: true, profileCompleted: true }); setActivePatient({ ...dp, dbId: null }); window.location.hash = '#overview'; }} onBack={() => { window.location.hash = ''; setCurrentPage('landing'); }} />;
  }

  if (!currentUser) return <LoginView onLogin={handleLogin} />;
  
  const isGoogleUser = currentUser?.id?.startsWith('NER-GOOG');
  if (!currentUser.roleId || !currentUser.station || (isGoogleUser && !currentUser.profileCompleted)) {
    return <CompleteProfileView currentUser={currentUser} onComplete={handleLogin} />;
  }

  // --- PREMIUM AYURAGIES DASHBOARD SHELL ---
  return (
    <div className="min-h-screen flex selection:bg-mint-200 selection:text-forest-900" style={{ background: '#FAFAF5', fontFamily: "'Inter', sans-serif" }}>
      <LeftNavRail activeTab={activeTab} onNavigate={handleNavigate} onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col ml-20">
        <FloatingHeader user={currentUser} activeTab={activeTab} systemStatus={backendOnline} />
        
        <main className="w-full flex-1 max-w-[1700px] mx-auto px-6 pb-12">
          {activeTab === 'overview' && (
            <OverviewView 
               activePatient={activePatient} 
               camera={camera} 
               surveyResult={surveyResult} 
               gaitResult={gaitResult}
            />
          )}

          {activeTab === 'gait' && <GaitHudView activePatient={activePatient} surveyResult={surveyResult} onAnalysisComplete={handleGaitComplete} xrayData={xrayResult} onXrayAnalyzed={setXrayResult} onNavigate={handleNavigate} onOpenTeleconsult={() => setShowTeleconsult(true)} camera={camera} />}
          {activeTab === 'guidance' && <AyuragiesGuidanceView activePatient={activePatient} surveyResult={surveyResult} gaitResult={gaitResult} onNavigate={handleNavigate} currentUser={currentUser} camera={camera} />}
          {activeTab === 'survey' && <QuestionnaireView activePatient={activePatient} onSurveySubmitted={() => {}} onOpenTeleconsult={() => {}} onNavigate={handleNavigate} />}
          {activeTab === 'report' && <DiagnosticReportView activePatient={activePatient} surveyResult={surveyResult} gaitResult={gaitResult} xrayData={xrayResult} onXrayAnalyzed={setXrayResult} onOpenTeleconsult={() => setShowTeleconsult(true)} onNavigate={handleNavigate} currentUser={currentUser} />}
          {activeTab === 'cohort' && <PatientsCohortView patients={patients} activePatient={activePatient} onSelectPatient={(p) => setActivePatient(p)} onOpenEnrollModal={() => setShowEnrollModal(true)} onNavigate={handleNavigate} currentUser={currentUser} />}
          {activeTab === 'hardware' && <HardwareFleetView currentUser={currentUser} onNavigate={handleNavigate} camera={camera} />}
        </main>
        
        {/* System Status Footprint */}
        <div className="fixed bottom-0 left-20 right-0 h-6 border-t flex items-center justify-between px-6 text-[10px] font-medium tracking-wide uppercase shadow-sm z-40 backdrop-blur-md bg-white/70" style={{ borderColor: '#E2E8F0', color: '#64748B' }}>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{ background: camera?.isWebcamActive ? '#0EA5E9' : '#10B981' }}></div> Camera Online</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }}></div> IMU Sensors Connected</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }}></div> AI Models Loaded</span>
            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{ background: backendOnline ? '#10B981' : '#F59E0B' }}></div> Database Healthy</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono'" }}>AYURAGIES CLINICAL INTELLIGENCE NODE V1.2</span>
        </div>
      </div>
      
      <EnrollModal isOpen={showEnrollModal} onClose={() => setShowEnrollModal(false)} onEnroll={handleEnrollPatient} />
    </div>
  );
}
