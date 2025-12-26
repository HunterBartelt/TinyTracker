
import React, { useState, useEffect, createContext } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BabyData, FeedingLog, DiaperLog, SleepLog, GrowthLog, MedicalLog, MilestoneLog, UserSettings } from './types';
import Home from './views/Home';
import FeedingForm from './views/FeedingForm';
import DiaperForm from './views/DiaperForm';
import SleepForm from './views/SleepForm';
import GrowthForm from './views/GrowthForm';
import Stats from './views/Stats';
import Medical from './views/Medical';
import Settings from './views/Settings';

const STORAGE_KEY = 'tinytrack_data_v5';

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

interface DataContextType {
  data: BabyData;
  updateSettings: (s: Partial<UserSettings>) => void;
  importLogs: (newData: Partial<BabyData>) => { added: number };
  deleteLog: (category: keyof BabyData, id: string) => void;
  saveLog: (category: keyof BabyData, log: any) => void;
  clearAllData: () => void;
}

export const DataContext = createContext<DataContextType | null>(null);

const App: React.FC = () => {
  const [data, setData] = useState<BabyData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const base: BabyData = {
      feedings: [],
      diapers: [],
      sleep: [],
      growth: [],
      medical: [],
      milestones: [],
      settings: { unitSystem: 'metric' }
    };
    if (!saved) return base;
    try {
      const parsed = JSON.parse(saved);
      return { ...base, ...parsed };
    } catch (e) {
      return base;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...newSettings } }));
  };

  const deleteLog = (category: keyof BabyData, id: string) => {
    setData(prev => {
      const target = prev[category];
      if (!Array.isArray(target)) return prev;
      return {
        ...prev,
        [category]: target.filter((item: any) => item.id !== id)
      };
    });
  };

  const saveLog = (category: keyof BabyData, log: any) => {
    setData(prev => {
      const target = prev[category] as any[];
      const isUpdate = !!log.id;
      const finalLog = isUpdate ? log : { ...log, id: generateId() };
      
      let newList;
      if (isUpdate) {
        newList = target.map(item => item.id === log.id ? finalLog : item);
      } else {
        newList = [...target, finalLog];
      }
      
      // Keep sorted by time
      newList.sort((a, b) => (a.timestamp || a.startTime) - (b.timestamp || b.startTime));
      
      return { ...prev, [category]: newList };
    });
  };

  const clearAllData = () => {
    const base: BabyData = {
      feedings: [],
      diapers: [],
      sleep: [],
      growth: [],
      medical: [],
      milestones: [],
      settings: { unitSystem: 'metric' }
    };
    setData(base);
    localStorage.removeItem(STORAGE_KEY);
  };

  const importLogs = (newData: Partial<BabyData>) => {
    let totalAdded = 0;
    setData(prev => {
      const ensureMs = (t: any) => {
        const num = Number(t);
        if (isNaN(num)) return 0;
        return num < 1000000000000 ? num * 1000 : num;
      };

      const merge = (existing: any[], incoming: any[] = []) => {
        if (!incoming || !Array.isArray(incoming)) return existing;
        const existingIds = new Set(existing.map(e => e.id).filter(Boolean));
        const existingTimes = new Set(existing.map(e => ensureMs(e.timestamp || e.startTime || 0)));
        
        const preparedIncoming = incoming
          .filter(item => item && (item.timestamp || item.startTime))
          .map(item => {
            const timeField = item.timestamp ? 'timestamp' : 'startTime';
            const endField = item.endTime ? 'endTime' : null;
            const newItem = {
              ...item,
              id: item.id || generateId(),
              [timeField]: ensureMs(item[timeField])
            };
            if (endField && item[endField]) {
              newItem[endField] = ensureMs(item[endField]);
            }
            return newItem;
          })
          .filter(item => {
            const time = item.timestamp || item.startTime;
            const isNew = !existingIds.has(item.id) && !existingTimes.has(time);
            if (isNew) totalAdded++;
            return isNew;
          });

        return [...existing, ...preparedIncoming].sort((a, b) => (a.timestamp || a.startTime) - (b.timestamp || b.startTime));
      };

      return {
        ...prev,
        feedings: merge(prev.feedings, newData.feedings),
        diapers: merge(prev.diapers, newData.diapers),
        sleep: merge(prev.sleep, newData.sleep),
        growth: merge(prev.growth, newData.growth),
        medical: merge(prev.medical, newData.medical),
        milestones: merge(prev.milestones, newData.milestones),
      };
    });
    return { added: totalAdded };
  };

  return (
    <DataContext.Provider value={{ data, updateSettings, importLogs, deleteLog, saveLog, clearAllData }}>
      <Router>
        <div className="flex flex-col min-h-screen max-w-4xl mx-auto bg-white shadow-2xl relative overflow-hidden transition-all duration-500">
          <header className="px-6 pt-10 pb-6 bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100 flex justify-between items-center">
            <h1 className="text-2xl font-black bg-gradient-to-br from-indigo-600 to-purple-700 bg-clip-text text-transparent tracking-tight">
              TinyTrack
            </h1>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <i className="fas fa-baby text-indigo-600 text-lg"></i>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto pb-44 px-6 pt-6">
            <Routes>
              <Route path="/" element={<Home data={data} />} />
              <Route path="/feed" element={<FeedingForm />} />
              <Route path="/diaper" element={<DiaperForm />} />
              <Route path="/sleep" element={<SleepForm currentSleep={data.sleep.find(s => !s.endTime)} onUpdate={(id, end) => {
                setData(prev => ({
                  ...prev,
                  sleep: prev.sleep.map(s => s.id === id ? { ...s, endTime: end } : s)
                }));
              }} />} />
              <Route path="/growth" element={<GrowthForm />} />
              <Route path="/stats" element={<Stats data={data} />} />
              <Route path="/medical" element={<Medical data={data} />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>

          <nav className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-white/95 backdrop-blur-3xl border-t border-slate-100 flex items-center px-1 py-4 safe-bottom shadow-[0_-15px_60px_rgba(0,0,0,0.1)] z-50">
            <div className="flex-1 flex justify-evenly items-center">
              <NavLink to="/" icon="fa-home" label="Home" />
              <NavLink to="/stats" icon="fa-chart-pie" label="Stats" />
            </div>
            
            <div className="w-16 shrink-0 relative flex justify-center">
               <div className="absolute -top-8">
                  <QuickLog />
               </div>
            </div>

            <div className="flex-1 flex justify-evenly items-center">
              <NavLink to="/medical" icon="fa-kit-medical" label="Care" />
              <NavLink to="/settings" icon="fa-sliders" label="Settings" />
            </div>
          </nav>
        </div>
      </Router>
    </DataContext.Provider>
  );
};

