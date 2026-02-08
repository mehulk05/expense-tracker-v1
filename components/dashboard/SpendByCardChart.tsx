import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/currency';
import { AppCard } from '../../components/ui/AppCard';

interface SpendByCardChartProps {
  data: { name: string; value: number }[];
}

// Colors from mockup: Blue, Teal, Pink, Green
const COLORS = ['#8b5cf6', '#2dd4bf', '#f472b6', '#a3e635', '#fbbf24', '#6366f1'];

const SpendByCardChart: React.FC<SpendByCardChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (data.length === 0) {
      return (
        <AppCard className="p-6 h-[400px] flex items-center justify-center">
             <p className="text-sm text-slate-400 font-medium">No spending data available</p>
        </AppCard>
      );
  }

  return (
    <AppCard className="p-6 md:p-8 flex flex-col justify-between">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Spending Across Cards</h3>
      
      <div className="h-[250px] w-full relative mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={0} // Mockup looks solid, but standard Pie logic apply. User said "doghnut" before but screenshot is solid. I will use solid.
              outerRadius={80}
              paddingAngle={0}
              dataKey="value"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                const RADIAN = Math.PI / 180;
                const radius = outerRadius + 25; 
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                return (percent > 0.05) ? (
                  <text 
                    x={x} 
                    y={y} 
                    fill={COLORS[index % COLORS.length]} 
                    textAnchor={x > cx ? 'start' : 'end'} 
                    dominantBaseline="central"
                    className="text-xs font-bold"
                  >
                    {`${data[index].name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                  </text>
                ) : null;
              }}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                padding: '12px'
              }}
              itemStyle={{color: '#334155', fontSize: '12px', fontWeight: '600'}}
              formatter={(value: number) => [formatCurrency(value), 'Spent']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed List */}
      <div className="space-y-3">
        {data.map((entry, index) => (
            <div key={index} className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                    <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                        {entry.name}
                    </span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(entry.value)}
                </span>
            </div>
        ))}
      </div>
    </AppCard>
  );
};

export default SpendByCardChart;
