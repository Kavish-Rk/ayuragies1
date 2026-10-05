import React, { useEffect, useState } from 'react';
import CameraViewport from '../components/CameraViewport';

// SVG components to keep file clean
const KneeVisualization = () => (
  <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-lg border" style={{ background: 'radial-gradient(circle at center, #134E4A 0%, #022c22 100%)', borderColor: '#0f3c39' }}>
    <svg viewBox="0 0 500 500" className="w-full h-full opacity-90">
      {/* Decorative medical grid */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#D1FAE5" strokeWidth="0.5" opacity="0.1"/>
        </pattern>
        <linearGradient id="femurGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#D1FAE5" stopOpacity="0.8"/>
        </linearGradient>
        <linearGradient id="tibiaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D1FAE5" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      {/* Anatomical guides */}
      <g stroke="#0EA5E9" strokeWidth="1" opacity="0.4" fontFamily="'JetBrains Mono', monospace" fontSize="10">
        <line x1="50" y1="250" x2="450" y2="250" strokeDasharray="4 4" />
        <line x1="250" y1="50" x2="250" y2="450" strokeDasharray="4 4" />
        <circle cx="250" cy="250" r="120" fill="none" strokeWidth="0.5" />
        <text x="60" y="240" fill="#0EA5E9">TRANSVERSE PLANE</text>
        <text x="260" y="70" fill="#0EA5E9">SAGITTAL AXIS</text>
      </g>

      {/* Abstracted Knee Joint - Femur */}
      <g transform="translate(180, 50)">
        <path d="M40,0 C40,70 30,120 20,150 C10,180 15,190 30,195 C50,200 65,185 70,170 C75,160 85,160 90,170 C95,185 110,200 130,195 C145,190 150,180 140,150 C130,120 120,70 120,0" fill="url(#femurGrad)" stroke="#ffffff" strokeWidth="1" opacity="0.9"/>
      </g>
      
      {/* Articular Cartilage & Joint Space */}
      <path d="M200,245 C230,250 270,250 300,245" fill="none" stroke="#D1FAE5" strokeWidth="6" opacity="0.7" strokeLinecap="round" filter="url(#glow)"/>
      <path d="M205,258 C230,255 270,255 295,258" fill="none" stroke="#D1FAE5" strokeWidth="5" opacity="0.5" strokeLinecap="round"/>
      
      {/* Abstracted Knee Joint - Tibia/Fibula */}
      <g transform="translate(185, 260)">
        <path d="M20,0 C40,-5 50,15 65,15 C80,15 90,-5 110,0 C120,10 110,60 110,190 L20,190 C20,60 10,10 20,0 Z" fill="url(#tibiaGrad)" stroke="#ffffff" strokeWidth="1" opacity="0.9"/>
        <path d="M125,10 C135,15 130,40 125,190 L115,190 C120,40 120,20 125,10 Z" fill="url(#tibiaGrad)" stroke="#ffffff" strokeWidth="1" opacity="0.6"/>
      </g>

      {/* Trajectory lines and AI detection points */}
      <path d="M250,50 Q280,250 210,450" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="8 4" opacity="0.8" filter="url(#glow)" />
      
      <circle cx="250" cy="150" r="5" fill="#fde047" stroke="#ffffff" strokeWidth="1.5" filter="url(#glow)"/>
      <circle cx="260" cy="250" r="6" fill="#fde047" stroke="#ffffff" strokeWidth="1.5" filter="url(#glow)"/>
      <circle cx="230" cy="350" r="5" fill="#fde047" stroke="#ffffff" strokeWidth="1.5" filter="url(#glow)"/>
      
      {/* Callouts */}
      <g transform="translate(330, 160)" fontFamily="'Inter', sans-serif">
        <line x1="-70" y1="90" x2="-20" y2="90" stroke="#fde047" strokeWidth="1" opacity="0.5" />
        <rect x="-20" y="70" width="120" height="40" rx="4" fill="rgba(0,0,0,0.5)" stroke="#1B4332" />
        <text x="-10" y="86" fill="#D1FAE5" fontSize="10" opacity="0.7">Joint Space</text>
        <text x="-10" y="102" fill="#ffffff" fontSize="14" fontWeight="bold">4.8 mm</text>
      </g>

      <g transform="translate(60, 200)" fontFamily="'Inter', sans-serif">
        <line x1="80" y1="50" x2="135" y2="50" stroke="#fde047" strokeWidth="1" opacity="0.5" />
        <rect x="-30" y="30" width="110" height="40" rx="4" fill="rgba(0,0,0,0.5)" stroke="#1B4332" />
        <text x="-20" y="46" fill="#D1FAE5" fontSize="10" opacity="0.7">Flexion Angle</text>
        <text x="-20" y="62" fill="#0EA5E9" fontSize="14" fontWeight="bold">32.6&deg;</text>
      </g>
    </svg>
    <div className="absolute top-4 left-4 flex gap-3 z-20">
      <span className="px-3 py-1.5 rounded-full bg-white text-[#0f3c39] text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
        <span className="material-symbols-outlined text-[14px]">view_in_ar</span> 3D Knee Reconstruction
      </span>
      <span className="px-3 py-1.5 rounded-full bg-white text-emerald-600 text-[10px] font-bold tracking-wider flex items-center gap-1.5 shadow-sm uppercase">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Live
      </span>
    </div>
    <div className="absolute left-4 top-16 flex flex-col gap-2 z-20">
      <button className="px-4 py-2 rounded-full bg-white text-[#0f3c39] text-[11px] font-bold flex items-center gap-2 shadow-sm w-32">
        <span className="material-symbols-outlined text-[16px]">visibility</span> 3D View
      </button>
      <button className="px-4 py-2 rounded-full bg-transparent text-white/80 hover:bg-white/10 text-[11px] font-bold flex items-center gap-2 transition w-32 text-left">
        <span className="material-symbols-outlined text-[16px]">flip_to_front</span> Front View
      </button>
      <button className="px-4 py-2 rounded-full bg-transparent text-white/80 hover:bg-white/10 text-[11px] font-bold flex items-center gap-2 transition w-32 text-left">
        <span className="material-symbols-outlined text-[16px]">flip_to_back</span> Side View
      </button>
      <button className="px-4 py-2 rounded-full bg-transparent text-white/80 hover:bg-white/10 text-[11px] font-bold flex items-center gap-2 transition w-32 text-left">
        <span className="material-symbols-outlined text-[16px]">layers</span> Axial View
      </button>
    </div>
  </div>
);

const LineWaveform = ({ color, name, value, unit }) => (
  <div className="flex flex-col gap-1 w-full relative h-[60px] border-b border-slate-100 last:border-0 pb-2 mb-2">
    <div className="flex justify-between items-end z-10 px-1">
      <span className="text-[11px] font-semibold text-slate-500">{name}</span>
      <span className="text-sm font-bold text-slate-800 font-mono">{value} <span className="text-[10px] font-normal text-slate-400">{unit}</span></span>
    </div>
    <div className="absolute bottom-1 w-full h-[30px]">
      <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full opacity-60">
        <path d="M0,15 Q10,5 20,15 T40,15 T60,5 T80,25 T100,15" fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M0,15 Q10,5 20,15 T40,15 T60,5 T80,25 T100,15 L100,30 L0,30 Z" fill={`url(#grad_${name})`} opacity="0.1"/>
        <defs>
          <linearGradient id={`grad_${name}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  </div>
);

const MotionGraph = () => (
  <div className="w-full min-h-[180px] bg-white rounded-xl border border-slate-200 p-4 relative overflow-hidden">
    <div className="flex justify-between items-center mb-6 z-10 relative">
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#134E4A]"></div><span className="text-[11px] font-medium text-slate-500 uppercase">Flexion</span></div>
        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#D1FAE5]"></div><span className="text-[11px] font-medium text-slate-500 uppercase">Extension</span></div>
      </div>
      <span className="text-[10px] text-slate-400 font-mono">14s WINDOW</span>
    </div>
    
    <div className="absolute inset-x-4 bottom-4 top-12">
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full text-slate-100">
        <g stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3">
          <line x1="0" y1="20" x2="400" y2="20" />
          <line x1="0" y1="50" x2="400" y2="50" />
          <line x1="0" y1="80" x2="400" y2="80" />
        </g>
        <path d="M0,80 C30,80 50,20 80,20 C110,20 130,80 160,80 C190,80 210,25 240,25 C270,25 290,75 320,75 C350,75 370,15 400,15" fill="none" stroke="#134E4A" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        <path d="M0,85 C35,85 55,25 85,25 C115,25 135,85 165,85 C195,85 215,30 245,30 C275,30 295,80 325,80 C355,80 375,20 400,20" fill="none" stroke="#D1FAE5" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

export default function OverviewView({ activePatient, camera }) {
  // Safe Fallback props for pure rendering
  const patient = activePatient || { name: 'Rohan Sharma', id: 'AYU-4587', age: 42, sex: 'Male' };
  
  return (
    <div className="flex flex-col gap-8 w-full max-w-[1500px] mx-auto animate-fade-in pb-10">
      
      {/* 1. HERO WORKSPACE AREA */}
      <div className="flex flex-col xl:flex-row gap-6 mt-4">
        
        {/* Editorial Text & Patient Context (Left side) */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h1 className="text-[2.25rem] md:text-[2.75rem] leading-[1.05] tracking-tight font-serif text-[#1B4332] mb-3">
              AI-Powered Knee<br />Health Intelligence
            </h1>
            <p className="text-[#64748B] text-lg font-medium tracking-wide">
              Real-time screening &middot; Motion analysis &middot; Better outcomes
            </p>
          </div>
          
          <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm max-w-2xl flex items-center gap-6 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#134E4A]" />
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#1B4332] font-serif text-xl border">
              {patient.name.substring(0,2).toUpperCase()}
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><div className="text-[10px] uppercase text-slate-500 font-bold mb-0.5">Patient</div><div className="text-sm font-bold text-slate-800">{patient.name}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500 font-bold mb-0.5">ID</div><div className="text-sm font-bold text-slate-800 font-mono">{patient.id}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500 font-bold mb-0.5">Demographics</div><div className="text-sm font-medium text-slate-800">{patient.age}y {patient.sex}</div></div>
              <div><div className="text-[10px] uppercase text-slate-500 font-bold mb-0.5">Status</div><div className="text-sm font-bold text-[#0EA5E9]">Screening...</div></div>
            </div>
          </div>
        </div>

        {/* Live Camera Feed (Right side embedded) */}
        <div className="xl:w-[480px] shrink-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
           <div className="flex justify-between items-center mb-3">
             <h3 className="text-sm font-bold text-[#1E293B] flex items-center gap-2">
               <span className="material-symbols-outlined text-[18px] text-[#134E4A]">logout</span> Live Camera Feed
             </h3>
             <div className={`px-2 py-0.5 rounded-full flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider ${camera?.isWebcamActive ? 'bg-white shadow-sm border border-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
               {camera?.isWebcamActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
               {camera?.isWebcamActive ? 'LIVE' : 'STANDBY'}
             </div>
           </div>
           
           <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 relative shadow-inner group">
             {/* When camera is active, render the real view over our abstract placeholder */}
             {camera?.isWebcamActive && (
               <div className="absolute inset-0 z-20">
                 <CameraViewport camera={camera} exercise={{ name: "Frontal plane screening", target: 90 }} hideGuides={true} />
               </div>
             )}
             
             {/* Futuristic placeholder silhouette layer (visible when standby or overlaid subtly) */}
             <div className="absolute inset-0 z-10 pointer-events-none opacity-40">
               <svg viewBox="0 0 200 100" className="w-full h-full">
                 <path d="M 100 0 C 110 30 110 50 100 80 L 100 100" fill="none" stroke="#0EA5E9" strokeWidth="0.5" strokeDasharray="1 2" />
                 <circle cx="100" cy="50" r="3" fill="none" stroke="#D1FAE5" strokeWidth="1" />
                 <path d="M 90 40 L 110 40 L 110 60 L 90 60 Z" fill="none" stroke="#10B981" strokeWidth="0.5" opacity="0.5"/>
               </svg>
               <div className="absolute bottom-2 left-2 text-[8px] font-mono text-cyan-400/70">
                 [AI_POSE_MESH_V4] INIT...<br />
                 LANDMARKS: 33 ACTIVE
               </div>
             </div>
             
             {!camera?.isWebcamActive && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <button onClick={camera?.startCamera} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">power_settings_new</span> Activate Vision
                  </button>
                </div>
             )}
           </div>
        </div>
      </div>
      
      {/* 2. MAIN WORKSPACE ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px_300px] gap-6 items-start">
        
        {/* Main 3D Panel */}
        <div className="flex flex-col gap-6">
          <KneeVisualization />
          
          {/* Motion Analysis Section */}
          <div className="bg-white border text-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold font-serif text-[#1B4332] mb-5 border-b pb-3">Motion Analysis</h3>
            <div className="grid grid-cols-[1fr_220px] gap-6">
              <MotionGraph />
              <div className="grid grid-cols-2 gap-x-2 gap-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Max Flexion</div><div className="text-xl font-bold font-mono text-[#1B4332]">134.2&deg;</div></div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Max Ext.</div><div className="text-xl font-bold font-mono text-[#1E293B]">2.1&deg;</div></div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Cadence</div><div className="text-xl font-bold font-mono text-[#1E293B]">108 <span className="text-[10px] font-sans text-slate-400">s/m</span></div></div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><div className="text-[10px] uppercase text-slate-500 font-bold mb-1">ROM</div><div className="text-xl font-bold font-mono text-[#0EA5E9]">132.1&deg;</div></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Assessment Panel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800">
              <span className="material-symbols-outlined text-teal-600">psychology</span> AI Assessment
            </h3>
            <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-[9px] font-bold border border-emerald-100 uppercase tracking-wider">
              Analysis Complete
            </div>
          </div>
          
          <div className="flex gap-6 items-center mb-6">
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-teal-500" strokeDasharray="72, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute text-center flex flex-col items-center">
                <div className="text-xl font-bold text-slate-800">72%</div>
              </div>
            </div>
            <div className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Overall Confidence</div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Key Findings</div>
            
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500 text-[16px]">straighten</span>
              <div className="flex-1"><div className="text-xs font-bold text-slate-800">Alignment</div><div className="text-[10px] text-slate-500">Mild Varus Deviation</div></div>
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Moderate</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-rose-500 text-[16px]">healing</span>
              <div className="flex-1"><div className="text-xs font-bold text-slate-800">Cartilage Health</div><div className="text-[10px] text-slate-500">Possible Early Degeneration</div></div>
              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Low</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500 text-[16px]">line_space</span>
              <div className="flex-1"><div className="text-xs font-bold text-slate-800">Joint Space</div><div className="text-[10px] text-slate-500">Within Normal Range</div></div>
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Good</span>
            </div>
          </div>
          
          <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
            <span className="material-symbols-outlined text-teal-600 mt-0.5 text-[16px]">prescriptions</span>
            <div>
              <div className="text-[10px] font-bold text-slate-800 mb-1 uppercase tracking-wider">Recommendation</div>
              <div className="text-[11px] text-slate-600 leading-relaxed">Consider physiotherapy and activity modification. Reassess in 3 months.</div>
            </div>
          </div>
        </div>
        
        {/* Rightmost column - Queue & Sensors */}
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#1E293B] mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#134E4A]">queue</span> Screening Queue</h3>
            <div className="flex flex-col gap-3">
              {[
                ({ n: patient.name, s: 'In Progress', c: 'text-[#0EA5E9] bg-sky-50' }),
                ({ n: 'Priya Nair', s: 'Pending', c: 'text-amber-600 bg-amber-50' }),
                ({ n: 'Amit Verma', s: 'Pending', c: 'text-amber-600 bg-amber-50' }),
                ({ n: 'Sneha Iyer', s: 'Waiting', c: 'text-slate-500 bg-slate-50' }),
                ({ n: 'Sanjay Patel', s: 'Waiting', c: 'text-slate-500 bg-slate-50' })
              ].map((q, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0 relative">
                  {i===0 && <div className="absolute -left-2 top-0 bottom-0 w-1 bg-[#0EA5E9] rounded-r-md" />}
                  <span className={`text-[13px] ${i===0 ? 'font-bold text-[#1E293B]' : 'font-medium text-slate-600'}`}>{q.n}</span>
                  <span className={`text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded ${q.c}`}>{q.s}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white flex-1 border border-slate-200 rounded-2xl p-5 shadow-sm overflow-hidden relative">
            <h3 className="text-sm font-bold text-[#1E293B] mb-5 flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-[#134E4A]">waves</span> Live Sensor Signals</h3>
            
            <LineWaveform color="#134E4A" name="Gyroscope" value="124.5" unit="&deg;/s" />
            <LineWaveform color="#0EA5E9" name="Accelerometer" value="9.81" unit="m/s&sup2;" />
            <LineWaveform color="#8B5CF6" name="Magnetometer" value="44.2" unit="&mu;T" />
            
            {/* IMU Mini stats block */}
            <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
               <div>
                 <div className="flex justify-between mb-1"><span className="text-[10px] font-bold text-slate-500">Gait Sym</span><span className="text-[10px] font-mono text-[#1B4332]">98%</span></div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden"><div className="bg-[#134E4A] h-full" style={{width: '98%'}}></div></div>
               </div>
               <div>
                 <div className="flex justify-between mb-1"><span className="text-[10px] font-bold text-slate-500">Load R/L</span><span className="text-[10px] font-mono text-[#0EA5E9]">0.96</span></div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex relative"><div className="bg-[#0EA5E9] h-full absolute w-[48%] left-0"></div><div className="bg-slate-300 h-full absolute w-[52%] right-0"></div></div>
               </div>
            </div>
          </div>
        </div>

      </div>
    
    </div>
  );
}
