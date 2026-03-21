import React, { useState, useMemo } from 'react';
import { NTMRecord, NTSRecord } from '../../types';
import { AppCard } from '../../components/ui/AppCard';
import { CustomDateRangePicker } from '../../components/ui/CustomDateRangePicker';
import { formatCurrency } from '../../utils/currency';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface AnalyticsProps {
  type: 'NTM' | 'NTS';
  records: (NTMRecord | NTSRecord)[];
}

type FilterType = 'week' | 'month' | 'last-month' | 'custom';

const PrivateTrackerAnalytics: React.FC<AnalyticsProps> = ({ type, records }) => {
  const [filter, setFilter] = useState<FilterType>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredRecords = useMemo(() => {
    const now = new Date();
    return records.filter(r => {
      const recordDate = new Date(r.date);
      if (filter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return recordDate >= weekAgo;
      }
      if (filter === 'month') {
        return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
      }
      if (filter === 'last-month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return recordDate.getMonth() === lastMonth.getMonth() && recordDate.getFullYear() === lastMonth.getFullYear();
      }
      if (filter === 'custom') {
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        return true;
      }
      return true;
    });
  }, [records, filter, startDate, endDate]);

  const stats = useMemo(() => {
    const total = filteredRecords.reduce((sum, r) => sum + r.count, 0);
    const avg = filteredRecords.length > 0 ? total / filteredRecords.length : 0;
    
    const activityByDay: Record<string, number> = {};
    filteredRecords.forEach(r => {
      activityByDay[r.date] = (activityByDay[r.date] || 0) + r.count;
    });
    
    let mostActiveDay = '-';
    let maxCount = 0;
    Object.entries(activityByDay).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = new Date(day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
    });

    const chartData = Object.entries(activityByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { total, avg, mostActiveDay, chartData };
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="flex bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
          {(['week', 'month', 'last-month', 'custom'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f 
                  ? 'bg-gray-900 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {f.replace('-', ' ')}
            </button>
          ))}
        </div>
        {filter === 'custom' && (
          <CustomDateRangePicker 
            startDate={startDate} 
            endDate={endDate} 
            onRangeChange={(s, e) => { setStartDate(s); setEndDate(e); }}
            className="!py-2 !px-4 !text-xs"
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AppCard className="p-5 bg-blue-50/50 border-blue-100" hoverEffect={false}>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Total Count</p>
          <p className="text-3xl font-black text-blue-900">{stats.total}</p>
        </AppCard>
        <AppCard className="p-5" hoverEffect={false}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Daily Average</p>
          <p className="text-3xl font-black text-gray-800">{stats.avg.toFixed(1)}</p>
        </AppCard>
        <AppCard className="p-5" hoverEffect={false}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Peak Day</p>
          <p className="text-3xl font-black text-gray-800">{stats.mostActiveDay}</p>
        </AppCard>
      </div>

      <AppCard className="p-6 h-[350px]">
        <p className="text-sm font-bold text-gray-500 mb-6">Activity Trend</p>
        <ResponsiveContainer width="100%" height="80%">
          <LineChart data={stats.chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 10, fontWeight: 700, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
              labelStyle={{ fontWeight: 800, color: '#111827', marginBottom: '4px' }}
              labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#2563eb" 
              strokeWidth={4} 
              dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </AppCard>
    </div>
  );
};

export default PrivateTrackerAnalytics;