const NavLink: React.FC<{ to: string; icon: string; label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 transition-all duration-300 min-w-[50px] ${isActive ? 'text-indigo-600 scale-105' : 'text-slate-400'}`}>
      <i className={`fas ${icon} text-base`}></i>
      <span className="text-[7px] font-black uppercase tracking-tight">{label}</span>
    </Link>
  );
};

const QuickLog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 border-4 border-white active:scale-90 transition-all duration-300"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-plus'} text-xl transition-transform ${isOpen ? 'rotate-90' : ''}`}></i>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-lg z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20 w-56 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <QuickActionButton to="/feed" icon="fa-bottle-droplet" color="bg-orange-500" label="Feeding" onClick={() => setIsOpen(false)} />
            <QuickActionButton to="/diaper" icon="fa-toilet-paper" color="bg-blue-500" label="Diaper" onClick={() => setIsOpen(false)} />
            <QuickActionButton to="/sleep" icon="fa-moon" color="bg-indigo-900" label="Sleep" onClick={() => setIsOpen(false)} />
            <QuickActionButton to="/growth" icon="fa-weight-scale" color="bg-emerald-500" label="Growth" onClick={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

const QuickActionButton: React.FC<{ to: string; icon: string; color: string; label: string; onClick: () => void }> = ({ to, icon, color, label, onClick }) => (
  <Link to={to} onClick={onClick} className="flex items-center gap-3 w-full bg-white p-3 rounded-2xl shadow-lg border border-slate-50 active:scale-95 transition-all">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white`}>
      <i className={`fas ${icon} text-base`}></i>
    </div>
    <span className="text-sm font-black text-slate-800 tracking-tight">{label}</span>
  </Link>
);

export default App;
