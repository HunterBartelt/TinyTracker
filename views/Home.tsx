
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BabyData } from '../types';
import { DataContext } from '../App';

const Home: React.FC<{ data: BabyData }> = ({ data }) => {
  const navigate = useNavigate();
  const isMetric = data.settings.unitSystem === 'metric';

  const lastFeeding = data.feedings[data.feedings.length - 1];
  const lastDiaper = data.diapers[data.diapers.length - 1];
  const activeSleep = data.sleep.find(s => !s.endTime);

  const formatVolume = (ml: number) => {
    if (isMetric) return `${ml} ml`;
    return `${(ml / 29.57).toFixed(1)} oz`;
  };

  const formatWeight = (kg: number) => {
    if (isMetric) return `${kg.toFixed(2)} kg`;
    return `${(kg * 2.20462).toFixed(1)} lb`;
  };

  const ensureMs = (t: number) => t < 1000000000000 ? t * 1000 : t;

  const handleEdit = (category: keyof BabyData, log: any) => {
    const routeMap: Record<string, string> = {
      feedings: '/feed',
      diapers: '/diaper',
      sleep: '/sleep',
      growth: '/growth'
    };
    const route = routeMap[category];
    if (route) {
      navigate(route, { state: { log } });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Status Grid */}
      <section className="grid grid-cols-2 gap-5">
        <StatusCard 
          title="Last Fed" 
          value={lastFeeding ? formatTimeAgo(ensureMs(lastFeeding.timestamp)) : 'No logs'} 
          subtitle={lastFeeding?.type === 'bottle' ? `${formatVolume(lastFeeding.amountMl || 0)} Bottle` : 'Nursing'}
          icon="fa-bottle-droplet" 
          color="text-orange-500"
          bgColor="bg-orange-50"
        />
        <StatusCard 
          title="Last Diaper" 
          value={lastDiaper ? formatTimeAgo(ensureMs(lastDiaper.timestamp)) : 'No logs'} 
          subtitle={lastDiaper?.type || ''}
          icon="fa-toilet-paper" 
          color="text-blue-500"
          bgColor="bg-blue-50"
        />
        <StatusCard 
          title="Sleep" 
          value={activeSleep ? 'Sleeping' : 'Awake'} 
          subtitle={activeSleep ? `Since ${new Date(ensureMs(activeSleep.startTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Ready for nap?'}
          icon="fa-moon" 
          color="text-indigo-600"
          bgColor="bg-indigo-50"
        />
        <StatusCard 
          title="Weight" 
          value={data.growth.length > 0 ? formatWeight(data.growth[data.growth.length - 1].weightKg) : 'N/A'} 
          subtitle="Latest log"
          icon="fa-weight-scale" 
          color="text-emerald-600"
          bgColor="bg-emerald-50"
        />
      </section>

      {/* Activity List */}
      <section>
        <div className="flex justify-between items-center mb-5 px-1">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Recent Activity</h2>
        </div>
        <div className="space-y-4">
          {[
            ...data.feedings.map(l => ({ ...l, _category: 'feedings' as keyof BabyData })),
            ...data.diapers.map(l => ({ ...l, _category: 'diapers' as keyof BabyData })),
            ...data.sleep.map(l => ({ ...l, _category: 'sleep' as keyof BabyData })),
            ...data.growth.map(l => ({ ...l, _category: 'growth' as keyof BabyData }))
          ].sort((a, b) => {
            const timeA = ensureMs('timestamp' in a ? a.timestamp : a.startTime);
            const timeB = ensureMs('timestamp' in b ? b.timestamp : b.startTime);
            return timeB - timeA;
          }).slice(0, 15).map((log, idx) => (
             <ActivityItem 
               key={idx} 
               log={log} 
               formatVolume={formatVolume} 
               ensureMs={ensureMs} 
               onEdit={() => handleEdit(log._category, log)} 
             />
          ))}
          {data.feedings.length === 0 && data.diapers.length === 0 && data.sleep.length === 0 && data.growth.length === 0 && (
            <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <i className="fas fa-baby-carriage text-slate-300 text-2xl"></i>
              </div>
              <p className="text-sm font-bold text-slate-400">Ready for your first entry?</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const StatusCard: React.FC<{ title: string; value: string; subtitle: string; icon: string; color: string; bgColor: string }> = ({ title, value, subtitle, icon, color, bgColor }) => (
  <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex flex-col gap-1 transition-all active:scale-95">
    <div className={`w-10 h-10 ${bgColor} ${color} rounded-2xl flex items-center justify-center mb-3 shadow-sm`}>
      <i className={`fas ${icon} text-lg`}></i>
    </div>
    <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</span>
    <span className="text-base font-black text-slate-800 leading-tight">{value}</span>
    <span className="text-[11px] text-slate-500 font-bold capitalize">{subtitle}</span>
  </div>
);

const ActivityItem: React.FC<{ log: any; formatVolume: (ml: number) => string; ensureMs: (t: number) => number; onEdit: () => void }> = ({ log, formatVolume, ensureMs, onEdit }) => {
  const isFeeding = log._category === 'feedings';
  const isDiaper = log._category === 'diapers';
  const isSleep = log._category === 'sleep';
  const isGrowth = log._category === 'growth';

  let icon = 'fa-info-circle';
  let color = 'bg-slate-100 text-slate-500';
  let title = 'Activity';
  let detail = '';
  let time = ensureMs('timestamp' in log ? log.timestamp : log.startTime);

  if (isFeeding) {
    icon = log.type === 'bottle' ? 'fa-bottle-droplet' : 'fa-person-breastfeeding';
    color = 'bg-orange-100 text-orange-600';
    title = log.type === 'bottle' ? 'Bottle' : 'Nursing';
    detail = log.amountMl ? formatVolume(log.amountMl) : `${(log.leftMinutes || 0) + (log.rightMinutes || 0)}m session`;
  } else if (isDiaper) {
    icon = 'fa-toilet-paper';
    color = 'bg-blue-100 text-blue-600';
    title = 'Diaper';
    detail = log.type;
  } else if (isSleep) {
    icon = 'fa-moon';
    color = 'bg-indigo-100 text-indigo-600';
    title = 'Sleep';
    detail = log.endTime ? 'Napped' : 'Started nap';
  } else if (isGrowth) {
    icon = 'fa-weight-scale';
    color = 'bg-emerald-100 text-emerald-600';
    title = 'Growth';
    detail = `${log.weightKg.toFixed(2)} kg`;
  }

  const date = new Date(time);
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="group flex items-center gap-5 bg-white p-5 rounded-[32px] border border-slate-50 shadow-sm relative">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shrink-0 shadow-inner`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-black text-slate-800 text-base leading-none mb-1">{title}</h3>
        <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest">{detail}</p>
      </div>
      <div className="text-right shrink-0 flex items-center gap-4">
        <div>
          <p className="text-sm font-black text-slate-800">
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {!isToday && (
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
              {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>
        <button 
          onClick={onEdit}
          className="w-10 h-10 bg-indigo-50 text-indigo-400 rounded-xl flex items-center justify-center active:bg-indigo-100 transition-colors"
        >
          <i className="fas fa-pencil text-xs"></i>
        </button>
      </div>
    </div>
  );
};

const formatTimeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  if (diff < 0) return "Just now";
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 365) return `${days}d ago`;
  return "Long ago";
};

export default Home;
