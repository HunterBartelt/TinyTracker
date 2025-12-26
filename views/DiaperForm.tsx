
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiaperLog, DiaperType } from '../types';

const DiaperForm: React.FC<{ onSubmit: (log: Omit<DiaperLog, 'id'>) => void }> = ({ onSubmit }) => {
  const navigate = useNavigate();
  const [type, setType] = useState<DiaperType>('wet');
  const [customTime, setCustomTime] = useState(new Date().toISOString().slice(0, 16));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      timestamp: new Date(customTime).getTime(), 
      type 
    });
    navigate('/');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Diaper Change</h2>
        <button onClick={() => navigate(-1)} className="text-slate-400 p-2"><i className="fas fa-times text-xl"></i></button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Log Date & Time</label>
        <input 
          type="datetime-local" 
          value={customTime}
          onChange={(e) => setCustomTime(e.target.value)}
          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <TypeOption 
          label="Wet" 
          active={type === 'wet'} 
          onClick={() => setType('wet')} 
          icon="fa-droplet" 
          color="text-blue-500" 
          bgColor="bg-blue-50"
          desc="Just urine"
        />
        <TypeOption 
          label="Dirty" 
          active={type === 'dirty'} 
          onClick={() => setType('dirty')} 
          icon="fa-poop" 
          color="text-amber-700" 
          bgColor="bg-amber-50"
          desc="Stool only"
        />
        <TypeOption 
          label="Mixed" 
          active={type === 'mixed'} 
          onClick={() => setType('mixed')} 
          icon="fa-star-of-life" 
          color="text-indigo-600" 
          bgColor="bg-indigo-50"
          desc="Urine and stool"
        />
      </div>

      <button 
        onClick={handleSubmit}
        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-200 active:scale-[0.98] transition-all"
      >
        Log Change
      </button>
    </div>
  );
};

const TypeOption: React.FC<{ label: string; active: boolean; onClick: () => void; icon: string; color: string; bgColor: string; desc: string }> = ({ label, active, onClick, icon, color, bgColor, desc }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all text-left ${active ? 'border-indigo-600 bg-white' : 'border-slate-50 bg-slate-50/50'}`}
  >
    <div className={`w-14 h-14 ${bgColor} ${color} rounded-2xl flex items-center justify-center text-xl`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div className="flex-1">
      <h3 className="font-black text-slate-800">{label}</h3>
      <p className="text-xs text-slate-400 font-medium">{desc}</p>
    </div>
    {active && <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-[10px]"><i className="fas fa-check"></i></div>}
  </button>
);

export default DiaperForm;
