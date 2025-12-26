
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { BabyData } from '../types';

const Stats: React.FC<{ data: BabyData }> = ({ data }) => {
  const isMetric = data.settings.unitSystem === 'metric';

  const feedingData = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    data.feedings.forEach(f => {
      const day = new Date(f.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      if (f.amountMl) {
        const val = isMetric ? f.amountMl : f.amountMl / 29.57;
        grouped[day] = (grouped[day] || 0) + val;
      }
    });
    return Object.entries(grouped).map(([name, amount]) => ({ name, amount: parseFloat(amount.toFixed(1)) })).slice(-7);
  }, [data.feedings, isMetric]);

  const diaperStats = useMemo(() => {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;
    const counts = { wet: 0, dirty: 0, mixed: 0 };
    
    const recentDiapers = data.diapers.filter(d => d.timestamp >= last24h);
    recentDiapers.forEach(d => {
      counts[d.type]++;
    });
    
    const total = recentDiapers.length || 1;
    return [
      { name: 'Wet', value: counts.wet, color: '#3b82f6', percent: counts.wet / total },
      { name: 'Dirty', value: counts.dirty, color: '#b45309', percent: counts.dirty / total },
      { name: 'Mixed', value: counts.mixed, color: '#6366f1', percent: counts.mixed / total },
    ];
  }, [data.diapers]);

  const weightData = useMemo(() => {
    return data.growth.map(g => ({
      name: new Date(g.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      weight: isMetric ? g.weightKg : g.weightKg * 2.20462
    })).slice(-10);
  }, [data.growth, isMetric]);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
        <p className="text-xs text-slate-400 font-medium">Trends and daily summaries</p>
      </div>

      {/* Diaper Distribution - NOW 24H */}
      <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Diapers (Last 24h)</h3>
          <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-full uppercase">Today</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {diaperStats.map((stat) => (
            <div key={stat.name} className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                  <circle 
                    cx="50" cy="50" r="40" stroke={stat.color} strokeWidth="10" fill="transparent" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 * (1 - stat.percent)}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute text-lg font-black text-slate-800">{stat.value}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{stat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feedings Chart */}
      <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Milk Intake ({isMetric ? 'ml' : 'oz'})</h3>
        <div className="h-64 w-full">
          {feedingData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feedingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {feedingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === feedingData.length - 1 ? '#6366f1' : '#e0e7ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyStats icon="fa-bottle-droplet" label="No feeding data yet" />
          )}
        </div>
      </section>

      {/* Weight Growth Chart */}
      <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Weight Growth ({isMetric ? 'kg' : 'lb'})</h3>
        <div className="h-64 w-full">
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 4, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyStats icon="fa-chart-line" label="Log weight to see growth" />
          )}
        </div>
      </section>
    </div>
  );
};

const EmptyStats: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <div className="flex flex-col items-center justify-center h-full text-slate-300">
    <i className={`fas ${icon} text-4xl mb-2`}></i>
    <p className="text-sm font-medium">{label}</p>
  </div>
);

export default Stats;
