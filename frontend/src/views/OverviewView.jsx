import React, { useEffect, useState } from 'react';
import CameraViewport from '../components/CameraViewport';

const KneeVisualization = () => (
  <div className="relative w-full h-full rounded-b-xl overflow-hidden shadow-inner flex items-center justify-center" style={{ background: 'radial-gradient(circle at center, #10242E 0%, #061117 100%)' }}>
    <svg viewBox="0 0 500 500" className="w-full h-full opacity-90 scale-90 -translate-y-4">
        {/* Decorative medical grid */}
        <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38BDF8" strokeWidth="0.5" opacity="0.1" />
            </pattern>
            <linearGradient id="boneGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="sensorGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="100%" stopColor="#0EA5E9" />
            </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Central Axis */}
        <line x1="250" y1="50" x2="250" y2="450" stroke="#38BDF8" strokeWidth="1" strokeDasharray="5 5" opacity="0.3" />
        <line x1="100" y1="250" x2="400" y2="250" stroke="#38BDF8" strokeWidth="1" strokeDasharray="5 5" opacity="0.3" />
        <text x="255" y="65" fill="#38BDF8" fontSize="10" opacity="0.5" className="font-mono uppercase tracking-widest">Mechanical Axis</text>

        {/* Femur */}
        <path d="M 210 50 Q 210 120 220 180 Q 230 220 210 240 Q 250 245 290 240 Q 270 220 280 180 Q 290 120 290 50 Z" fill="url(#boneGrad)" stroke="#38BDF8" strokeWidth="1.5" />
        
        {/* Tibia & Fibula */}
        <path d="M 215 260 Q 250 255 285 260 Q 275 300 270 380 Q 265 450 265 450 L 235 450 Q 235 380 230 300 Z" fill="url(#boneGrad)" stroke="#38BDF8" strokeWidth="1.5" />
        <path d="M 195 270 Q 200 350 195 450 L 180 450 Q 185 350 185 270 Z" fill="url(#boneGrad)" stroke="#38BDF8" strokeWidth="1.5" opacity="0.7" />
        
        {/* Cartilage Space Highlight */}
        <path d="M 210 245 Q 250 255 290 245" fill="none" stroke="#2DD4BF" strokeWidth="4" opacity="0.6" filter="blur(2px)" />
        
        {/* Sensors placed on the joint */}
        <g transform="translate(205, 200)">
           <rect x="-15" y="-15" width="30" height="30" rx="6" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
           <circle cx="0" cy="0" r="4" fill="#38BDF8" />
           <path d="M -8 -8 L 8 8 M -8 8 L 8 -8" stroke="#38BDF8" strokeWidth="1" opacity="0.5" />
        </g>
        <g transform="translate(295, 200)">
           <rect x="-15" y="-15" width="30" height="30" rx="6" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
           <circle cx="0" cy="0" r="4" fill="#38BDF8" />
           <path d="M -8 -8 L 8 8 M -8 8 L 8 -8" stroke="#38BDF8" strokeWidth="1" opacity="0.5" />
        </g>
        <g transform="translate(225, 280)">
           <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#0F172A" stroke="#8B5CF6" strokeWidth="1.5" />
           <circle cx="0" cy="0" r="3" fill="#8B5CF6" />
        </g>
        <g transform="translate(275, 280)">
           <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#0F172A" stroke="#8B5CF6" strokeWidth="1.5" />
           <circle cx="0" cy="0" r="3" fill="#8B5CF6" />
        </g>

        {/* Dynamic Measurement Arcs */}
        <path d="M 250 250 L 320 150" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        <circle cx="320" cy="150" r="3" fill="#38BDF8" />
        <path d="M 320 130 A 20 20 0 0 1 340 150" fill="none" stroke="#2DD4BF" strokeWidth="2" />
        
        {/* Medial Line */}
        <line x1="295" y1="250" x2="350" y2="250" stroke="#94A3B8" strokeWidth="1" />
        <circle cx="295" cy="250" r="2" fill="#94A3B8" />
    </svg>
    
    {/* Overlay Data Over SVG (like screenshot) */}
    <div className="absolute top-8 right-16 flex flex-col items-end text-right">
       <div className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Alignment Axis</div>
       <div className="text-3xl font-bold text-white font-mono">2.4&deg;</div>
       <div className="text-[11px] text-slate-400">(Varus)</div>
    </div>
    
    <div className="absolute top-1/4 right-8 flex flex-col items-end text-right mt-6">
       <div className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Flexion Angle</div>
       <div className="text-2xl font-bold text-white font-mono">18.7&deg;</div>
    </div>
    
    <div className="absolute top-1/2 right-12 flex flex-col items-end text-right mt-6">
       <div className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Joint Space</div>
       <div className="text-2xl font-bold text-white font-mono">4.8 <span className="text-sm font-normal text-slate-400">mm</span></div>
       <div className="text-[11px] text-slate-400">(Medial)</div>
    </div>

    <div className="absolute bottom-10 right-10 flex flex-col gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-700 backdrop-blur-sm">
       <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Sensor Points</div>
       <div className="flex items-center gap-2 text-[10px] text-slate-200"><div className="w-2 h-2 rounded-full bg-[#38BDF8]"></div> IMU (Motion)</div>
       <div className="flex items-center gap-2 text-[10px] text-slate-200"><div className="w-2 h-2 rounded-full bg-[#2DD4BF]"></div> Temp</div>
       <div className="flex items-center gap-2 text-[10px] text-slate-200"><div className="w-2 h-2 rounded-full bg-[#8B5CF6]"></div> Pressure</div>
    </div>
    
    <div className="absolute bottom-8 left-8 border border-slate-700 bg-slate-900/60 rounded px-3 py-1.5 flex items-center gap-2 text-[10px] text-slate-300 backdrop-blur-sm">
       <span className="material-symbols-outlined text-[14px]">view_in_ar</span> Right Knee <span className="material-symbols-outlined text-[14px]">expand_more</span>
    </div>
  </div>
);

