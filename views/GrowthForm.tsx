
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GrowthLog, UserSettings } from '../types';

const GrowthForm: React.FC<{ onSubmit: (log: Omit<GrowthLog, 'id'>) => void; settings: UserSettings }> = ({ onSubmit, settings }) => {
  const navigate = useNavigate();
  const isMetric = settings.unitSystem === 'metric';
  
  const [displayWeight, setDisplayWeight] = useState(isMetric ? 4.5 : 10);
  const [customTime, setCustomTime] = useState(new Date().toISOString().slice(0, 16));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightKg = isMetric ? displayWeight : displayWeight / 2.20462;
    onSubmit({ 
      timestamp: new Date(customTime).getTime(), 
      weightKg: weightKg 
    });
    navigate('/');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Growth</h2>
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

      <div className="flex flex-col items-center gap-8 py-4">
         <div className="relative w-44 h-44 rounded-full bg-emerald-50 flex flex-col items-center justify-center border-8 border-white shadow-sm">
            <i className="fas fa-weight-scale text-emerald-500 text-2xl mb-1"></i>
            <span className="text-4xl font-black text-emerald-600">{displayWeight.toFixed(2)}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isMetric ? 'Kg' : 'Lb'}</span>
         </div>

         <div className="w-full space-y-4 px-2">
            <input 
              type="range" 
              min={isMetric ? "2" : "4"} 
              max={isMetric ? "15" : "33"} 
              step="0.01" 
              value={displayWeight} 
              onChange={(e) => setDisplayWeight(parseFloat(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
         </div>

         <div className="grid grid-cols-2 gap-3 w-full">
            <button onClick={() => setDisplayWeight(displayWeight - 0.1)} className="py-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold active:bg-slate-50 transition-colors">- 0.1</button>
            <button onClick={() => setDisplayWeight(displayWeight + 0.1)} className="py-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold active:bg-slate-50 transition-colors">+ 0.1</button>
         </div>
      </div>

      <button 
        onClick={handleSubmit}
        className="w-full py-5 bg-emerald-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-emerald-100 mt-4 active:scale-95 transition-all"
      >
        Save Weight
      </button>
    </div>
  );
};

export default GrowthForm;
