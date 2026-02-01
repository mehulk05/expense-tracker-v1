import React, { useMemo } from 'react';
import { PlannedExpense } from '../../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ICONS } from '../../../constants';

interface PlannedExpensesStatsProps {
    expenses: PlannedExpense[];
    categoryFilter: string | null;
    setCategoryFilter: (cat: string | null) => void;
}

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const PlannedExpensesStats: React.FC<PlannedExpensesStatsProps> = ({ expenses, categoryFilter, setCategoryFilter }) => {
    
    // --- Stats Calculations ---
    const stats = useMemo(() => {
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        
        // Category Breakdown
        const byCategory: Record<string, number> = {};
        expenses.forEach(e => {
            byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
        });
        
        const chartData = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

        // Next 7 Days
        const today = new Date();
        today.setHours(0,0,0,0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const upcoming = expenses.filter(e => {
            const d = new Date(e.dueDate);
            d.setHours(0,0,0,0);
            return d >= today && d <= nextWeek;
        }).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        return { total, chartData, upcoming };
    }, [expenses]);


    return (
        <div className="space-y-6">
            {/* Chart Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ICONS.Dashboard className="w-4 h-4 text-indigo-500" />
                    Expense Breakdown
                </h3>
                <div className="h-64 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {stats.chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                itemStyle={{color: '#1e293b', fontSize: '12px', fontWeight: 'bold'}}
                                formatter={(value: number) => `₹${value.toLocaleString()}`}
                            />
                            <Legend 
                                layout="horizontal" 
                                verticalAlign="bottom" 
                                align="center"
                                wrapperStyle={{fontSize: '10px', paddingTop: '10px'}}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mb-4">
                        <p className="text-xs text-slate-400 font-medium">Total</p>
                        <p className="text-lg font-bold text-slate-800">₹{(stats.total/1000).toFixed(1)}k</p>
                    </div>
                </div>
            </div>

            {/* Next 7 Days */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <ICONS.Calendar className="w-4 h-4 text-emerald-500" />
                        Next 7 Days
                    </h3>
                    <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-0.5 rounded-full">
                        {stats.upcoming.length}
                    </span>
                </div>
                
                <div className="space-y-3">
                    {stats.upcoming.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">No tasks for the week</p>
                    ) : (
                        stats.upcoming.map(exp => (
                            <div key={exp.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                    <p className="text-sm font-bold text-slate-700 truncate max-w-[120px]">{exp.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(exp.dueDate).toLocaleDateString('en-US', {weekday: 'short', day: 'numeric'})}
                                    </p>
                                </div>
                                <span className="text-sm font-bold text-slate-800">₹{exp.amount.toLocaleString()}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Category Filter Chips */}
            <div>
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Filter By Category</h3>
                 <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => setCategoryFilter(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!categoryFilter ? 'bg-slate-800 text-white shadow-md shadow-slate-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
                    >
                        All
                    </button>
                    {stats.chartData.map(item => (
                         <button 
                            key={item.name}
                            onClick={() => setCategoryFilter(categoryFilter === item.name ? null : item.name)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${categoryFilter === item.name ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
                        >
                            {item.name}
                        </button>
                    ))}
                 </div>
            </div>

        </div>
    );
};

export default PlannedExpensesStats;
