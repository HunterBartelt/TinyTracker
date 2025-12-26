
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SleepLog } from '../types';

interface SleepFormProps {
  currentSleep?: SleepLog;
  onSubmit: (log: Omit<SleepLog, 'id'>) => void;
  onUpdate: (id: string, endTime: number) => void;
}

const SleepForm: React.FC<SleepFormProps> = ({ currentSleep, onSubmit, onUpdate }) => {
  const navigate = useNavigate();
  const [manualMode, setManualMode] = useState(false);
  const [manualStart, setManualStart] = useState(new Date().toISOString().slice(0, 16));
  const [manualEnd, setManualEnd] = useState(new Date().toISOString().slice(0, 16));

  const handleStart = () => {
    onSubmit({ startTime: Date.now() });
    navigate('/');
  };

  const handleEnd = () => {
    if (currentSleep) {
      onUpdate(currentSleep.id, Date.now());
      navigate('/');
    }
  };

  const handleManualSave = () => {
    const start = new Date(manualStart).getTime();
    const end = new Date(manualEnd).getTime();
    if (end <= start) {
      alert("Wake up time must be after sleep time.");
      return;
    }
    onSubmit({ startTime: start, endTime: end });
    navigate('/');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Sleep</h2>
        <button onClick={() => navigate(-1)} className="text-slate-400 p-2"><i className="fas fa-times text-xl"></i></button>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button 
          onClick={() => setManualMode(false)}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${!manualMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Live Timer
        </button>
        <button 
          onClick={() => setManualMode(true)}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${manualMode ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Manual Log
        </button>
      </div>

      {!manualMode ? (
        <div className="flex flex-col items-center justify-center py-12 gap-8">
          <div className={`w-56 h-56 rounded-full flex flex-col items-center justify-center gap-4 border-8 shadow-inner transition-colors duration-500 ${currentSleep ? 'border-indigo-800 bg-indigo-950 text-white' : 'border-indigo-50 bg-white text-indigo-600'}`}>
            <i className={`fas ${currentSleep ? 'fa-moon' : 'fa-sun'} text-5xl ${currentSleep ? 'animate-pulse' : ''}`}></i>
            <div className="text-center">
              <h3 className="text-lg font-black">{currentSleep ? 'Sleeping...' : 'Awake'}</h3>
              {currentSleep && (
                <p className="text-[10px] font-bold text-indigo-300 mt-1 uppercase tracking-widest">
                  Started {new Date(currentSleep.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>

          <button 
            onClick={currentSleep ? handleEnd : handleStart}
            className={`w-full max-w-xs py-5 rounded-3xl font-black text-lg shadow-xl transition-all active:scale-95 ${currentSleep ? 'bg-rose-500 text-white' : 'bg-indigo-600 text-white'}`}
          >
            {currentSleep ? 'Wake Up Baby' : 'Start Nap Now'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Sleep Time</label>
              <input 
                type="datetime-local" 
                value={manualStart}
                onChange={(e) => setManualStart(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Wake Time</label>
              <input 
                type="datetime-local" 
                value={manualEnd}
                onChange={(e) => setManualEnd(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button 
            onClick={handleManualSave}
            className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl"
          >
            Save Manual Log
          </button>
        </div>
      )}
    </div>
  );
};

export default SleepForm;
