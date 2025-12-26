
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FeedingLog, FeedingType } from '../types';
import { DataContext } from '../App';

const FeedingForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const context = useContext(DataContext);
  if (!context) return null;
  const { saveLog, deleteLog, data } = context;
  const isMetric = data.settings.unitSystem === 'metric';

  const editLog = location.state?.log as FeedingLog | undefined;
  const isEditing = !!editLog;
  
  const [type, setType] = useState<FeedingType>(editLog?.type || 'bottle');
  const [displayAmount, setDisplayAmount] = useState(
    editLog?.amountMl 
      ? (isMetric ? editLog.amountMl : parseFloat((editLog.amountMl / 29.57).toFixed(1)))
      : (isMetric ? 120 : 4)
  );
  const [leftMin, setLeftMin] = useState(editLog?.leftMinutes || 10);
  const [rightMin, setRightMin] = useState(editLog?.rightMinutes || 10);
  const [customTime, setCustomTime] = useState(
    editLog ? new Date(editLog.timestamp < 1000000000000 ? editLog.timestamp * 1000 : editLog.timestamp).toISOString().slice(0, 16)
            : new Date().toISOString().slice(0, 16)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountMl = isMetric ? displayAmount : displayAmount * 29.57;
    saveLog('feedings', {
      id: editLog?.id,
      timestamp: new Date(customTime).getTime(),
      type,
      amountMl: type === 'bottle' ? Math.round(amountMl) : undefined,
      leftMinutes: type === 'nursing' ? leftMin : undefined,
      rightMinutes: type === 'nursing' ? rightMin : undefined,
    });
    navigate('/');
  };

  const handleDelete = () => {
    if (editLog && window.confirm('Delete this record permanently?')) {
      deleteLog('feedings', editLog.id);
      navigate('/');
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">{isEditing ? 'Edit Feeding' : 'Feeding'}</h2>
        <button onClick={() => navigate(-1)} className="text-slate-400 p-2"><i className="fas fa-times text-xl"></i></button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button 
          onClick={() => setType('bottle')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'bottle' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Bottle
        </button>
        <button 
          onClick={() => setType('nursing')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'nursing' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Nursing
        </button>
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

      <form onSubmit={handleSubmit} className="space-y-8 pb-10">
        {type === 'bottle' ? (
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-40 h-40 rounded-full border-8 border-indigo-50 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-indigo-600">{displayAmount}</span>
              <span className="text-sm font-bold text-slate-400 uppercase">{isMetric ? 'ml' : 'oz'}</span>
            </div>
            
            <div className="w-full flex justify-between items-center px-4">
              <AdjustButton icon="fa-minus" onClick={() => setDisplayAmount(Math.max(0, isMetric ? displayAmount - 10 : displayAmount - 0.5))} />
              <div className="text-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Adjust</p>
                <div className="flex gap-2">
                  <QuickAdd onClick={() => setDisplayAmount(isMetric ? 60 : 2)} label={isMetric ? "60" : "2oz"} />
                  <QuickAdd onClick={() => setDisplayAmount(isMetric ? 120 : 4)} label={isMetric ? "120" : "4oz"} />
                  <QuickAdd onClick={() => setDisplayAmount(isMetric ? 180 : 6)} label={isMetric ? "180" : "6oz"} />
                </div>
              </div>
              <AdjustButton icon="fa-plus" onClick={() => setDisplayAmount(isMetric ? displayAmount + 10 : displayAmount + 0.5)} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <SideTimer label="Left Side" value={leftMin} onChange={setLeftMin} />
            <SideTimer label="Right Side" value={rightMin} onChange={setRightMin} />
          </div>
        )}

        <div className="space-y-3">
          <button 
            type="submit" 
            className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-200 active:scale-[0.98] transition-all"
          >
            {isEditing ? 'Update Record' : 'Save Log'}
          </button>
          
          {isEditing && (
            <button 
              type="button" 
              onClick={handleDelete}
              className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-sm active:bg-rose-100 transition-all border border-rose-100/50"
            >
              Delete Record
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const AdjustButton: React.FC<{ icon: string; onClick: () => void }> = ({ icon, onClick }) => (
  <button type="button" onClick={onClick} className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-700 shadow-sm active:bg-slate-50">
    <i className={`fas ${icon}`}></i>
  </button>
);

const QuickAdd: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button type="button" onClick={onClick} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black hover:bg-indigo-50 hover:text-indigo-600 border border-slate-100">
    {label}
  </button>
);

const SideTimer: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-3xl font-black text-slate-800">{value}</span>
    <span className="text-[10px] font-bold text-slate-400 uppercase">minutes</span>
    <div className="flex gap-2 mt-2">
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><i className="fas fa-minus"></i></button>
      <button type="button" onClick={() => onChange(value + 1)} className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500"><i className="fas fa-plus"></i></button>
    </div>
  </div>
);

export default FeedingForm;
