
import React, { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, BarChart, Bar, Legend
} from 'recharts';
import { Link } from 'react-router-dom';
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

  const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe', '#6366f1', '#4338ca', '#312e81'];

  if (loading) return <div className="space-y-6"><div className="h-12 skeleton rounded-xl"></div><div className="grid grid-cols-4 gap-4"><div className="h-28 skeleton rounded-xl"></div><div className="h-28 skeleton rounded-xl"></div><div className="h-28 skeleton rounded-xl"></div><div className="h-28 skeleton rounded-xl"></div></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* AI Log Bar */}
      <section>
        <form onSubmit={handleAiSubmit} className="ai-input-bar relative flex items-center p-1.5">
          <div className="pl-4 pr-3 text-indigo-500">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <input 
            type="text" 
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Log expense: '400 for lunch via HDFC'..." 
            className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 text-sm font-bold py-2.5"
          />
          <button 
            type="submit"
            disabled={parsingAi}
            className="btn-primary !py-2 !px-6 text-xs uppercase tracking-widest"
          >
            {parsingAi ? "Syncing..." : "Quick Log"}
          </button>
        </form>
      </section>

      {/* Date Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-lg w-fit border border-slate-200/40">
        {(['week', 'month', 'year'] as const).map(range => (
          <button 
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-6 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${dateRange === range ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Expenditure', val: `₹${totalSpent.toLocaleString()}`, color: 'text-slate-900' },
          { label: 'Personal', val: `₹${personalTotal.toLocaleString()}`, color: 'text-indigo-600' },
          { label: 'Other', val: `₹${otherTotal.toLocaleString()}`, color: 'text-slate-500' },
          { label: 'Logs', val: filteredExpenses.length, color: 'text-slate-900' }
        ].map((m, i) => (
          <div key={i} className="card-professional p-6 hover:border-indigo-100 transition-colors">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.label}</p>
            <p className={`text-2xl font-black ${m.color}`}>{m.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-professional p-8">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Allocation by Category</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '800'}} width={90} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'none', fontWeight: '800', fontSize: '10px'}}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-professional p-8">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Wallet Distribution</h3>
           <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={splitData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                    {splitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === 'Personal' ? '#4f46e5' : '#e2e8f0'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: '800', textTransform: 'uppercase'}} />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-8 pt-8 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Recent Activity</h4>
              <div className="space-y-4">
                {expenses.slice(0, 3).map(exp => (
                  <div key={exp.id} className="flex justify-between items-center group">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{exp.description || 'Spend Entry'}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{categories.find(c => c.id === exp.categoryId)?.name}</p>
                    </div>
                    <p className="text-xs font-black text-slate-900 ml-4">₹{exp.amount}</p>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
      
      {/* AI Insights */}
      <div className="bg-indigo-900 rounded-2xl p-10 text-white shadow-2xl shadow-indigo-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-xl font-black mb-1 tracking-tight">Financial Intelligence</h2>
            <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Powered by Gemini AI</p>
          </div>
          <button 
            onClick={handleGetInsights}
            disabled={loadingInsights || expenses.length === 0}
            className="bg-white text-indigo-900 px-6 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 disabled:opacity-30 transition-all shadow-lg"
          >
            {loadingInsights ? "Crunching Data..." : "Analyze Portfolio"}
          </button>
        </div>
        {insights ? (
          <div className="bg-white/10 border border-white/20 rounded-xl p-8 backdrop-blur-sm">
            <p className="text-sm leading-relaxed text-indigo-50 font-medium whitespace-pre-wrap">{insights}</p>
          </div>
        ) : (
          <div className="text-center py-10 opacity-30">
            <ICONS.Dashboard className="w-12 h-12 mx-auto mb-4" />
            <p className="text-xs font-bold uppercase tracking-widest">Analysis Pending</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
