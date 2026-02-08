import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, LabelList } from 'recharts';
import { formatCurrency } from '../../utils/currency';
import { AppCard } from '../../components/ui/AppCard';
import { ICONS } from '../../constants';
import { useNavigate } from 'react-router-dom';

interface CategoryBarChartProps {
  data: { name: string; value: number }[];
  totalSpent: number;
}

// Colors from mockup: Purple, Light Purple, Pink, Teal, Orange
const COLORS = ['#8b5cf6', '#a78bfa', '#f472b6', '#2dd4bf', '#fbbf24', '#6366f1', '#10b981', '#f59e0b'];

const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ data, totalSpent }) => {
  const navigate = useNavigate();

  if (data.length === 0) {
    return (
        <AppCard className="p-8 flex flex-col items-center justify-center text-center h-[400px]">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500">
                <ICONS.Category className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Category Data</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
                Categorize your expenses to see where your money goes.
            </p>
        </AppCard>
    );
  }

  // Sort and take top 5 to match the clean look of the mockup (mockup has 5 bars)
  const chartData = [...data].sort((a,b) => b.value - a.value).slice(0, 5);

  return (
    <AppCard className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-lg font-bold text-slate-900">Category Spending</h3>
        <span className="text-sm font-medium text-slate-500">Total: {formatCurrency(totalSpent)}</span>
      </div>
      
      <div className="h-[300px] w-full mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 0, left: 0, bottom: 0 }}
            barSize={48}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 500}} 
                interval={0}
                dy={10}
            />
            <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 500}} 
                tickFormatter={(value) => value >= 1000 ? `₹${(value/1000).toFixed(0)}k` : `₹${value}`}
            />
            <Tooltip 
              cursor={{fill: '#f8fafc'}}
              contentStyle={{
                backgroundColor: '#fff', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                padding: '12px'
              }}
              itemStyle={{color: '#334155', fontSize: '12px', fontWeight: '600'}}
              formatter={(value: number) => [
                  `${formatCurrency(value)}`, 
                  'Spent'
              ]}
              labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}
            />
            <Bar dataKey="value" radius={[8, 8, 8, 8]}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList 
                    dataKey="value" 
                    position="top" 
                    formatter={(value: number) => value >= 1000 ? `₹${(value/1000).toFixed(0)}k` : `₹${value}`}
                    style={{ fill: '#64748b', fontSize: '11px', fontWeight: 'bold' }}
                />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="flex flex-wrap justify-center gap-8 md:gap-12">
        {chartData.map((entry, index) => (
            <div key={index} className="flex flex-col items-center gap-1">
                <div className={`w-3 h-3 rounded-full mb-1`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="textxs font-medium text-slate-500">{entry.name.split(' ')[0]}</span>
                <span className="text-sm font-bold text-slate-900">
                    {Math.round((entry.value / totalSpent) * 100)}%
                </span>
            </div>
        ))}
      </div>
    </AppCard>
  );
};

export default CategoryBarChart;
