import React from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/currency';
import { AppCard } from '../../components/ui/AppCard';
import { ICONS } from '../../constants';
import { useNavigate } from 'react-router-dom';

interface SpendingTrendChartProps {
  data: { name: string; value: number }[];
  loading?: boolean;
}

const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({ data, loading }) => {
  const navigate = useNavigate();

  if (!loading && data.length === 0) {
    return (
        <AppCard className="p-8 flex flex-col items-center justify-center text-center h-[300px]">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500">
                <ICONS.TrendingUp className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Spending Data</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
                Start tracking your expenses to see your spending trends over time.
            </p>
            <button 
                onClick={() => navigate('/expenses')}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
                Add First Expense
            </button>
        </AppCard>
    );
  }

  return (
    <AppCard className="p-6 md:p-8">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Spending Trend</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} 
                minTickGap={30}
                dy={10}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} 
                width={40}
                tickFormatter={(value) => `₹${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                padding: '12px'
              }}
              itemStyle={{color: '#1e293b', fontSize: '12px', fontWeight: '600'}}
              formatter={(value: number) => [formatCurrency(value), 'Spent']}
              labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}
            />
            <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorSpent)" 
                activeDot={{r: 6, strokeWidth: 0, fill: '#2563eb'}} 
                animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AppCard>
  );
};

export default SpendingTrendChart;
