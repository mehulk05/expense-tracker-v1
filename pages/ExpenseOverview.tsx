import React, { useState, useEffect, useMemo } from 'react';
import { ICONS } from '../constants';
import { storage } from '../services/storage';
import { Expense, Category, Account } from '../types';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const ExpenseOverview: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    
    // View Toggle State: 'month' (Current Month) vs 'total' (Lifetime)
    const [viewMode, setViewMode] = useState<'month' | 'total'>('month');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [exps, cats, accs] = await Promise.all([
                    storage.getExpenses(),
                    storage.getCategories(),
                    storage.getAccounts()
                ]);
                setExpenses(exps);
                setCategories(cats);
                setAccounts(accs);
            } catch (err) {
                console.error("Failed to load overview data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const metrics = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Helper to get dates for comparison
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonthName = `${monthNames[currentMonth]} ${currentYear}`;
        const lastMonthName = `${monthNames[lastMonth]} ${lastMonthYear}`;
        const shortCurr = monthNames[currentMonth];
        const shortLast = monthNames[lastMonth];

        // 1. Filter Expenses
        const monthlyExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const lastMonthExpenses = expenses.filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });

        // 2. Base Totals
        const totalSpentMonth = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalSpentLifetime = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalSpentLastMonth = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        const momChange = totalSpentLastMonth > 0 
            ? ((totalSpentMonth - totalSpentLastMonth) / totalSpentLastMonth) * 100 
            : 0;

        // 3. Selection based on ViewMode
        const displayedTotalSpent = viewMode === 'month' ? totalSpentMonth : totalSpentLifetime;
        const displayedExpenses = viewMode === 'month' ? monthlyExpenses : expenses;

        // 4. Budget Logic
        const totalBudget = categories.reduce((sum, c) => {
             return sum + (c.budgetFrequency === 'yearly' ? (c.budget || 0) / 12 : (c.budget || 0));
        }, 0);
        const remainingBudget = Math.max(0, totalBudget - totalSpentMonth);
        const budgetHealth = totalBudget > 0 ? (totalSpentMonth / totalBudget) * 100 : 0;

        // 5. Category Breakdown (SHOW ALL, sorted by spend)
        const categoryStats = categories.map(c => {
            const relevantExpenses = viewMode === 'month' ? monthlyExpenses : expenses;
            const spent = relevantExpenses
                .filter(e => e.categoryId === c.id)
                .reduce((sum, e) => sum + e.amount, 0);
            
            const totalForCalc = viewMode === 'month' ? totalSpentMonth : totalSpentLifetime;
            const percentage = totalForCalc > 0 ? (spent / totalForCalc) * 100 : 0;
            return { ...c, spent, percentage };
        })
        .sort((a,b) => b.spent - a.spent);

        // Chart Data for Categories
        const categoryChartData = categoryStats
            .filter(c => c.spent > 0)
            .map(c => ({ name: c.name, value: c.spent }));

        // 6. Monthly Comparison List
        const comparisonList = categories.map(c => {
            const thisMonth = monthlyExpenses
                .filter(e => e.categoryId === c.id)
                .reduce((sum, e) => sum + e.amount, 0);
            const lastVal = lastMonthExpenses
                .filter(e => e.categoryId === c.id)
                .reduce((sum, e) => sum + e.amount, 0);
            return { name: c.name, thisMonth, lastVal, diff: thisMonth - lastVal };
        }).sort((a,b) => b.thisMonth - a.thisMonth);

        // 7. Payment Trends (SHOW ALL types)
        const definedMethods = ['cash', 'upi', 'credit', 'debit'];
        const paymentStatsRaw = displayedExpenses.reduce((acc, curr) => {
            const type = curr.paymentMethod || 'other';
            acc[type] = (acc[type] || 0) + curr.amount;
            return acc;
        }, {} as Record<string, number>);

        const paymentData = definedMethods.map(methodKey => {
            const val = paymentStatsRaw[methodKey] || 0;
            return {
                name: methodKey === 'credit' ? 'Credit Card' : methodKey === 'upi' ? 'UPI' : methodKey === 'debit' ? 'Debit Card' : 'Cash',
                value: val,
                percentage: displayedTotalSpent > 0 ? (val / displayedTotalSpent) * 100 : 0,
                colorKey: methodKey
            };
        }).sort((a,b) => b.value - a.value);

        // Daily Average
        const dailyAverage = totalSpentMonth / Math.min(new Date(currentYear, currentMonth + 1, 0).getDate(), new Date().getDate());

        return {
            totalSpentMonth,
            totalSpentLifetime,
            displayedTotalSpent,
            lastMonthSpent: totalSpentLastMonth,
            momChange,
            totalBudget,
            remainingBudget,
            budgetHealth,
            categoryStats,
            categoryChartData,
            comparisonList,
            paymentData,
            monthNames: { current: currentMonthName, last: lastMonthName, shortCurr, shortLast },
            dailyAverage,
            transactionCount: displayedExpenses.length
        };
    }, [expenses, categories, viewMode]);

    const CATEGORY_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#64748b', '#94a3b8'];
    const PAYMENT_COLORS: Record<string, string> = {
        'cash': '#22c55e',
        'upi': '#f59e0b',
        'credit': '#3b82f6',
        'debit': '#8b5cf6',
        'other': '#94a3b8'
    };

    if (loading) return <div className="p-8"><div className="h-10 w-48 skeleton rounded mb-8"></div></div>;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                   <h1 className="text-2xl font-black text-slate-900 tracking-tight">Overview</h1>
                   <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">
                       {viewMode === 'month' ? metrics.monthNames.current : 'All Time Overview'}
                   </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-1 rounded-xl flex text-xs font-bold">
                        <button 
                            onClick={() => setViewMode('month')} 
                            className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Monthly
                        </button>
                        <button 
                            onClick={() => setViewMode('total')} 
                            className={`px-4 py-2 rounded-lg transition-all ${viewMode === 'total' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Total
                        </button>
                    </div>
                </div>
            </div>

            {/* TOP METRICS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* 1. Total Spend (Context Aware) */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                         <ICONS.Expense className="w-12 h-12 text-indigo-600" />
                     </div>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">
                         {viewMode === 'month' ? 'Total Spent (Month)' : 'Total Spent (All Time)'}
                     </p>
                     <p className="text-2xl font-black text-slate-900 mb-1">{formatCurrency(metrics.displayedTotalSpent)}</p>
                     {viewMode === 'month' && (
                         <div className="flex items-center gap-1">
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${metrics.momChange > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                 {metrics.momChange > 0 ? '↑' : '↓'} {Math.abs(metrics.momChange).toFixed(1)}%
                             </span>
                             <span className="text-[10px] text-slate-400 font-bold">vs last mo</span>
                         </div>
                     )}
                </div>

                 {/* 2. Budget Remaining */}
                 <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                         <ICONS.Chart className="w-12 h-12 text-emerald-600" />
                     </div>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Month Budget</p>
                     <p className={`text-2xl font-black mb-1 ${metrics.remainingBudget < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                         {formatCurrency(metrics.remainingBudget)}
                     </p>
                     <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                         <div 
                            className={`h-full rounded-full ${metrics.budgetHealth > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(metrics.budgetHealth, 100)}%` }}
                         />
                     </div>
                </div>

                {/* 3. Daily Average */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                         <ICONS.Calendar className="w-12 h-12 text-blue-600" />
                     </div>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Daily Avg (Month)</p>
                     <p className="text-2xl font-black text-slate-900 mb-1">{formatCurrency(metrics.dailyAverage)}</p>
                     <p className="text-[10px] text-slate-400 font-bold">per day</p>
                </div>

                 {/* 4. Transactions Count */}
                 <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                         <ICONS.Dashboard className="w-12 h-12 text-orange-600" />
                     </div>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Transactions</p>
                     <p className="text-2xl font-black text-slate-900 mb-1">{metrics.transactionCount}</p>
                     <p className="text-[10px] text-slate-400 font-bold">in {viewMode === 'month' ? 'current month' : 'total'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* SECTION 1: CATEGORY BREAKDOWN (Context Aware) */}
                 <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
                    <div className="mb-6 flex justify-between items-start">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Category Breakdown</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{viewMode === 'month' ? 'Current Month' : 'All Time'} Distribution</p>
                        </div>
                    </div>
                    
                    <div className="space-y-5 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {metrics.categoryStats.map((cat, idx) => (
                            <div key={cat.id}>
                                <div className="flex justify-between items-end mb-1">
                                    <div className="flex items-center gap-2">
                                         <div className={`p-1.5 rounded-lg bg-slate-50 text-slate-600`}>
                                             <ICONS.Category className="w-4 h-4" />
                                         </div>
                                         <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black text-slate-900">{formatCurrency(cat.spent)}</span>
                                    </div>
                                </div>
                                <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                                        style={{ 
                                            width: `${cat.percentage}%`,
                                            backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 text-right">{cat.percentage.toFixed(1)}%</p>
                            </div>
                        ))}
                        {metrics.categoryStats.length === 0 && <p className="text-center text-slate-400 text-xs py-8">No categories found</p>}
                    </div>
                 </div>

                 {/* SECTION 2: COMPARISON OR ANALYSIS (Based on ViewMode) */}
                 <div className="space-y-8">
                     
                     {/* IF MONTHLY VIEW: Show Comparison List */}
                     {viewMode === 'month' ? (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-lg font-black text-slate-900">Monthly Comparison</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    {metrics.monthNames.current} vs {metrics.monthNames.last}
                                </p>
                            </div>

                            {/* Summary Header for Comparison */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">{metrics.monthNames.shortLast}</p>
                                    <p className="text-lg font-black text-indigo-900">{formatCurrency(metrics.lastMonthSpent)}</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 relative overflow-hidden">
                                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1">{metrics.monthNames.shortCurr}</p>
                                    <p className="text-lg font-black text-emerald-900">{formatCurrency(metrics.totalSpentMonth)}</p>
                                    <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-black ${metrics.momChange > 0 ? 'bg-white/50 text-rose-600' : 'bg-white/50 text-emerald-600'}`}>
                                        {metrics.momChange > 0 ? '↑' : '↓'}{Math.abs(metrics.momChange).toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            {/* Detailed List */}
                            <div className="max-h-64 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">
                                    <span>Category</span>
                                    <div className="flex gap-6">
                                        <span className="w-16 text-right">{metrics.monthNames.shortLast}</span>
                                        <span className="w-16 text-right">{metrics.monthNames.shortCurr}</span>
                                    </div>
                                </div>
                                
                                {metrics.comparisonList.map(item => (
                                    <div key={item.name} className="flex items-center justify-between text-xs p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                        <span className="font-bold text-slate-700 flex-1 truncate">{item.name}</span>
                                        <div className="flex gap-6 text-right">
                                            <span className="font-medium text-slate-400 w-16">{formatCurrency(item.lastVal)}</span>
                                            <span className={`font-bold w-16 ${item.thisMonth > item.lastVal ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {formatCurrency(item.thisMonth)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                     ) : (
                        /* IF TOTAL VIEW: Show Visual Analysis Chart */
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[420px]">
                             <div className="mb-2">
                                <h2 className="text-lg font-black text-slate-900">Category Analysis</h2>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">All-time Spending Distribution</p>
                            </div>
                            <div className="h-full w-full -mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={metrics.categoryChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {metrics.categoryChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Legend 
                                            layout="vertical" 
                                            verticalAlign="middle" 
                                            align="right"
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                     )}

                     {/* Payment Breakdown (Context Aware) */}
                     <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-black text-slate-900">Payment Breakdown</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{viewMode === 'month' ? 'Current Month' : 'All Time'} Distribution</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {metrics.paymentData.map((method, idx) => (
                                <div key={method.name} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{method.name}</p>
                                    <p className="text-lg font-black text-slate-900 mb-1">{formatCurrency(method.value)}</p>
                                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full" 
                                            style={{ 
                                                width: `${method.percentage}%`,
                                                backgroundColor: PAYMENT_COLORS[method.colorKey as keyof typeof PAYMENT_COLORS] || '#94a3b8'
                                            }} 
                                        />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1">{method.percentage.toFixed(0)}%</p>
                                </div>
                            ))}
                        </div>
                     </div>
                 </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-8">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-900">Recent Activity</h3>
                    <Link to="/expenses" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View Full Ledger</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                             <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Card/Account</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Description</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</th>
                             </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {expenses.slice(0, 10).map(exp => {
                                const account = accounts.find(a => a.id === exp.accountId);
                                return (
                                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-bold text-slate-700 uppercase">
                                            {new Date(exp.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                         <div className="flex items-center gap-2">
                                            <span className="p-1 rounded bg-slate-100 text-slate-500">
                                                {exp.paymentMethod === 'upi' ? <ICONS.Account className="w-3 h-3"/> : exp.paymentMethod === 'credit' ? <ICONS.Cards className="w-3 h-3"/> : <ICONS.Expense className="w-3 h-3"/>}
                                            </span>
                                            <span className="text-xs font-bold text-slate-700">
                                                {account ? (account.nickname || account.name) : (exp.paymentMethod.toUpperCase())}
                                            </span>
                                         </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-600">
                                            {categories.find(c => c.id === exp.categoryId)?.name || 'Misc'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{exp.description || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                         <span className="text-sm font-black text-slate-900">
                                            {formatCurrency(exp.amount)}
                                         </span>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ExpenseOverview;
