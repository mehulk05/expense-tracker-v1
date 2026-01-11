
import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, LineChart, Line 
} from 'recharts';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { Expense, Account, Category } from '../types';
import { getSpendingInsights, parseNaturalLanguageExpense } from '../services/gemini';
import { ICONS } from '../constants';

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="h-12 w-full skeleton rounded-xl"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-28 skeleton rounded-xl"></div>)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 h-72 skeleton rounded-xl"></div>
      <div className="h-72 skeleton rounded-xl"></div>
    </div>
  </div>
);

const OnboardingJourney: React.FC<{ hasAccounts: boolean; hasCategories: boolean }> = ({ hasAccounts, hasCategories }) => (
  <div className="card-professional p-10 md:p-16 animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto mt-8">
    <div className="text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 mx-auto mb-6 border border-slate-100">
        <ICONS.Dashboard className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Initialize Your Workspace</h2>
      <p className="text-slate-500 mb-10 max-w-md mx-auto">Set up your financial framework to unlock AI insights and tracking.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <Link to="/accounts" className={`group p-6 rounded-xl border transition-all ${hasAccounts ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-400'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${hasAccounts ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <ICONS.Account className="w-5 h-5" />
            </div>
            {hasAccounts && <span className="text-emerald-600 font-bold text-xs">READY</span>}
          </div>
          <h3 className="font-bold text-slate-900">1. Link Accounts</h3>
          <p className="text-xs text-slate-500 mt-1">Connect your cards and digital wallets.</p>
        </Link>

        <Link to="/categories" className={`group p-6 rounded-xl border transition-all ${hasCategories ? 'border-emerald-100 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-400'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${hasCategories ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              <ICONS.Category className="w-5 h-5" />
            </div>
            {hasCategories && <span className="text-emerald-600 font-bold text-xs">READY</span>}
          </div>
          <h3 className="font-bold text-slate-900">2. Setup Categories</h3>
          <p className="text-xs text-slate-500 mt-1">Organize transactions into segments.</p>
        </Link>
      </div>
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

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (dateRange === 'week') return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      if (dateRange === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return d.getFullYear() === now.getFullYear();
    });
  }, [expenses, dateRange]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

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
    return { date: dateStr.split('-').slice(2).join('/'), amount };
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
    } else {
      alert("AI interpretation failed. Please be more explicit.");
    }
    setParsingAi(false);
  };

  const handleQuickAdd = async (catName: string, sub: string) => {
    const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
    if (!cat || !accounts.length) return;
    const amountStr = prompt(`Add ${sub} amount:`);
    if (!amountStr || isNaN(Number(amountStr))) return;
    
    const newExp: Expense = {
      id: crypto.randomUUID(),
      amount: Number(amountStr),
      date: new Date().toISOString().split('T')[0],
      accountId: accounts[0].id,
      categoryId: cat.id,
      subCategory: sub,
      description: `Quick Add: ${sub}`
    };
    await storage.saveExpense(newExp);
    setExpenses([newExp, ...expenses]);
  };

  // Fix: Added missing handleGetInsights function to fetch insights from Gemini API
  const handleGetInsights = async () => {
    if (loadingInsights || expenses.length === 0) return;
    setLoadingInsights(true);
    try {
      const result = await getSpendingInsights(expenses, accounts, categories);
      setInsights(result);
    } catch (error) {
      console.error("Failed to fetch insights:", error);
      setInsights("Unable to generate insights at this moment.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const COLORS = ['#1e293b', '#64748b', '#94a3b8', '#cbd5e1', '#475569', '#334155'];

  if (loading) return <DashboardSkeleton />;
  if (accounts.length === 0 || categories.length === 0) {
    return <OnboardingJourney hasAccounts={accounts.length > 0} hasCategories={categories.length > 0} />;
  }

  return (
    <div className="space-y-6">
      {/* AI Bar - Refined */}
      <section>
        <form onSubmit={handleAiSubmit} className="ai-input-bar relative flex items-center p-1.5">
          <div className="pl-4 pr-3 text-slate-400">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <input 
            type="text" 
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Type your expense: '₹400 for lunch using HDFC'..." 
            className="flex-1 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 text-sm font-medium py-2"
          />
          <button 
            type="submit"
            disabled={parsingAi}
            className="bg-slate-900 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all ml-2"
          >
            {parsingAi ? "Processing..." : "Log Entry"}
          </button>
        </form>
      </section>

      {/* Date Toggle - Refined */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/40">
          {(['week', 'month', 'year'] as const).map(range => (
            <button 
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${dateRange === range ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {range}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold">
           <span>STREAK: 7 DAYS</span>
        </div>
      </div>

      {/* Key Metrics - Smaller */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-professional p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expenditure</p>
          <p className="text-2xl font-extrabold text-slate-900">₹{totalSpent.toLocaleString()}</p>
        </div>
        <div className="card-professional p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Logs</p>
          <p className="text-2xl font-extrabold text-slate-900">{filteredExpenses.length}</p>
        </div>
        <div className="card-professional p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Daily Average</p>
          <p className="text-2xl font-extrabold text-slate-900">₹{(totalSpent / (filteredExpenses.length || 1)).toFixed(0)}</p>
        </div>
        <div className="card-professional p-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Accounts</p>
          <p className="text-2xl font-extrabold text-slate-900">{accounts.length}</p>
        </div>
      </div>

      {/* Main Grid - Refined */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-professional p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-6">Velocity Trend</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: 'none'}}
                    itemStyle={{fontSize: '12px', fontWeight: '600'}}
                  />
                  <Line type="stepAfter" dataKey="amount" stroke="#0f172a" strokeWidth={2} dot={false} activeDot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-professional p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-6">Allocation Summary</h3>
            <div className="space-y-4">
              {categoryData.slice(0, 4).map((item) => {
                const percentage = Math.min((item.value / totalSpent) * 100, 100);
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-700">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-500">₹{item.value.toLocaleString()}</p>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-slate-900 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-professional p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-6">Recent Records</h3>
            <div className="space-y-3">
              {expenses.slice(0, 5).map(exp => (
                <div key={exp.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 font-bold text-[10px]">
                    {categories.find(c => c.id === exp.categoryId)?.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{exp.description || exp.subCategory}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{new Date(exp.date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900">₹{exp.amount}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card-professional p-6">
             <h3 className="text-sm font-bold text-slate-900 mb-6">Distribution</h3>
             <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
      
      {/* AI Insights - Refined */}
      <div className="bg-slate-900 rounded-xl p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-extrabold mb-1 tracking-tight">Financial Intelligence</h2>
            <p className="text-slate-400 text-xs">AI-driven analysis of your spending behaviors.</p>
          </div>
          <button 
            onClick={handleGetInsights}
            disabled={loadingInsights || expenses.length === 0}
            className="btn-secondary py-1.5 px-4 bg-white text-slate-900 border-none font-extrabold text-[10px] uppercase tracking-wider"
          >
            {loadingInsights ? "Analyzing..." : "Refresh Intelligence"}
          </button>
        </div>
        {insights && (
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <p className="text-sm leading-relaxed text-slate-300 font-medium whitespace-pre-wrap">{insights}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
