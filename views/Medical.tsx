
import React, { useState } from 'react';
import { BabyData, MedicalLog, MilestoneLog } from '../types';

interface MedicalProps {
  data: BabyData;
  onAddMedical: (log: Omit<MedicalLog, 'id'>) => void;
  onAddMilestone: (log: Omit<MilestoneLog, 'id'>) => void;
}

const Medical: React.FC<MedicalProps> = ({ data, onAddMedical, onAddMilestone }) => {
  const [activeTab, setActiveTab] = useState<'medical' | 'milestones'>('medical');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAdd = () => {
    if (!newTitle) return;
    const timestamp = new Date(newDate).getTime() + (12 * 60 * 60 * 1000); // Noon default
    if (activeTab === 'medical') {
      onAddMedical({ timestamp, type: 'visit', title: newTitle });
    } else {
      onAddMilestone({ timestamp, title: newTitle });
    }
    setNewTitle('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Care & Growth</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100"
        >
          <i className="fas fa-plus"></i>
        </button>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl">
        <button 
          onClick={() => setActiveTab('medical')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'medical' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Medical
        </button>
        <button 
          onClick={() => setActiveTab('milestones')}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${activeTab === 'milestones' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          Milestones
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'medical' ? (
          data.medical.length > 0 ? (
            data.medical.sort((a,b) => b.timestamp - a.timestamp).map(log => (
              <TimelineItem key={log.id} title={log.title} date={new Date(log.timestamp).toLocaleDateString()} icon="fa-stethoscope" color="bg-rose-50 text-rose-500" />
            ))
          ) : <EmptyState text="No medical visits logged yet." />
        ) : (
          data.milestones.length > 0 ? (
            data.milestones.sort((a,b) => b.timestamp - a.timestamp).map(log => (
              <TimelineItem key={log.id} title={log.title} date={new Date(log.timestamp).toLocaleDateString()} icon="fa-trophy" color="bg-amber-50 text-amber-500" />
            ))
          ) : <EmptyState text="No milestones reached yet. You can do it, baby!" />
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Add {activeTab === 'medical' ? 'Visit' : 'Milestone'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">What happened?</label>
                <input 
                  type="text" 
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g. First Smile, 2 Month Checkup"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">When did it happen?</label>
                <input 
                  type="date" 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Cancel</button>
              <button onClick={handleAdd} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TimelineItem: React.FC<{ title: string; date: string; icon: string; color: string }> = ({ title, date, icon, color }) => (
  <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-50 shadow-sm">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center shrink-0`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div className="flex-1">
      <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
      <p className="text-xs text-slate-400 font-medium">{date}</p>
    </div>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-20 flex flex-col items-center justify-center text-slate-300">
    <i className="fas fa-folder-open text-5xl mb-4"></i>
    <p className="text-sm font-medium">{text}</p>
  </div>
);

export default Medical;
