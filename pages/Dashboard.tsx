
import React, { useState, useEffect, useMemo } from 'react';
// Added missing Link import from react-router-dom
import { Link } from 'react-router-dom';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, BarChart, Bar, Legend
} from 'recharts';
import { storage } from '../services/storage';
import { Expense, Account, Category } from '../types';
import { getSpendingInsights, parseNaturalLanguageExpense } from '../services/gemini';
import { ICONS } from '../constants';

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
  const personalTotal = filteredExpenses.filter(e => e.personalExpense ?? true).reduce((sum, e) => sum + e.amount, 0);
  const otherTotal = totalSpent - personalTotal;

  const categoryData = categories.map(cat => {
    const value = filteredExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, value };
  }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  const splitData = [
    { name: 'Personal', value: personalTotal },
    { name: 'Other', value: otherTotal }
  ].filter(d => d.value > 0);

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
        personalExpense: parsed.personalExpense ?? true,
        description: parsed.description || aiText
      } as Expense;
      await storage.saveExpense(newExp);
      setExpenses([newExp, ...expenses]);
      setAiText("");
    }
    setParsingAi(false);
  };

  const handleGetInsights = async () => {
    if (loadingInsights || expenses.length === 0) return;
    setLoadingInsights(true);
    try {
      const result = await getSpendingInsights(expenses, accounts, categories);
      setInsights(result);
    } catch (error) {
      setInsights("Unable to generate analysis.");
    } finally {
      setLoadingInsights(false);
    }
  };

  if (loading) return (
    <div className="space-y-8">
      <div className="h-16 skeleton rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 skeleton rounded-xl"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-80 skeleton rounded-xl"></div>
        <div className="h-80 skeleton rounded-xl"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* AI Log Section */}
      <section className="max-w-3xl mx-auto">
        <form onSubmit={handleAiSubmit} className="ai-input-bar relative flex items-center p-2">
          <div className="pl-4 pr-3 text-indigo-500">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <input 
            type="text" 
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Quick log: 'Coffee 150 from HDFC'" 
            className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 text-base font-bold py-3"
          />
          <button 
            type="submit"
            disabled={parsingAi || !aiText}
            className="btn-primary !px-6 !py-3 rounded-xl ml-2 shadow-indigo-200"
          >
            {parsingAi ? (
              <div className="flex items-center gap-2">
                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                 <span className="text-[10px] uppercase tracking-widest">Parsing</span>
              </div>
            ) : (
              <span className="text-[10px] uppercase tracking-widest">Add Entry</span>
            )}
          </button>
        </form>
      </section>

      {/* Date Toggle & Metrics */}
      <div className="space-y-6">
        <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit border border-slate-200">
          {(['week', 'month', 'year'] as const).map(range => (
            <button 
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-8 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${dateRange === range ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {range}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Expenditure', val: `₹${totalSpent.toLocaleString()}`, icon: ICONS.Expense, color: 'text-slate-900' },
            { label: 'Personal', val: `₹${personalTotal.toLocaleString()}`, icon: ICONS.Account, color: 'text-indigo-600' },
            { label: 'Other', val: `₹${otherTotal.toLocaleString()}`, icon: ICONS.Category, color: 'text-slate-500' },
            { label: 'Transactions', val: filteredExpenses.length, icon: ICONS.Dashboard, color: 'text-slate-900' }
          ].map((m, i) => (
            <div key={i} className="card-professional p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
                <m.icon className="w-4 h-4 text-slate-200" />
              </div>
              <p className={`text-2xl font-black ${m.color}`}>{m.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-professional p-8">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Spending Profile</h3>
            <span className="text-[10px] font-bold text-slate-300">Amount per category</span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: '800'}} width={100} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: '800', fontSize: '11px'}}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-professional p-8 flex flex-col">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-10 text-center">Wallet Split</h3>
           <div className="h-[220px] mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={splitData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                    {splitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Personal' ? '#4f46e5' : '#e2e8f0'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', paddingTop: '20px'}} />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-auto pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</h4>
                <Link to="/expenses" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">View All</Link>
              </div>
              <div className="space-y-5">
                {expenses.slice(0, 3).map(exp => (
                  <div key={exp.id} className="flex justify-between items-center group">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{exp.description || 'Spend Entry'}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">{categories.find(c => c.id === exp.categoryId)?.name}</p>
                    </div>
                    <p className="text-xs font-black text-slate-900 ml-4">₹{exp.amount}</p>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
      
      {/* AI Insights - Re-styled for light theme compatibility */}
      <div className="bg-indigo-600 rounded-3xl p-10 text-white shadow-2xl shadow-indigo-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Financial Intelligence</h2>
              <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">Analysis Engine active</p>
            </div>
          </div>
          <button 
            onClick={handleGetInsights}
            disabled={loadingInsights || expenses.length === 0}
            className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 disabled:opacity-30 transition-all shadow-xl"
          >
            {loadingInsights ? "Scanning Transactions..." : "Get AI Insights"}
          </button>
        </div>
        {insights ? (
          <div className="bg-white/10 border border-white/20 rounded-2xl p-8 backdrop-blur-lg">
            <p className="text-sm leading-relaxed text-indigo-50 font-semibold whitespace-pre-wrap">{insights}</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-dashed border-white/20 rounded-2xl py-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Insights available after review</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
