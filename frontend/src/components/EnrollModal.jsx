import React, { useState } from 'react';

export const INDIAN_STATES_UTS = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 
  'Chandigarh', 'Dadra and Nagar Haveli', 'Delhi NCR', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export const PAN_INDIA_OCCUPATIONS = [
  'Paddy / Wheat Agro-Cultivator (Squatting & Heavy Lift)',
  'Tea Plantation / Mountain Slope Worker',
  'Construction Worker / Heavy Manual Labor',
  'Handloom Weaver / Artisan (Floor Cross-Legged)',
  'Domestic / Anganwadi / Housekeeping Worker',
  'Desk Executive / Sedentary Urban Worker',
  'Senior Citizen / Retired Resident',
  'General Rural / Semi-Urban Resident'
];

export default function EnrollModal({ isOpen, onClose, onEnroll }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', age: '', gender: 'Female', occupation: PAN_INDIA_OCCUPATIONS[0],
    state: 'Punjab', region: 'CHC Ludhiana West, Punjab', height_cm: '165', weight_kg: '68',
    abhaId: '', consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const PRESETS = [
    { label: 'Delhi Executive', name: 'Rajesh Khurana', age: '61', gender: 'Male', occupation: PAN_INDIA_OCCUPATIONS[5], state: 'Delhi NCR', region: 'Safdarjung', abhaId: '91-1120-8849-0123' },
    { label: 'Noida IT Lead', name: 'Sunita Sharma', age: '52', gender: 'Female', occupation: PAN_INDIA_OCCUPATIONS[5], state: 'Uttar Pradesh', region: 'Sector 62', abhaId: '91-8843-1029-7712' },
    { label: 'Noida Cultivator', name: 'Vikramaditya Bhati', age: '64', gender: 'Male', occupation: PAN_INDIA_OCCUPATIONS[0], state: 'Uttar Pradesh', region: 'CHC Kasna', abhaId: '91-9034-6612-8823' },
    { label: 'Delhi Teacher', name: 'Meenakshi Verma', age: '56', gender: 'Female', occupation: PAN_INDIA_OCCUPATIONS[7], state: 'Delhi NCR', region: 'Karol Bagh', abhaId: '91-2290-7711-4450' },
    { label: 'Delivery Partner', name: 'Amit Tyagi', age: '37', gender: 'Male', occupation: PAN_INDIA_OCCUPATIONS[2], state: 'Uttar Pradesh', region: 'Sector 39', abhaId: '91-7719-2045-6610' },
    { label: 'Punjab Cultivator', name: 'Gurpreet Singh', age: '58', gender: 'Male', occupation: PAN_INDIA_OCCUPATIONS[0], state: 'Punjab', region: 'Ludhiana', abhaId: '91-4452-8921-3310' },
    { label: 'Tamil Nadu Weaver', name: 'Lakshmi S.', age: '54', gender: 'Female', occupation: PAN_INDIA_OCCUPATIONS[3], state: 'Tamil Nadu', region: 'Kanchipuram', abhaId: '91-3829-1940-5521' }
  ];

  const applyPreset = (p) => {
    setFormData(prev => ({
      ...prev, name: p.name, age: p.age, gender: p.gender, occupation: p.occupation,
      state: p.state, region: p.region, height_cm: p.gender === 'Male' ? '172' : '158',
      weight_kg: p.gender === 'Male' ? '74' : '62', abhaId: p.abhaId
    }));
  };

  const generateRandomAbha = () => {
    const part = () => Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, abhaId: `91-${part()}-${part()}-${part()}` }));
  };

  const heightNum = Number(formData.height_cm) || 165;
  const weightNum = Number(formData.weight_kg) || 68;
  const liveBmi = (weightNum / Math.pow(heightNum / 100, 2)).toFixed(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.consent) return;
    setIsSubmitting(true);
    await onEnroll({
      ...formData, age: parseInt(formData.age, 10), height_cm: heightNum, weight_kg: weightNum,
      bmi: parseFloat(liveBmi), id: `IND-OA-2025-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setIsSubmitting(false);
    onClose();
  };

  const STEPS = ['Patient', 'Vitals', 'Identity', 'Clinical Context', 'Consent'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-[#F7F8F4] rounded-[16px] shadow-2xl border border-[#D9E5E1] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#D9E5E1] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#064E49] flex items-center justify-center text-white shadow-sm">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <h2 className="text-[#123B3A] font-serif font-bold text-xl">ENROLL NEW PATIENT</h2>
              <p className="text-[#58706D] text-xs font-semibold uppercase tracking-wider">Pan-India Registry &middot; ICMR Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-[#58706D] hover:bg-[#EEF8F4] hover:text-[#123B3A] transition-colors"><span className="material-symbols-outlined">close</span></button>
        </div>

        {/* Presets */}
        <div className="px-6 py-3 bg-[#EEF8F4] border-b border-[#D9E5E1] flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] uppercase font-bold text-[#16877C] whitespace-nowrap mr-2">Presets:</span>
          {PRESETS.map((p, idx) => (
            <button key={idx} onClick={() => applyPreset(p)} className="px-3 py-1.5 rounded-full bg-white border border-[#D9E5E1] text-[#123B3A] text-[10px] font-bold hover:border-[#0B6B63] transition-colors whitespace-nowrap shadow-sm">
              {p.label}
            </button>
          ))}
        </div>

        {/* Steps Indicator */}
        <div className="px-8 py-4 bg-white border-b border-[#D9E5E1] flex justify-between relative">
           <div className="absolute top-1/2 left-10 right-10 h-px bg-[#D9E5E1] -translate-y-1/2 z-0"></div>
           {STEPS.map((s, i) => (
             <div key={i} className="relative z-10 flex flex-col items-center gap-1" onClick={() => setStep(i+1)}>
               <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 cursor-pointer transition-colors ${step >= i+1 ? 'bg-[#064E49] border-[#064E49] text-white' : 'bg-white border-[#D9E5E1] text-[#58706D]'}`}>
                 0{i+1}
               </div>
               <span className={`text-[9px] uppercase font-bold ${step >= i+1 ? 'text-[#123B3A]' : 'text-[#58706D]'}`}>{s}</span>
             </div>
           ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          <div className={step === 1 ? 'block' : 'hidden'}>
            <div className="text-sm font-bold text-[#123B3A] mb-4 border-b border-[#D9E5E1] pb-2">01. Patient Details</div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#58706D] uppercase mb-1.5 block">Patient Full Name</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-[48px] px-4 bg-[#F7F8F4] border border-[#D9E5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B6B63] text-sm text-[#123B3A]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#58706D] uppercase mb-1.5 block">Age</label>
                  <input type="number" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full h-[48px] px-4 bg-[#F7F8F4] border border-[#D9E5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B6B63] text-sm text-[#123B3A]" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#58706D] uppercase mb-1.5 block">Gender</label>
                  <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full h-[48px] px-4 bg-[#F7F8F4] border border-[#D9E5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B6B63] text-sm text-[#123B3A]">
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={step === 2 ? 'block' : 'hidden'}>
            <div className="text-sm font-bold text-[#123B3A] mb-4 border-b border-[#D9E5E1] pb-2">02. Vitals & Anthropometrics</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#58706D] uppercase mb-1.5 block">Height (cm)</label>
                <input type="number" required value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: e.target.value})} className="w-full h-[48px] px-4 bg-[#F7F8F4] border border-[#D9E5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B6B63] text-sm text-[#123B3A]" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#58706D] uppercase mb-1.5 block">Weight (kg)</label>
                <input type="number" required value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})} className="w-full h-[48px] px-4 bg-[#F7F8F4] border border-[#D9E5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B6B63] text-sm text-[#123B3A]" />
              </div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-[#EEF8F4] border border-[#1F9D73]/20 flex items-center justify-between">
              <span className="text-xs font-bold text-[#064E49] uppercase">Calculated BMI</span>
              <span className="text-2xl font-bold font-mono text-[#064E49]">{liveBmi} <span className="text-xs font-normal">kg/m&sup2;</span></span>
            </div>
          </div>

          <div className={step === 3 ? 'block' : 'hidden'}>
             <div className="text-sm font-bold text-[#123B3A] mb-4 border-b border-[#D9E5E1] pb-2">03. Identity & Location</div>
             <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-[#58706D] uppercase mb-1.5 block">State / Union Territory</label>
                  <select value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full h-[48px] px-4 bg-[#F7F8F4] border border-[#D9E5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B6B63] text-sm text-[#123B3A]">
                    {INDIAN_STATES_UTS.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
               </div>
               <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-[#58706D] uppercase block">ABHA ID</label>
                    <button type="button" onClick={generateRandomAbha} className="text-[10px] font-bold text-[#0B6B63] hover:underline">Generate ID</button>
                  </div>
                  <input type="text" value={formData.abhaId} onChange={e => setFormData({...formData, abhaId: e.target.value})} placeholder="91-XXXX-XXXX-XXXX" className="w-full h-[48px] px-4 bg-[#F7F8F4] border border-[#D9E5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B6B63] text-sm font-mono text-[#123B3A]" />
               </div>
             </div>
          </div>

          <div className={step === 4 ? 'block' : 'hidden'}>
             <div className="text-sm font-bold text-[#123B3A] mb-4 border-b border-[#D9E5E1] pb-2">04. Clinical Context</div>
             <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-[#58706D] uppercase mb-1.5 block">Primary Occupation / Exposure</label>
                  <select value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} className="w-full h-[48px] px-4 bg-[#F7F8F4] border border-[#D9E5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B6B63] text-sm text-[#123B3A]">
                    {PAN_INDIA_OCCUPATIONS.map(occ => <option key={occ} value={occ}>{occ}</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold text-[#58706D] uppercase mb-1.5 block">Screening Center</label>
                  <input type="text" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} className="w-full h-[48px] px-4 bg-[#F7F8F4] border border-[#D9E5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0B6B63] text-sm text-[#123B3A]" />
               </div>
             </div>
          </div>

          <div className={step === 5 ? 'block' : 'hidden'}>
             <div className="text-sm font-bold text-[#123B3A] mb-4 border-b border-[#D9E5E1] pb-2">05. Informed Consent</div>
             <div className="p-5 rounded-xl bg-[#F7F8F4] border border-[#D9E5E1]">
                <label className="flex items-start gap-4 cursor-pointer">
                  <input type="checkbox" checked={formData.consent} onChange={e => setFormData({...formData, consent: e.target.checked})} className="mt-1 w-5 h-5 accent-[#064E49]" />
                  <div>
                    <div className="text-sm font-bold text-[#123B3A] flex items-center gap-2"><span className="material-symbols-outlined text-[18px] text-[#0B6B63]">shield_person</span> Patient informed consent recorded</div>
                    <div className="text-xs text-[#58706D] mt-1">I confirm that the patient has provided explicit consent to store demographic and clinical data in the ICMR National Tele-Screening Registry & ABDM.</div>
                  </div>
                </label>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#D9E5E1] flex items-center justify-between">
           <button onClick={onClose} type="button" className="px-6 py-2.5 rounded-lg text-[#58706D] text-sm font-bold hover:bg-[#F7F8F4] transition-colors">Cancel</button>
           <div className="flex gap-3">
             {step > 1 && <button onClick={() => setStep(step-1)} type="button" className="px-6 py-2.5 rounded-lg border border-[#D9E5E1] text-[#123B3A] text-sm font-bold hover:bg-[#F7F8F4] transition-colors">Back</button>}
             {step < 5 ? (
               <button onClick={() => setStep(step+1)} type="button" className="px-6 py-2.5 rounded-lg bg-[#064E49] text-white text-sm font-bold hover:bg-[#073F3B] transition-colors">Next</button>
             ) : (
               <button onClick={handleSubmit} disabled={isSubmitting || !formData.consent} type="button" className="px-6 py-2.5 rounded-lg bg-[#064E49] disabled:bg-[#D9E5E1] text-white text-sm font-bold hover:bg-[#073F3B] transition-colors shadow-md">
                 {isSubmitting ? 'Enrolling...' : 'Confirm Enrollment'}
               </button>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}
