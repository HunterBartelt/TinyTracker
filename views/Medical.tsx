
import React, { useState, useContext } from 'react';
import { BabyData } from '../types';
import { DataContext } from '../App';

const Medical: React.FC<{ data: BabyData }> = ({ data }) => {
  const context = useContext(DataContext);
  if (!context) return null;
  const { saveLog, deleteLog } = context;

  const [activeTab, setActiveTab] = useState<'medical' | 'milestones'>('medical');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  const handleAdd = () => {
    if (!newTitle) return;
    const timestamp = new Date(newDate).getTime() + (12 * 60 * 60 * 1000); // Noon default
    if (activeTab === 'medical') {
      saveLog('medical', { timestamp, type: 'visit', title: newTitle });
    } else {
      saveLog('milestones', { timestamp, title: newTitle });
    }
    setNewTitle('');
    setShowAdd(false);
  };

  const handleDelete = (category: 'medical' | 'milestones', id: string) => {
    if (window.confirm('Delete this record permanently?')) {
      deleteLog(category, id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Care & Growth</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 active:scale-90 transition-all"
        >
          <i className="fas fa-plus text-lg"></i>
        </button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('medical')}
          className={`flex-1 py-3 rounded-xl font-black transition-all text-[10px] uppercase tracking-widest ${activeTab === 'medical' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
        >
          Medical
        </button>
        <button 
          onClick={() => setActiveTab('milestones')}
          className={`flex-1 py-3 rounded-xl font-black transition-all text-[10px] uppercase tracking-widest ${activeTab === 'milestones' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
        >
          Milestones
        </button>
      </div>

      <div className="space-y-4">
        {activeTab === 'medical' ? (
          data.medical.length > 0 ? (
            data.medical.sort((a,b) => b.timestamp - a.timestamp).map(log => (
              <TimelineItem key={log.id} title={log.title} date={new Date(log.timestamp).toLocaleDateString()} icon="fa-stethoscope" color="bg-rose-50 text-rose-500" onDelete={() => handleDelete('medical', log.id)} />
            ))
          ) : <EmptyState text="No medical visits logged yet." />
        ) : (
          data.milestones.length > 0 ? (
            data.milestones.sort((a,b) => b.timestamp - a.timestamp).map(log => (
              <TimelineItem key={log.id} title={log.title} date={new Date(log.timestamp).toLocaleDateString()} icon="fa-trophy" color="bg-amber-50 text-amber-500" onDelete={() => handleDelete('milestones', log.id)} />
            ))
          ) : <EmptyState text="No milestones reached yet." />
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-6 tracking-tight">Add {activeTab === 'medical' ? 'Visit' : 'Milestone'}</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Details</label>
                <input 
                  type="text" 
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="E.g. First Smile"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
                <input 
                  type="date" 
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-10">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</button>
              <button onClick={handleAdd} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TimelineItem: React.FC<{ title: string; date: string; icon: string; color: string; onDelete: () => void }> = ({ title, date, icon, color, onDelete }) => (
  <div className="flex items-center gap-5 bg-white p-5 rounded-[32px] border border-slate-50 shadow-sm relative group">
    <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shrink-0 shadow-inner`}>
      <i className={`fas ${icon} text-lg`}></i>
    </div>
    <div className="flex-1">
      <h3 className="font-black text-slate-800 text-sm leading-tight mb-0.5">{title}</h3>
      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{date}</p>
    </div>
    <button onClick={onDelete} className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-200 hover:text-rose-400 active:text-rose-500 transition-colors">
      <i className="fas fa-trash-can text-xs"></i>
    </button>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-24 flex flex-col items-center justify-center text-slate-300">
    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
      <i className="fas fa-folder-open text-2xl"></i>
    </div>
    <p className="text-[10px] font-black uppercase tracking-widest">{text}</p>
  </div>
);

export default Medical;
