import React, { useMemo } from 'react';
import { DiaryEntry } from '../../types';
import { AppCard } from '../../components/ui/AppCard';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, BarChart, Bar, XAxis, YAxis 
} from 'recharts';

interface DiaryAnalyticsProps {
  entries: DiaryEntry[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];
const MOOD_COLORS: Record<string, string> = {
    'Happy': '#10b981',
    'Calm': '#6366f1',
    'Anxious': '#f59e0b',
    'Sad': '#3b82f6',
    'Angry': '#ef4444',
    'Excited': '#ec4899',
    'Tired': '#64748b',
    'Lonely': '#94a3b8',
    'Stressed': '#f43f5e',
    'Grateful': '#facc15',
    'Motivated': '#2dd4bf',
    'Neutral': '#cbd5e1'
};

const DiaryAnalytics: React.FC<DiaryAnalyticsProps> = ({ entries }) => {
  const stats = useMemo(() => {
    if (entries.length === 0) return null;

    // Mood distribution
    const moodCounts: Record<string, number> = {};
    entries.forEach(e => { moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1; });
    const pieData = Object.entries(moodCounts).map(([name, value]) => ({ name, value }));

    // Radar Data (Averages)
    const avgStress = entries.reduce((acc, e) => acc + (e.stress || 0), 0) / entries.length;
    const avgEnergy = entries.reduce((acc, e) => acc + (e.energy || 0), 0) / entries.length;
    const avgSleep = entries.reduce((acc, e) => acc + (e.sleep || 0), 0) / entries.length;

    const radarData = [
        { subject: 'Stress', A: avgStress, fullMark: 5 },
        { subject: 'Energy', A: avgEnergy, fullMark: 5 },
        { subject: 'Sleep', A: avgSleep || 0, fullMark: 5 },
    ];

    // Mood Timeline (Last 14 days or entries)
    const timelineData = [...entries].slice(0, 14).reverse().map(e => ({
        date: new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        mood: e.mood,
        stress: e.stress,
        energy: e.energy
    }));

    // Streak
    let streak = 0;
    const sortedDates = [...new Set(entries.map(e => e.date))].sort((a, b) => (b as string).localeCompare(a as string));
    const today = new Date().toISOString().split('T')[0];
    
    if (sortedDates.length > 0) {
        let current = today;
        let idx = 0;
        if (sortedDates[0] !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            current = yesterday.toISOString().split('T')[0];
        }

        while (idx < sortedDates.length) {
            if (sortedDates[idx] === current) {
                streak++;
                const d = new Date(current);
                d.setDate(d.getDate() - 1);
                current = d.toISOString().split('T')[0];
                idx++;
            } else { break; }
        }
    }

    return { pieData, radarData, timelineData, streak, avgStress };
  }, [entries]);

  if (!stats) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AppCard className="p-8 flex flex-col items-center justify-center text-center col-span-full border-dashed border-2 border-slate-200 bg-slate-50/50">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mb-4">✍️</div>
            <h3 className="text-lg font-bold text-slate-800">No data for this period</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mt-2">Start writing your diary to see your wellbeing insights and mood trends here.</p>
        </AppCard>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Card */}
        <AppCard className="p-5 bg-white border border-slate-200 shadow-sm" hoverEffect={false}>
          <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold">🔥</div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Streak</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-800">{stats.streak}</p>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Days</p>
          </div>
        </AppCard>

        {/* Avg Stress Card */}
        <AppCard className="p-5 bg-white border border-slate-200 shadow-sm" hoverEffect={false}>
          <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-xl font-bold">📊</div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Avg Stress</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-800">{stats.avgStress.toFixed(1)}</p>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">/ 5.0</p>
          </div>
        </AppCard>

        {/* Mood Doughnut Chart */}
        <AppCard className="p-5 bg-white border border-slate-200 shadow-sm md:col-span-2" hoverEffect={false}>
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mood Distribution</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequency</span>
          </div>
          <div className="h-40 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={MOOD_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                        stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '8px' }}
                    itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-slate-400 uppercase">Total</span>
                <span className="text-lg font-black text-slate-800 leading-none">{entries.length}</span>
            </div>
          </div>
        </AppCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart for Wellbeing */}
          <AppCard className="p-6 bg-white border border-slate-200 shadow-sm overflow-hidden" hoverEffect={false}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase tracking-widest">Wellbeing Synergy</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Radar Analysis</span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats.radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} hide />
                  <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="#6366f1"
                    fillOpacity={0.4}
                  />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                    itemStyle={{fontSize: '11px', fontWeight: 900}}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </AppCard>

          {/* Mood Timeline Timeline */}
          <AppCard className="p-6 bg-white border border-slate-200 shadow-sm" hoverEffect={false}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase tracking-widest">Reflection Timeline</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sequence</span>
            </div>
            <div className="flex flex-col gap-3">
                {stats.timelineData.map((e, idx) => (
                    <div key={idx} className="flex items-center gap-4 group">
                        <span className="text-[10px] font-black text-slate-400 w-12 uppercase tracking-tighter">{e.date}</span>
                        <div className="flex-1 flex items-center gap-2">
                            <div className="h-2 flex-1 bg-slate-50 rounded-full overflow-hidden flex">
                                <div 
                                    className="h-full rounded-full transition-all"
                                    style={{ 
                                        width: `${(e.energy || 0) * 20}%`, 
                                        backgroundColor: MOOD_COLORS[e.mood] || '#cbd5e1',
                                        opacity: 0.3 + ((e.energy || 0) * 0.14)
                                    }}
                                />
                            </div>
                            <span className="text-xs font-bold w-12 text-slate-600 truncate">{e.mood}</span>
                        </div>
                        <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shadow-sm opacity-60 group-hover:opacity-100 transition-opacity"
                            style={{ backgroundColor: `${MOOD_COLORS[e.mood]}15`, color: MOOD_COLORS[e.mood] }}
                        >
                            {e.mood === 'Happy' ? '😊' : e.mood === 'Calm' ? '😌' : e.mood === 'Anxious' ? '😰' : e.mood === 'Sad' ? '😢' : e.mood === 'Angry' ? '😡' : e.mood === 'Excited' ? '🤩' : '😴'}
                        </div>
                    </div>
                ))}
            </div>
          </AppCard>
      </div>

      {/* Self-Care Card */}
      <AppCard className="p-6 bg-slate-900 border-none shadow-xl shadow-slate-200 flex flex-col md:flex-row items-center gap-6" hoverEffect={false}>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shrink-0">
              {stats.avgStress > 3.5 ? '🧘' : stats.avgStress < 2 ? '⚡' : '✨'}
          </div>
          <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Personal Insight</p>
              <p className="text-lg font-bold text-white leading-relaxed">
                  {stats.avgStress > 3.5 
                    ? "Your average stress is quite high lately. We recommend taking 10 minutes for mindful breathing or a short walk."
                    : stats.avgStress < 2 && stats.streak > 3
                    ? "You're in a great state of flow! Your consistency is paying off in mental clarity."
                    : "Maintaining this reflection habit will help you identify subtle patterns in your wellbeing."}
              </p>
          </div>
      </AppCard>
    </div>
  );
};

export default DiaryAnalytics;