const LineWaveform2 = ({ color, name, value, unit }) => (
  <div className="flex items-center gap-3 w-full">
    <div className="w-[100px]">
       <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: color}}></div><span className="text-[10px] font-bold text-slate-700 truncate">{name}</span></div>
       <div className="text-[9px] text-slate-400 ml-3">{unit}</div>
    </div>
    <div className="flex-1 h-8">
       <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full opacity-70">
           <path d="M0,10 Q10,2 20,10 T40,10 T60,2 T80,15 T100,10" fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
           <path d="M0,10 Q10,2 20,10 T40,10 T60,2 T80,15 T100,10 L100,20 L0,20 Z" fill={color} opacity="0.1" />
       </svg>
    </div>
    <div className="w-12 text-right text-sm font-bold text-slate-800 font-mono">{value}</div>
  </div>
);

const MotionGraph = () => (
  <div className="w-full h-[120px] relative mt-2">
     <div className="absolute inset-0 flex flex-col justify-between opacity-30 pb-4">
       <div className="border-b border-slate-200 w-full flex items-center justify-start"><span className="text-[8px] text-slate-400 absolute -left-6">120&deg;</span></div>
       <div className="border-b border-slate-200 w-full flex items-center justify-start"><span className="text-[8px] text-slate-400 absolute -left-6">60&deg;</span></div>
       <div className="border-b border-slate-200 w-full flex items-center justify-start"><span className="text-[8px] text-slate-400 absolute -left-6">0&deg;</span></div>
     </div>
     <div className="absolute inset-y-0 left-0 right-0 flex justify-between px-2 pt-[105px] opacity-40 text-[8px] font-mono text-slate-500">
        <span>0%</span><span>20%</span><span>40%</span><span>60%</span><span>80%</span><span>100%</span>
     </div>
     <div className="absolute bottom-0 w-full text-center text-[9px] text-slate-400 font-bold uppercase">Gait Cycle (%)</div>
     <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-[100px] mt-1 relative z-10">
         <path d="M0,35 C15,35 20,5 30,5 C40,5 45,25 55,25 C65,25 70,10 80,10 C90,10 95,35 100,35" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round"/>
         <path d="M0,38 C18,38 22,12 32,12 C42,12 48,28 58,28 C68,28 72,15 82,15 C92,15 95,38 100,38" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
     </svg>
     <div className="absolute -top-3 right-2 flex gap-4 bg-white/80 px-2 py-1 rounded backdrop-blur-sm">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold"><div className="w-2 h-2 rounded-full bg-[#0EA5E9]"></div> Left</div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold"><div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Right</div>
     </div>
  </div>
);

export default function OverviewView({ activePatient, camera }) {
  const patient = activePatient || { name: 'Rohan Sharma', id: 'AYG-2025-0487', age: 46, sex: 'Male' };
  
  return (
    <div className="w-full h-full min-h-screen bg-[#F8FAFC] pb-12 pt-2 animate-fade-in" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 flex flex-col gap-5">
        
        {/* ROW 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_350px] gap-5">
          {/* Patient Overview Header & Card */}
          <div className="flex flex-col justify-between">
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="text-[10px] font-bold text-teal-700 tracking-widest uppercase mb-1 flex items-center gap-2">
                 Patient Overview
              </div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight font-serif">Knee Health Intelligence</h1>
                <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-bold border border-teal-100 flex items-center gap-1.5 uppercase tracking-wide">
                  <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div> Live Detection Active
                </div>
              </div>
              <div className="text-sm text-slate-500 font-medium flex gap-3 items-center">
                 <span>Real-time screening</span>
                 <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                 <span>Motion analysis</span>
                 <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                 <span>Better outcomes</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200/60 p-3 mt-6 flex items-center gap-6 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-600"></div>
              <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-teal-800 ml-2 overflow-hidden shrink-0">
                <img src="https://ui-avatars.com/api/?name=Rohan+Sharma&background=E6F4F1&color=0F766E&bold=true" alt="patient" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 grid grid-cols-4 gap-2 divide-x divide-slate-100">
                <div className="px-3">
                  <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Patient ID</div>
                  <div className="text-[13px] font-bold text-slate-800 font-mono tracking-tight">{patient.id}</div>
                </div>
                <div className="px-4">
                  <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Name</div>
                  <div className="text-[13px] font-bold text-slate-800 truncate">{patient.name}</div>
                </div>
                <div className="px-4">
                  <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Age / Gender</div>
                  <div className="text-[13px] font-bold text-slate-800">{patient.age}Y / {patient.sex?.charAt(0) || 'M'}</div>
                </div>
                <div className="px-4">
                  <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Mobile</div>
                  <div className="text-[13px] font-bold text-slate-800 font-mono tracking-tight">+91 98765 43210</div>
                </div>
              </div>
              <div className="px-4 border-l border-slate-100 h-full flex flex-col justify-center shrink-0">
                  <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Visit Date</div>
                  <div className="text-[13px] font-bold text-slate-800">03 Oct 2025</div>
              </div>
            </div>
          </div>

          {/* Live Camera Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 flex flex-col">
             <div className="flex justify-between items-center mb-3">
               <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-800">
                 <span className="material-symbols-outlined text-[18px] text-teal-600">videocam</span> Live Camera Feed
               </h3>
               <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div> LIVE
               </span>
             </div>
             <div className="flex-1 bg-slate-900 rounded-lg overflow-hidden relative min-h-[140px] flex items-center justify-center border border-slate-800">
               {camera?.isWebcamActive ? (
                 <CameraViewport camera={camera} exercise={{ name: "Frontal plane", target: 90 }} hideGuides={true} />
               ) : (
                 <div className="relative w-full h-full bg-[#1A232C] flex items-center justify-center cursor-pointer group hover:bg-[#222E3A] transition" onClick={camera?.startCamera}>
                    <img src="/placeholder-camera.jpg" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" style={{ filter: 'grayscale(100%)' }} />
                    <div className="absolute top-2 right-2 flex flex-col gap-1 text-[8px] font-mono text-slate-400 text-right bg-black/40 px-2 py-1 rounded backdrop-blur-sm z-10">
                        <div>Frame Rate <span className="text-white ml-2">30 FPS</span></div>
                        <div>Resolution <span className="text-white ml-2">1080p</span></div>
                        <div>Lighting <span className="text-white ml-2">Good</span></div>
                    </div>
                    <div className="absolute bottom-2 left-2 flex gap-1 z-10">
                        <div className="w-6 h-6 rounded bg-black/40 flex items-center justify-center text-white backdrop-blur-sm"><span className="material-symbols-outlined text-[14px]">tune</span></div>
                        <div className="w-6 h-6 rounded bg-black/40 flex items-center justify-center text-white backdrop-blur-sm"><span className="material-symbols-outlined text-[14px]">fullscreen</span></div>
                    </div>
                    <button className="z-10 text-white text-[11px] font-medium flex items-center gap-2 border border-white/20 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg group-hover:bg-teal-600 group-hover:border-teal-500 transition shadow-lg">
                       <span className="material-symbols-outlined text-[16px]">power_settings_new</span> Activate Vision
                    </button>
                 </div>
               )}
             </div>
          </div>

          {/* Screening Queue */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-4 flex flex-col">
             <div className="flex justify-between items-center mb-3">
               <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-800">
                 <span className="material-symbols-outlined text-[18px] text-teal-600">groups</span> Screening Queue
               </h3>
               <span className="text-[10px] text-teal-600 bg-teal-50 px-2 py-0.5 rounded font-bold">5 Patients</span>
             </div>
             <div className="grid grid-cols-[24px_1fr_70px_40px] text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1 pb-1.5 border-b border-slate-100">
               <div>#</div><div>Patient Name</div><div>Status</div><div className="text-right">Time</div>
             </div>
             <div className="flex flex-col gap-0.5">
               {[
                 { id: '01', n: patient.name, s: 'In Progress', c: 'text-teal-700 bg-teal-50', dot: 'bg-teal-500', t: '13:32' },
                 { id: '02', n: 'Priya Nair', s: 'Waiting', c: 'text-slate-600', dot: 'bg-slate-300', t: '13:45' },
                 { id: '03', n: 'Suresh Patil', s: 'Waiting', c: 'text-slate-600', dot: 'bg-slate-300', t: '14:10' },
                 { id: '04', n: 'Anita Verma', s: 'Waiting', c: 'text-slate-600', dot: 'bg-slate-300', t: '14:40' },
                 { id: '05', n: 'Mohit Singh', s: 'Waiting', c: 'text-slate-600', dot: 'bg-slate-300', t: '15:05' }
               ].map((q, i) => (
                 <div key={i} className={`grid grid-cols-[24px_1fr_70px_40px] items-center text-[11px] px-1 py-1.5 rounded-md ${i===0 ? 'bg-teal-50/50' : ''}`}>
                   <div className="font-mono text-slate-400 text-[10px]">{q.id}</div>
                   <div className={`font-bold ${i===0 ? 'text-slate-800' : 'text-slate-600'}`}>{q.n}</div>
                   <div>
                     <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${q.c}`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${q.dot}`}></div> {q.s}
                     </span>
                   </div>
                   <div className="text-right font-mono text-slate-500 text-[10px]">{q.t}</div>
                 </div>
               ))}
             </div>
             <div className="mt-auto pt-2 text-[10px] font-bold text-teal-600 flex items-center gap-1 cursor-pointer hover:underline">
               View All Patients <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
             </div>
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_350px] gap-5">
          {/* 3D Knee */}
          <div className="bg-[#0B171E] rounded-xl overflow-hidden shadow-md relative border border-slate-700/50 flex flex-col h-[420px]">
             <div className="absolute top-4 left-4 z-20 flex items-center gap-4 w-full pr-8">
               <h3 className="text-sm font-bold text-white flex items-center gap-2 bg-slate-900/60 pl-2 pr-4 py-1.5 rounded-lg border border-slate-700 backdrop-blur-md">
                 <span className="material-symbols-outlined text-[18px] text-teal-400">view_in_ar</span> 3D Knee Reconstruction
               </h3>
               <span className="text-[9px] font-bold text-teal-400 bg-teal-900/50 border border-teal-500/30 px-2 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-[0_0_10px_rgba(45,212,191,0.2)]">
                 <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></div> Live
               </span>
             </div>
             
             <div className="absolute top-16 left-4 z-20 flex flex-col gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700 backdrop-blur-md">
                 <button className="px-3 py-2 rounded-lg bg-teal-500/20 border border-teal-500/50 text-teal-300 text-[10px] font-bold flex items-center gap-2 shadow-sm w-24">
                     <span className="material-symbols-outlined text-[14px]">visibility</span> 3D View
                 </button>
                 <button className="px-3 py-2 rounded-lg bg-transparent hover:bg-white/5 text-slate-300 text-[10px] font-bold flex items-center gap-2 transition w-24">
                     <span className="material-symbols-outlined text-[14px]">flip_to_front</span> Front View
                 </button>
                 <button className="px-3 py-2 rounded-lg bg-transparent hover:bg-white/5 text-slate-300 text-[10px] font-bold flex items-center gap-2 transition w-24">
                     <span className="material-symbols-outlined text-[14px]">flip_to_back</span> Side View
                 </button>
                 <button className="px-3 py-2 rounded-lg bg-transparent hover:bg-white/5 text-slate-300 text-[10px] font-bold flex items-center gap-2 transition w-24">
                     <span className="material-symbols-outlined text-[14px]">layers</span> Axial View
                 </button>
             </div>

             <div className="w-full h-full absolute inset-0 z-10">
               <KneeVisualization />
             </div>
          </div>

          {/* AI Assessment */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5 flex flex-col h-[420px]">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-800">
                 <span className="material-symbols-outlined text-[18px] text-teal-600">psychology</span> AI Assessment
               </h3>
               <div className="bg-teal-50 text-teal-700 px-2 py-1 rounded-full text-[9px] font-bold uppercase border border-teal-100 flex items-center gap-1 shadow-sm">
                 <span className="material-symbols-outlined text-[12px]">check_circle</span> Analysis Complete
               </div>
             </div>

             <div className="flex gap-4 items-center mb-6">
               <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                 <svg className="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                   <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                   <path className="text-teal-500" strokeDasharray="72, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                 </svg>
                 <div className="absolute text-center flex flex-col items-center">
                   <div className="text-2xl font-black text-slate-800 tracking-tight">72%</div>
                 </div>
               </div>
               <div className="text-[10px] text-slate-500 font-bold uppercase leading-tight tracking-widest">Overall<br/>Confidence</div>
             </div>

             <div className="text-[10px] font-bold text-slate-800 mb-3 uppercase tracking-wider">Key Findings</div>
             <div className="flex flex-col gap-3.5 flex-1 pr-1">
               <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100 shadow-sm"><span className="material-symbols-outlined text-[16px]">straighten</span></div>
                 <div className="flex-1 pt-0.5"><div className="text-[11px] font-bold text-slate-800">Alignment</div><div className="text-[10px] text-slate-500">Mild Varus Deviation</div></div>
                 <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 mt-1 uppercase tracking-wide">Moderate</span>
               </div>
               
               <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 border border-rose-100 shadow-sm"><span className="material-symbols-outlined text-[16px]">healing</span></div>
                 <div className="flex-1 pt-0.5"><div className="text-[11px] font-bold text-slate-800">Cartilage Health</div><div className="text-[10px] text-slate-500">Possible Early Degeneration</div></div>
                 <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 mt-1 uppercase tracking-wide">Low</span>
               </div>
               
               <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center shrink-0 border border-teal-100 shadow-sm"><span className="material-symbols-outlined text-[16px]">format_line_spacing</span></div>
                 <div className="flex-1 pt-0.5"><div className="text-[11px] font-bold text-slate-800">Joint Space</div><div className="text-[10px] text-slate-500">Within Normal Range</div></div>
                 <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 mt-1 uppercase tracking-wide">Good</span>
               </div>

               <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 border border-amber-100 shadow-sm"><span className="material-symbols-outlined text-[16px]">directions_walk</span></div>
                 <div className="flex-1 pt-0.5"><div className="text-[11px] font-bold text-slate-800">Motion Pattern</div><div className="text-[10px] text-slate-500">Slight Asymmetry Detected</div></div>
                 <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 mt-1 uppercase tracking-wide">Moderate</span>
               </div>
             </div>

             <div className="mt-4 bg-[#F8FAFC] rounded-xl p-3 flex gap-3 items-start border border-slate-200">
               <span className="material-symbols-outlined text-slate-400 text-[18px] bg-white rounded-lg shadow-sm p-1">prescriptions</span>
               <div>
                 <div className="text-[10px] font-bold text-slate-800 mb-0.5 uppercase tracking-wider">Recommendation</div>
                 <div className="text-[11px] text-slate-600 leading-snug">Consider physiotherapy and activity modification. Reassess in 3 months.</div>
               </div>
             </div>
          </div>

          {/* Live Sensor Signals */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5 flex flex-col h-[420px]">
             <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
               <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-800">
                 <span className="material-symbols-outlined text-[18px] text-teal-600">show_chart</span> Live Sensor Signals
               </h3>
               <span className="text-[9px] font-bold text-teal-600 flex items-center gap-1.5 uppercase bg-teal-50 px-2 py-1 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div> Real-time</span>
             </div>
             
             <div className="flex flex-col gap-6 flex-1 justify-center">
               <LineWaveform2 color="#0EA5E9" name="IMU (Motion)" value="12.6" unit="deg/s" />
               <LineWaveform2 color="#8B5CF6" name="Pressure" value="28.4" unit="kPa" />
               <LineWaveform2 color="#F59E0B" name="Temperature" value="32.1" unit="°C" />
               <LineWaveform2 color="#10B981" name="Battery" value="78" unit="%" />
             </div>
          </div>
        </div>

        {/* ROW 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px_350px] gap-5">
          {/* Motion Analysis */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5 min-h-[200px] flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-60 pointer-events-none -mr-10 -mt-10"></div>
             
             <div className="flex justify-between items-center mb-2 z-10">
               <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-800">
                 <span className="material-symbols-outlined text-[18px] text-teal-600">accessibility_new</span> Motion Analysis
               </h3>
               <div className="flex bg-slate-100 rounded-full p-1 border border-slate-200 shadow-inner">
                 <button className="px-3 py-1 rounded-full bg-[#0F172A] text-white text-[9px] font-bold uppercase tracking-wide shadow-sm">Gait Cycle</button>
                 <button className="px-3 py-1 rounded-full text-slate-500 hover:text-slate-700 text-[9px] font-bold uppercase tracking-wide transition">Flexion-Extension</button>
                 <button className="px-3 py-1 rounded-full text-slate-500 hover:text-slate-700 text-[9px] font-bold uppercase tracking-wide transition">Varus-Valgus</button>
                 <button className="px-3 py-1 rounded-full text-slate-500 hover:text-slate-700 text-[9px] font-bold uppercase tracking-wide transition">Load Distribution</button>
               </div>
             </div>
             <div className="flex flex-1 gap-6 z-10">
               <div className="flex-1 flex flex-col justify-end">
                 <MotionGraph />
               </div>
               <div className="w-[120px] flex flex-col justify-center gap-4 border-l border-slate-100 pl-5">
                  <div><div className="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Max Flexion</div><div className="text-2xl font-bold text-slate-800 font-mono tracking-tight">134.2&deg;</div></div>
                  <div><div className="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Max Extension</div><div className="text-xl font-bold text-slate-800 font-mono tracking-tight">2.1&deg;</div></div>
                  <div><div className="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Gait Symmetry</div><div className="text-xl font-bold text-teal-600 font-mono tracking-tight">92%</div></div>
               </div>
             </div>
          </div>

          {/* Knee View - Measurements */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5 min-h-[200px] flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl opacity-60 pointer-events-none -mr-10 -mt-10"></div>
             <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-800 mb-4 z-10">
               <span className="material-symbols-outlined text-[18px] text-teal-600">orthopedics</span> Knee View - Measurements
             </h3>
             <div className="flex items-center gap-4 flex-1 z-10">
               <div className="flex-1 flex flex-col gap-3 justify-center">
                 <div className="flex justify-between items-end border-b border-slate-100 border-dashed pb-1.5">
                   <span className="text-[10px] text-slate-500 font-bold">Joint Space (Medial)</span>
                   <span className="text-[13px] font-bold text-slate-800 font-mono">4.8 <span className="text-[9px] text-slate-400 font-normal">mm</span></span>
                 </div>
                 <div className="flex justify-between items-end border-b border-slate-100 border-dashed pb-1.5">
                   <span className="text-[10px] text-slate-500 font-bold">Joint Space (Lateral)</span>
                   <span className="text-[13px] font-bold text-slate-800 font-mono">5.6 <span className="text-[9px] text-slate-400 font-normal">mm</span></span>
                 </div>
                 <div className="flex justify-between items-end border-b border-slate-100 border-dashed pb-1.5">
                   <span className="text-[10px] text-slate-500 font-bold">Varus / Valgus Angle</span>
                   <span className="text-[13px] font-bold text-slate-800 font-mono">2.4&deg;</span>
                 </div>
                 <div className="flex justify-between items-end">
                   <span className="text-[10px] text-slate-500 font-bold">Flexion Range</span>
                   <span className="text-[13px] font-bold text-slate-800 font-mono">0&deg; - 134&deg;</span>
                 </div>
               </div>
               <div className="w-[100px] h-full flex flex-col items-center justify-center relative">
                  {/* Bone graphic */}
                  <svg viewBox="0 0 100 120" className="w-[80px] h-[100px] drop-shadow-md">
                     <path d="M30,5 C35,40 20,55 10,65 C15,75 30,110 35,115" fill="none" stroke="#E2E8F0" strokeWidth="18" strokeLinecap="round"/>
                     <path d="M70,5 C65,40 80,55 90,65 C85,75 70,110 65,115" fill="none" stroke="#E2E8F0" strokeWidth="18" strokeLinecap="round"/>
                     <path d="M30,5 C35,40 20,55 10,65 C15,75 30,110 35,115" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
                     <path d="M70,5 C65,40 80,55 90,65 C85,75 70,110 65,115" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
                     <line x1="20" y1="60" x2="45" y2="60" stroke="#0EA5E9" strokeWidth="1.5" strokeDasharray="2 2" />
                     <line x1="55" y1="60" x2="80" y2="60" stroke="#0EA5E9" strokeWidth="1.5" strokeDasharray="2 2" />
                     <circle cx="20" cy="60" r="1.5" fill="#0EA5E9" />
                     <circle cx="80" cy="60" r="1.5" fill="#0EA5E9" />
                  </svg>
                  {/* Labels on SVG */}
                  <div className="absolute top-1/2 left-0 -translate-x-3 -translate-y-1 text-[8px] text-slate-500 font-bold text-center">Lateral<br/><span className="text-[10px] text-slate-800 font-mono">5.6 mm</span></div>
                  <div className="absolute top-1/2 right-0 translate-x-3 -translate-y-1 text-[8px] text-slate-500 font-bold text-center">Medial<br/><span className="text-[10px] text-slate-800 font-mono">4.8 mm</span></div>
                  <div className="absolute bottom-1 text-[9px] text-slate-800 font-mono font-bold bg-white/80 px-1 rounded backdrop-blur">2.4&deg;</div>
               </div>
             </div>
          </div>

          {/* Device Status */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5 min-h-[200px] flex flex-col">
             <div className="flex justify-between items-center mb-3">
               <h3 className="text-[13px] font-bold flex items-center gap-2 text-slate-800">
                 <span className="material-symbols-outlined text-[18px] text-teal-600">settings_remote</span> Device Status
               </h3>
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                 <span className="material-symbols-outlined text-[14px]">battery_charging_full</span> 80%
               </div>
             </div>
             <div className="text-[10px] font-bold text-slate-800 mb-4 uppercase tracking-wider">AYURAGIES <span className="text-slate-400 font-normal capitalize tracking-normal ml-1">Knee Wearable</span></div>
             
             <div className="flex gap-4 flex-1">
               <div className="flex-1 flex flex-col gap-2.5">
                 {[
                   { n: 'IMU Module', s: 'OK', c: 'text-teal-600' },
                   { n: 'Pressure Sensor', s: 'OK', c: 'text-teal-600' },
                   { n: 'Temperature Sensor', s: 'OK', c: 'text-teal-600' },
                   { n: 'Bluetooth', s: 'Connected', c: 'text-teal-600' }
                 ].map(d => (
                   <div key={d.n} className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
                       <span className="text-[11px] text-slate-600 font-medium">{d.n}</span>
                     </div>
                     <span className={`text-[9px] font-bold uppercase tracking-wider ${d.c}`}>{d.s}</span>
                   </div>
                 ))}
                 <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
                   <span className="text-[9px] text-slate-400 font-mono">Firmware v2.4.1</span>
                   <span className="text-[10px] font-bold text-teal-600 cursor-pointer hover:underline">View Details <span className="text-[10px]">&rarr;</span></span>
                 </div>
               </div>
               <div className="w-[70px] bg-slate-900 rounded-xl flex items-center justify-center shrink-0 shadow-inner relative overflow-hidden h-[120px] self-center">
                  <div className="absolute inset-1.5 border border-teal-500/20 rounded-lg"></div>
                  {/* Decorative wearable shape */}
                  <div className="absolute inset-x-2 top-4 bottom-4 bg-slate-800 rounded-md border border-slate-700 flex flex-col items-center justify-center gap-3">
                     <div className="w-8 h-1 bg-slate-900 rounded-full"></div>
                     <div className="w-8 h-8 rounded-full border border-teal-500/30 bg-slate-900 shadow-[0_0_10px_rgba(20,184,166,0.2)] flex items-center justify-center">
                         <div className="w-4 h-4 text-teal-400 opacity-80"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"/></svg></div>
                     </div>
                     <div className="w-8 h-1 bg-slate-900 rounded-full"></div>
                  </div>
               </div>
             </div>
          </div>
        </div>
        
        {/* FOOTER BAR */}
        <div className="mt-4 border-t border-slate-200/60 pt-4 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest px-2">
            <div className="flex gap-6">
               <span>AYURAGIES</span>
               <span>|</span>
               <span>AI-POWERED KNEE HEALTH MONITORING SYSTEM</span>
            </div>
            <div className="flex gap-6">
               <span className="text-teal-600">EARLY DETECTION</span>
               <span>/</span>
               <span className="text-teal-600">PRECISE ANALYSIS</span>
               <span>/</span>
               <span className="text-teal-600">BETTER MOBILITY</span>
            </div>
            <div className="flex gap-2 items-center">
               <span className="material-symbols-outlined text-[14px]">ecg_heart</span> Designed for India <span className="text-slate-300 px-1">|</span> Built for Real Impact
            </div>
        </div>

      </div>
    </div>
  );
}
