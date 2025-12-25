
import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line 
} from 'recharts';
import { storage } from '../services/storage';
import { Expense, Account, Category } from '../types';
import { getSpendingInsights, parseNaturalLanguageExpense } from '../services/gemini';
import { ICONS } from '../constants';

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="h-16 w-full skeleton rounded-2xl mb-8"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-32 skeleton rounded-2xl"></div>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-80 skeleton rounded-2xl"></div>
      <div className="h-80 skeleton rounded-2xl"></div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [aiText, setAiText] = useState("");
  const [parsingAi, setParsingAi] = useState(false);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  const loadData = async () => {
    const [exps, accs, cats] = await Promise.all([
      storage.getExpenses(),
      storage.getAccounts(),
      storage.getCategories()
    ]);
    setExpenses(exps);
    setAccounts(accs);
    setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (dateRange === 'week') return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      if (dateRange === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return d.getFullYear() === now.getFullYear();
    });
  }, [expenses, dateRange]);

  // Comparison Metrics
  const lastMonthTotal = useMemo(() => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
      })
      .reduce((s, e) => s + e.amount, 0);
  }, [expenses]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const diffPercent = lastMonthTotal > 0 ? ((totalSpent - lastMonthTotal) / lastMonthTotal * 100).toFixed(0) : null;

  // Streak Calculation (Days below daily average)
  const dailyAverage = totalSpent / (filteredExpenses.length || 1);
  const streak = useMemo(() => {
    let currentStreak = 0;
    const sorted = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const dayTotals: Record<string, number> = {};
    sorted.forEach(e => {
      dayTotals[e.date] = (dayTotals[e.date] || 0) + e.amount;
    });
    
    const dates = Object.keys(dayTotals).sort().reverse();
    for (const d of dates) {
      if (dayTotals[d] < 2000) currentStreak++; // 2000 is an arbitrary "good day" threshold
      else break;
    }
    return currentStreak;
  }, [expenses]);

  const categoryData = categories.map(cat => {
    const value = filteredExpenses
      .filter(e => e.categoryId === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, value, id: cat.id };
  }).filter(item => item.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const amount = expenses
      .filter(e => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);
    return { date: dateStr.split('-').slice(1).join('/'), amount };
  }).reverse();

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiText || parsingAi) return;
    setParsingAi(true);
    const parsed = await parseNaturalLanguageExpense(aiText, accounts, categories);
    if (parsed && parsed.amount && parsed.accountId && parsed.categoryId) {
      const newExp = {
        id: crypto.randomUUID(),
        amount: parsed.amount,
        date: parsed.date || new Date().toISOString().split('T')[0],
        accountId: parsed.accountId,
        categoryId: parsed.categoryId,
        subCategory: parsed.subCategory || 'Other',
        description: parsed.description || aiText
      } as Expense;
      await storage.saveExpense(newExp);
      setExpenses([newExp, ...expenses]);
      setAiText("");
      alert(`Added ₹${newExp.amount} to ${categories.find(c => c.id === newExp.categoryId)?.name}!`);
    } else {
      alert("AI couldn't fully understand. Please try being more specific (e.g., 'Spent 500 on dinner using HDFC')");
    }
    setParsingAi(false);
  };

  const handleQuickAdd = async (catName: string, sub: string) => {
    const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    if (!cat || !accounts.length) return;
    const amount = prompt(`Quick Add ${sub}: Enter amount`);
    if (!amount || isNaN(Number(amount))) return;
    
    const newExp: Expense = {
      id: crypto.randomUUID(),
      amount: Number(amount),
      date: new Date().toISOString().split('T')[0],
      accountId: accounts[0].id,
      categoryId: cat.id,
      subCategory: sub,
      description: `Quick added ${sub}`
    };
    await storage.saveExpense(newExp);
    setExpenses([newExp, ...expenses]);
  };

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    const text = await getSpendingInsights(expenses, accounts, categories);
    setInsights(text);
    setLoadingInsights(false);
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      {/* AI Search/Input Bar */}
      <section className="relative group">
        <form onSubmit={handleAiSubmit} className="relative">
          <input 
            type="text" 
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Tell SpendWise: 'Spent 1200 on Groceries using ICICI'..." 
            className="w-full py-5 pl-14 pr-32 ai-input rounded-2xl font-medium text-slate-700 shadow-sm"
          />
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <button 
            type="submit"
            disabled={parsingAi}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {parsingAi ? "Parsing..." : "Add AI"}
          </button>
        </form>
      </section>

      {/* Date Range Selector & Streak */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          {(['week', 'month', 'year'] as const).map(range => (
            <button 
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${dateRange === range ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100">
           <span className="text-xl">🔥</span>
           <span className="font-bold">{streak} Day Low-Spend Streak</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-medium text-slate-500">Total Spent</p>
            {diffPercent && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Number(diffPercent) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {Number(diffPercent) > 0 ? '↑' : '↓'} {Math.abs(Number(diffPercent))}%
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-slate-800">₹{totalSpent.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">vs Last Month</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Expenses Count</p>
          <p className="text-3xl font-bold text-slate-800">{filteredExpenses.length}</p>
          <div className="w-full bg-slate-100 h-1 rounded-full mt-4">
            <div className="bg-indigo-600 h-1 rounded-full" style={{width: '65%'}}></div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Daily Avg</p>
          <p className="text-3xl font-bold text-slate-800">₹{dailyAverage.toFixed(0)}</p>
          <p className="text-xs text-slate-400 mt-1 italic">Target: ₹2000/day</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Accounts</p>
          <p className="text-3xl font-bold text-slate-800">{accounts.length}</p>
          <div className="flex gap-1 mt-4">
            {accounts.slice(0, 3).map(a => <div key={a.id} className="w-6 h-4 bg-indigo-100 rounded"></div>)}
          </div>
        </div>
      </div>

      {/* Quick Add Widget */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Add</h3>
        <div className="flex gap-4 min-w-max pb-2">
          {[
            { label: 'Coffee', icon: '☕', cat: 'Personal' },
            { label: 'Fuel', icon: '⛽', cat: 'Travel' },
            { label: 'Grocery', icon: '🛒', cat: 'Personal' },
            { label: 'Subscription', icon: '📱', cat: 'Utilities' },
            { label: 'Rent', icon: '🏠', cat: 'Personal' }
          ].map(item => (
            <button 
              key={item.label}
              onClick={() => handleQuickAdd(item.cat, item.label)}
              className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all active:scale-95"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-semibold text-slate-700">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Spending Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: number) => [`₹${value}`, 'Spent']}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget Progress bars */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Monthly Budgets</h3>
            <div className="space-y-6">
              {categoryData.slice(0, 3).map((item, idx) => {
                const budget = 5000 * (idx + 1); // Mock budget
                const progress = Math.min((item.value / budget) * 100, 100);
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <p className="font-medium text-slate-700">{item.name}</p>
                      <p className="text-xs text-slate-500">₹{item.value.toLocaleString()} / ₹{budget.toLocaleString()}</p>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${progress > 90 ? 'bg-rose-500' : progress > 70 ? 'bg-amber-500' : 'bg-indigo-600'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {expenses.slice(0, 5).map(exp => (
                <div key={exp.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                    {categories.find(c => c.id === exp.categoryId)?.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{exp.description || exp.subCategory}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">₹{exp.amount}</p>
                </div>
              ))}
              {expenses.length === 0 && <p className="text-center text-slate-400 py-10">No expenses yet.</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribution</h3>
            <div className="h-[200px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full text-slate-300 italic">Empty</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Smart Analysis</h2>
            <p className="text-indigo-100 opacity-80">Anomaly detection and spending projections.</p>
          </div>
          <button 
            onClick={handleGetInsights}
            disabled={loadingInsights || expenses.length === 0}
            className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {loadingInsights ? "Scanning..." : "Sync with Gemini"}
          </button>
        </div>
        {insights && (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-md">
            <p className="whitespace-pre-wrap leading-relaxed text-indigo-50">{insights}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
