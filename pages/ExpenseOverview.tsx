import React, { useState, useEffect, useMemo } from 'react';
import { ICONS } from '../constants';
import { storage } from '../services/storage';
import { Expense, Category, Account } from '../types';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import { 
    ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell, 
    PieChart, Pie, Legend, AreaChart, Area
} from 'recharts';

type TimeRange = 'this-month' | 'last-month' | 'this-year' | 'all-time';

const ExpenseOverview: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [timeRange, setTimeRange] = useState<TimeRange>('this-month');

    // Load Data
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

    // Core Analytics Logic
    const analytics = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        let filteredExpenses: Expense[] = [];
        let previousExpenses: Expense[] = []; // For comparison
        let rangeLabel = '';
        let daysInPeriod = 1;

        // 1. Filter Logic
        if (timeRange === 'this-month') {
            filteredExpenses = expenses.filter(e => {
                const d = new Date(e.date);
                return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
            });
            previousExpenses = expenses.filter(e => {
                const d = new Date(e.date);
                // Handle Jan -> Dec previous year
                if (currentMonth === 0) return d.getFullYear() === currentYear - 1 && d.getMonth() === 11;
                return d.getFullYear() === currentYear && d.getMonth() === currentMonth - 1;
            });
            rangeLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
            daysInPeriod = Math.min(new Date(currentYear, currentMonth + 1, 0).getDate(), now.getDate());
        
        } else if (timeRange === 'last-month') {
            const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
            const lmYear = lastMonthDate.getFullYear();
            const lmMonth = lastMonthDate.getMonth();
            
            filteredExpenses = expenses.filter(e => {
                const d = new Date(e.date);
                return d.getFullYear() === lmYear && d.getMonth() === lmMonth;
            });
            previousExpenses = expenses.filter(e => {
                const d = new Date(e.date);
                const prevPrevDate = new Date(lmYear, lmMonth - 1, 1);
                return d.getFullYear() === prevPrevDate.getFullYear() && d.getMonth() === prevPrevDate.getMonth();
            });
            rangeLabel = lastMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
            daysInPeriod = new Date(lmYear, lmMonth + 1, 0).getDate();

        } else if (timeRange === 'this-year') {
            filteredExpenses = expenses.filter(e => new Date(e.date).getFullYear() === currentYear);
            previousExpenses = expenses.filter(e => new Date(e.date).getFullYear() === currentYear - 1);
            rangeLabel = `${currentYear} Analytics`;
            daysInPeriod = (now.getTime() - new Date(currentYear, 0, 1).getTime()) / (1000 * 3600 * 24);

        } else { // all-time
            filteredExpenses = expenses;
            previousExpenses = []; // No comparison for all time
            rangeLabel = 'Lifetime Overview';
            daysInPeriod = 1; // Not relevant for daily avg usually
        }

        // 2. Metrics Calculation
        const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const prevSpent = previousExpenses.reduce((sum, e) => sum + e.amount, 0);
        
        const changePercent = prevSpent > 0 ? ((totalSpent - prevSpent) / prevSpent) * 100 : 0;
        
        const avgTransaction = filteredExpenses.length > 0 ? totalSpent / filteredExpenses.length : 0;
        
        // Daily/Monthly Avg
        let avgPerUnit = 0;
        let avgLabel = '';
        if (timeRange.includes('month')) {
            avgPerUnit = totalSpent / daysInPeriod;
            avgLabel = 'per day';
        } else if (timeRange === 'this-year') {
            avgPerUnit = totalSpent / (currentMonth + 1);
            avgLabel = 'per month';
        } else {
            // Lifetime avg per month (approx)
            const firstDate = expenses.length > 0 ? new Date(Math.min(...expenses.map(e => new Date(e.date).getTime()))) : new Date();
            const monthsDiff = (now.getFullYear() - firstDate.getFullYear()) * 12 + (now.getMonth() - firstDate.getMonth()) + 1;
            avgPerUnit = totalSpent / Math.max(1, monthsDiff);
            avgLabel = 'per month';
        }

        // --- BUDGET LOGIC ---
        // Calculate Total Budget based on Time Range
        const categoryBudgets = categories.map(c => {
            let limit = 0;
            if (c.budget && c.budget > 0) {
                if (timeRange.includes('month')) {
                    limit = c.budgetFrequency === 'yearly' ? c.budget / 12 : c.budget;
                } else if (timeRange === 'this-year') {
                    limit = c.budgetFrequency === 'yearly' ? c.budget : c.budget * 12;
                } else {
                    limit = 0; 
                }
            }
            return { id: c.id, name: c.name, limit };
        });

        // Budget Calculations
        const totalBudget = categoryBudgets.reduce((sum, cb) => sum + cb.limit, 0);
        const remainingBudget = totalBudget - totalSpent;
        const budgetHealth = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

        // Projections & Time
        let daysLeft = 0;
        let projectedTotal = 0;
        if (timeRange === 'this-month') {
             const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
             daysLeft = daysInMonth - now.getDate();
             const daysPassed = Math.max(1, now.getDate());
             projectedTotal = (totalSpent / daysPassed) * daysInMonth;
        } else if (timeRange === 'this-year') {
             const start = new Date(currentYear, 0, 1);
             const diff = now.getTime() - start.getTime();
             const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
             const daysInYear = 365 + (currentYear % 4 === 0 ? 1 : 0);
             daysLeft = daysInYear - dayOfYear;
             projectedTotal = (totalSpent / Math.max(1, dayOfYear)) * daysInYear;
        }

        // Category Budget Performance & Status Logic
        const categoryPerf = categories.map(c => {
            const spent = filteredExpenses
                .filter(e => e.categoryId === c.id)
                .reduce((sum, e) => sum + e.amount, 0);
            const budget = categoryBudgets.find(cb => cb.id === c.id)?.limit || 0;
            const percent = budget > 0 ? (spent / budget) * 100 : 0;
            
            // Status Thresholds
            let status: 'safe' | 'warning' | 'alert' | 'critical' | 'no-budget' = 'no-budget';
            if (budget > 0) {
                if (percent > 100) status = 'critical';       // > 100% (Red)
                else if (percent >= 90) status = 'alert';     // 90-100% (Orange)
                else if (percent >= 70) status = 'warning';   // 70-90% (Yellow)
                else status = 'safe';                         // < 70% (Green)
            }

            return {
                ...c,
                spent,
                budget,
                status,
                percent,
                remaining: Math.max(0, budget - spent)
            };
        }).sort((a,b) => b.spent - a.spent);

        // --- ALERTS GENERATION ---
        const alerts: { type: 'critical' | 'warning' | 'info', text: string, categoryId?: string }[] = [];
        
        // Critical: Over Budget Categories
        const overBudgetCats = categoryPerf.filter(c => c.status === 'critical');
        if (overBudgetCats.length > 0) {
            alerts.push({
                type: 'critical',
                text: `${overBudgetCats.length} categories exceeded budget`
            });
            overBudgetCats.slice(0, 3).forEach(c => {
                alerts.push({
                    type: 'critical',
                    text: `${c.name}: Over by ${formatCurrency(c.spent - c.budget)}`
                });
            });
        }
        
        if (totalBudget > 0 && totalSpent > totalBudget) {
            alerts.unshift({
                type: 'critical',
                text: `Total budget exceeded by ${formatCurrency(totalSpent - totalBudget)}`
            });
        }

        if (timeRange === 'this-month' && totalBudget > 0 && projectedTotal > totalBudget && totalSpent <= totalBudget) {
            alerts.push({
                type: 'warning',
                text: `Projected to exceed budget by ${formatCurrency(projectedTotal - totalBudget)}`
            });
        }

        // --- RESTORED ANALYTICS LOGIC ---

        // 2. Trend Data (Budget Aware)
        let trendData: any[] = [];
         if (timeRange.includes('month')) {
            const daysInM = timeRange === 'this-month' ? new Date(currentYear, currentMonth + 1, 0).getDate() : new Date(currentYear, currentMonth, 0).getDate();
            const dailyBudget = totalBudget / daysInM;
            const daysMap = new Map<number, number>();
            filteredExpenses.forEach(e => {
                const d = new Date(e.date).getDate();
                daysMap.set(d, (daysMap.get(d) || 0) + e.amount);
            });
            let cumSum = 0;
            let cumBudget = 0;
            for (let i = 1; i <= daysInM; i++) {
                const val = daysMap.get(i) || 0;
                cumSum += val;
                cumBudget += dailyBudget;
                trendData.push({ 
                    name: `${i}`, 
                    value: val, 
                    cumulative: cumSum,
                    budgetLine: dailyBudget 
                });
            }
        } else {
            // Monthly Trend for Year
             const monthMap = new Map<number, number>();
                filteredExpenses.forEach(e => {
                    const m = new Date(e.date).getMonth();
                    monthMap.set(m, (monthMap.get(m) || 0) + e.amount);
                });
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const monthlyExactBudget = totalBudget / 12; // Approximation
                trendData = months.map((m, i) => ({ 
                    name: m, 
                    value: monthMap.get(i) || 0,
                    budgetLine: monthlyExactBudget
                }));
        }

        // 3. Payment Breakdown Extended (Always show all types)
        const paymentMap = new Map<string, {amount: number, count: number}>();
        filteredExpenses.forEach(e => {
            const type = e.paymentMethod || 'other';
            const curr = paymentMap.get(type) || {amount: 0, count: 0};
            curr.amount += e.amount;
            curr.count += 1;
            paymentMap.set(type, curr);
        });

        const ALL_METHODS = ['upi', 'credit', 'debit', 'cash', 'other'];
        const paymentData = ALL_METHODS.map(key => {
            const val = paymentMap.get(key) || { amount: 0, count: 0 };
            return {
                name: key === 'credit' ? 'Credit Card' : key === 'upi' ? 'UPI' : key.charAt(0).toUpperCase() + key.slice(1),
                value: val.amount,
                count: val.count,
                avg: val.count > 0 ? val.amount / val.count : 0,
                percent: totalSpent > 0 ? (val.amount / totalSpent) * 100 : 0,
                rawKey: key
            };
        });

        // 4. Smart Insights
        const insights: { type: 'warning' | 'success' | 'info' | 'neutral' | 'critical' | 'alert' | 'safe', text: string }[] = [];
        // Insight 1: Spending Spike
        if (prevSpent > 0 && changePercent > 15) insights.push({ type: 'warning', text: `Spending is ${changePercent.toFixed(0)}% higher than previous period.` });
        if (prevSpent > 0 && changePercent < -15) insights.push({ type: 'success', text: `Spending is ${Math.abs(changePercent).toFixed(0)}% lower than previous period.` });
        
        // Insight 2: Largest Expense
        const sortedByAmt = [...filteredExpenses].sort((a,b) => b.amount - a.amount);
        if (sortedByAmt.length > 0) {
            insights.push({ type: 'info', text: `Largest spend: ${sortedByAmt[0].description} (${formatCurrency(sortedByAmt[0].amount)})` });
        }
        
        // Insight 3: Most active category
        const catCounts = new Map<string, number>();
        filteredExpenses.forEach(e => catCounts.set(e.categoryId, (catCounts.get(e.categoryId) || 0) + 1));
        let maxCat = ''; let maxCount = 0;
        catCounts.forEach((v, k) => { if(v > maxCount) { maxCount = v; maxCat = k; } });
        const maxCatName = categories.find(c => c.id === maxCat)?.name;
        if (maxCatName) insights.push({ type: 'neutral', text: `Most frequent category: ${maxCatName} (${maxCount} txns)` });

        // 5. Top Vendors
        const vendorMap = new Map<string, number>();
        filteredExpenses.forEach(e => {
            const v = (e.description || 'Unknown').trim();
            vendorMap.set(v, (vendorMap.get(v) || 0) + e.amount);
        });
        const topVendors = Array.from(vendorMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value)
            .slice(0, 5);

        return {
            totalSpent,
            prevSpent,
            changePercent,
            filteredExpenses,
            rangeLabel,
            trendData,
            paymentData,
            insights: [...insights, ...alerts], // Merge insights and alerts
            topVendors,
            categoryStats: categoryPerf, // Use the budget-aware perf list
            avgTransaction,
            avgPerUnit,
            avgLabel,
            totalBudget,
            budgetHealth,
            remainingBudget,
            daysLeft,
            projectedTotal
        };

    }, [expenses, categories, timeRange]);

    // UI Helpers
    const PAYMENT_COLORS: Record<string, string> = { 'cash': '#22c55e', 'upi': '#f59e0b', 'credit': '#3b82f6', 'debit': '#8b5cf6', 'other': '#9ca3af' };
    
    // Status Badge Helper
    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            'critical': 'bg-red-100 text-red-700 border-red-200',
            'alert': 'bg-orange-100 text-orange-700 border-orange-200',
            'warning': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'safe': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'no-budget': 'bg-gray-100 text-gray-500 border-gray-200'
        }[status] || 'bg-gray-100 text-gray-500';
        
        const label = { 'critical': 'Over', 'alert': 'Alert', 'warning': 'Warning', 'safe': 'Good', 'no-budget': 'None' }[status];
        
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles}`}>
                {label}
            </span>
        );
    };

    if (loading) return <div className="p-8"><div className="h-10 w-48 skeleton rounded mb-8"></div></div>;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-12">
            {/* Header with Time Control */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="text-xl font-bold text-gray-900 tracking-tight">Overview</h1>
                   <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mt-1">{analytics.rangeLabel}</p>
                </div>
                
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex overflow-x-auto text-[10px] font-bold no-scrollbar">
                    {(['this-month', 'last-month', 'this-year', 'all-time'] as const).map(range => (
                        <button 
                            key={range}
                            onClick={() => setTimeRange(range)} 
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${timeRange === range ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {range.replace('-', ' ').toUpperCase()}
                        </button>
                    ))}
                    <Link to="/expenses" className="px-4 py-2 ml-2 border-l border-gray-100 text-blue-600 hover:text-blue-700">
                        LEDGER
                    </Link>
                </div>
            </div>

            {/* BUDGET DASHBOARD (Top Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Spent */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                     <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Total Spent</p>
                     <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(analytics.totalSpent)}</p>
                     {timeRange !== 'all-time' && (
                        <div className="flex items-center gap-1.5 mt-2">
                             <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${analytics.changePercent > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                 {analytics.changePercent > 0 ? '↑' : '↓'} {Math.abs(analytics.changePercent).toFixed(0)}%
                             </div>
                             <span className="text-[10px] text-gray-400 font-semibold">vs prev</span>
                        </div>
                     )}
                </div>

                {/* 2. Budget Health */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                     <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Budget Health</p>
                        <ICONS.Chart className={`w-4 h-4 ${analytics.budgetHealth > 100 ? 'text-red-500' : analytics.budgetHealth > 90 ? 'text-orange-500' : 'text-emerald-500'}`} />
                     </div>
                     {analytics.totalBudget > 0 ? (
                        <>
                            <p className="text-2xl font-bold text-gray-900 mb-1">{analytics.budgetHealth.toFixed(0)}<span className="text-sm text-gray-400">%</span></p>
                            <p className="text-[10px] font-bold text-gray-400 mb-2">of {formatCurrency(analytics.totalBudget)} limit</p>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        analytics.budgetHealth > 100 ? 'bg-red-500' : 
                                        analytics.budgetHealth > 90 ? 'bg-orange-500' : 
                                        analytics.budgetHealth > 70 ? 'bg-yellow-500' : 
                                        'bg-emerald-500'
                                    }`}
                                    style={{ width: `${Math.min(analytics.budgetHealth, 100)}%` }}
                                />
                            </div>
                        </>
                     ) : (
                        <p className="text-sm font-bold text-gray-400 mt-2 italic">No budget set</p>
                     )}
                </div>

                {/* 3. Remaining */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                     <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Remaining</p>
                     {analytics.totalBudget > 0 ? (
                        <>
                            <p className={`text-2xl font-bold mb-1 ${analytics.remainingBudget < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {formatCurrency(analytics.remainingBudget)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${analytics.daysLeft < 5 ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                    {analytics.daysLeft} days left
                                </span>
                                {analytics.projectedTotal > analytics.totalBudget && analytics.remainingBudget > 0 && (
                                     <span className="text-[10px] font-bold text-orange-500" title={`Projected: ${formatCurrency(analytics.projectedTotal)}`}>
                                        ⚠️ Projected Over
                                     </span>
                                )}
                            </div>
                        </>
                     ) : (
                         <div className="flex items-center gap-2 mt-4 text-gray-400">
                             <ICONS.Info className="w-4 h-4"/>
                             <span className="text-xs font-bold">Set budget to track</span>
                         </div>
                     )}
                </div>

                 {/* 4. Top Spending */}
                 <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                     <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Top Spend</p>
                     {analytics.topVendors.length > 0 ? (
                        <div>
                            <p className="text-lg font-bold text-gray-900 truncate" title={analytics.topVendors[0].name}>{analytics.topVendors[0].name}</p>
                            <p className="text-xs font-bold text-blue-600">{formatCurrency(analytics.topVendors[0].value)}</p>
                            <p className="text-[10px] text-gray-400 mt-1 font-bold">{((analytics.topVendors[0].value / analytics.totalSpent) * 100).toFixed(0)}% of total</p>
                        </div>
                     ) : (
                        <p className="text-gray-300 font-bold text-sm">No Data</p>
                     )}
                </div>
            </div>
            
            {/* SPENDING TREND CHART */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Spending Trends</h2>
                        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Actual vs Budget</p>
                    </div>
                </div>
                <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                             <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#6b7280', fontSize: 10, fontWeight: 600}}
                                dy={10}
                                interval={'preserveStartEnd'}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9ca3af', fontSize: 10}}
                                tickFormatter={(val) => `₹${val/1000}k`}
                            />
                            <Tooltip 
                                cursor={{stroke: '#2563eb', strokeWidth: 1}}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                formatter={(value: number, name: string) => [formatCurrency(value), name === 'budgetLine' ? 'Budget' : 'Spent']}
                            />
                            <Legend iconType="circle" />
                            <Area type="monotone" dataKey="value" name="Spent" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            {/* Budget Line if available */}
                            {analytics.totalBudget > 0 && (
                                <Area type="monotone" dataKey="budgetLine" name="Budget" stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={2} fill="none" />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CATEGORY BUDGET BREAKDOWN */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Budget vs Actual</h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{analytics.categoryStats.length} Categories</span>
                    </div>
                    
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {analytics.categoryStats.map((cat, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                         <div className={`p-2 rounded-lg text-gray-600 ${
                                             cat.status === 'critical' ? 'bg-red-50' : 
                                             cat.status === 'alert' ? 'bg-orange-50' :
                                             'bg-gray-50'
                                         }`}>
                                             <ICONS.Category className="w-4 h-4" />
                                         </div>
                                         <div>
                                            <span className="text-sm font-bold text-gray-900 block">{cat.name}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                {cat.budget > 0 ? `${cat.percent.toFixed(0)}% Used` : 'No Limit'}
                                            </span>
                                         </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <StatusBadge status={cat.status} />
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-gray-900">{formatCurrency(cat.spent)}</span>
                                            <span className="text-[10px] text-gray-400 font-bold ml-1">
                                                {cat.budget > 0 ? `/ ${formatCurrency(cat.budget)}` : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {cat.budget > 0 ? (
                                    <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                                                cat.status === 'critical' ? 'bg-red-500' : 
                                                cat.status === 'alert' ? 'bg-orange-500' : 
                                                cat.status === 'warning' ? 'bg-yellow-500' : 
                                                'bg-emerald-500'
                                            }`}
                                            style={{ width: `${Math.min(cat.percent, 100)}%` }}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                                        {/* Neutral bar for no-budget items if they have spending, or just empty */}
                                         <div 
                                            className="absolute left-0 top-0 h-full rounded-full bg-gray-200"
                                            style={{ width: analytics.totalSpent > 0 ? `${(cat.spent / analytics.totalSpent) * 100}%` : '0%' }}
                                        />
                                    </div>
                                )}
                                
                                <div className="flex justify-between mt-1 text-[10px] font-bold text-gray-400">
                                    {cat.budget > 0 ? (
                                        <>
                                            <span>{cat.remaining < 0 ? 'Overspent' : 'Remaining'}</span>
                                            <span className={cat.remaining < 0 ? 'text-red-500' : 'text-emerald-600'}>
                                                {cat.remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(cat.remaining))}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Contribution</span>
                                            <span>{analytics.totalSpent > 0 ? ((cat.spent / analytics.totalSpent) * 100).toFixed(0) : 0}% of Total</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ALERTS & INSIGHTS GRID */}
                <div className="space-y-8">
                     {/* Alerts Panel */}
                     {analytics.insights.length > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                Insights & Alerts
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{analytics.insights.length}</span>
                            </h2>
                            <div className="space-y-3">
                                {analytics.insights.slice(0, 5).map((insight, idx) => {
                                    const isAlert = ['critical', 'warning', 'alert'].includes(insight.type);
                                    return (
                                        <div key={idx} className={`p-3 rounded-lg flex gap-3 ${
                                            insight.type === 'critical' ? 'bg-red-50 text-red-900' : 
                                            insight.type === 'warning' || insight.type === 'alert' ? 'bg-orange-50 text-orange-900' : 
                                            'bg-blue-50 text-blue-900'
                                        }`}>
                                            <div className={`shrink-0 pt-0.5 ${
                                                insight.type === 'critical' ? 'text-red-500' : 
                                                insight.type === 'warning' || insight.type === 'alert' ? 'text-orange-500' : 
                                                'text-blue-500'
                                            }`}>
                                                {isAlert ? <ICONS.Alert className="w-4 h-4"/> : <ICONS.Lightbulb className="w-4 h-4"/>}
                                            </div>
                                            <p className="text-xs font-bold leading-snug">{insight.text}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                     )}

                     {/* Payment Analysis */}
                     <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Payment Analysis</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {analytics.paymentData.map((method, idx) => (
                                <div key={method.name} className="p-4 rounded-xl bg-gray-50 border border-gray-100 group hover:border-blue-100 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{method.name}</p>
                                        <p className="text-[10px] font-bold text-gray-300 group-hover:text-blue-400 transition-colors">{method.count} txns</p>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900 mb-1">{formatCurrency(method.value)}</p>
                                    <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden mt-2">
                                        <div 
                                            className="h-full rounded-full" 
                                            style={{ 
                                                width: `${method.percent}%`,
                                                backgroundColor: PAYMENT_COLORS[method.rawKey] || '#9ca3af'
                                            }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                 </div>

                 <div className="lg:col-span-2">
                     <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
                            <Link to="/expenses" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                View All
                            </Link>
                        </div>
                         <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                     <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Date</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Category</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-wider text-gray-400">Description</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Amount</th>
                                     </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {analytics.filteredExpenses.slice(0, 10).map(exp => (
                                        <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-[11px] font-bold text-gray-700 uppercase">
                                                    {new Date(exp.date).toLocaleDateString(undefined, {month:'short', day:'numeric', year: 'numeric'})}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-gray-600">
                                                    {categories.find(c => c.id === exp.categoryId)?.name || 'Misc'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-gray-500 font-medium truncate max-w-[200px]">{exp.description || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                 <span className="text-sm font-bold text-gray-900">
                                                    {formatCurrency(exp.amount)}
                                                 </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default ExpenseOverview;
