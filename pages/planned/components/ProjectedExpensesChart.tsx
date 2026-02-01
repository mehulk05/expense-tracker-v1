import React, { useMemo } from 'react';
import { PlannedExpense } from '../../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ICONS } from '../../../constants';

interface ProjectedExpensesChartProps {
    expenses: PlannedExpense[];
}

const ProjectedExpensesChart: React.FC<ProjectedExpensesChartProps> = ({ expenses }) => {
    
    const chartData = useMemo(() => {
        const today = new Date();
        const data = [];

        for (let i = 0; i < 6; i++) {
            const currentMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthName = currentMonth.toLocaleDateString('en-US', { month: 'short' });
            const monthKey = `${currentMonth.getMonth()}-${currentMonth.getFullYear()}`;
            
            let monthlyTotal = 0;

            expenses.forEach(expense => {
                if (expense.status === 'paid' && expense.frequency === 'one-time') return; // Don't count past one-time paid

                const expDate = new Date(expense.dueDate);
                
                // Monthly: Count for every future month
                if (expense.frequency === 'monthly') {
                     monthlyTotal += expense.amount;
                }
                // Yearly: Count only if month matches
                else if (expense.frequency === 'yearly') {
                    if (expDate.getMonth() === currentMonth.getMonth()) {
                        monthlyTotal += expense.amount;
                    }
                }
                // One-time: Count only if exact month/year matches
                else if (expense.frequency === 'one-time') {
                     if (expDate.getMonth() === currentMonth.getMonth() && expDate.getFullYear() === currentMonth.getFullYear()) {
                         monthlyTotal += expense.amount;
                     }
                }
                // Weekly: Approx 4 weeks or logic for exact weeks per month. Using 4 for simplicity of projection.
                else if (expense.frequency === 'weekly') {
                     monthlyTotal += (expense.amount * 4);
                }
            });

            data.push({
                name: monthName,
                amount: monthlyTotal
            });
        }
        return data;
    }, [expenses]);

    // Format for tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                    <p className="text-xs font-bold text-slate-500 mb-1">{label}</p>
                    <p className="text-sm font-bold text-indigo-600">
                        ₹{payload[0].value.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="mb-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
                 <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ICONS.Chart className="w-5 h-5 text-indigo-500" />
                        Projected Cashflow
                    </h3>
                    <p className="text-sm text-slate-500">Estimated expenses for next 6 months</p>
                 </div>
                 <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-500">
                     <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Projected
                     </span>
                 </div>
             </div>
             
             <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barSize={32}>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} 
                            tickFormatter={(value) => `₹${value/1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                        <Bar dataKey="amount" radius={[6, 6, 6, 6]}>
                             {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#c7d2fe'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>
    );
};

export default ProjectedExpensesChart;
