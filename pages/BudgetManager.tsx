import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Category, Expense } from '../types';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/currency';

const BudgetManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { addToast: showToast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [cats, exps] = await Promise.all([
      storage.getCategories(),
      storage.getExpenses()
    ]);
    setCategories(cats);
    setExpenses(exps);
    setLoading(false);
  };

  const handleBudgetChange = (id: string, val: string) => {
    if (val === '') {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, budget: 0 } : c));
        return;
    }
    const num = parseInt(val.replace(/[^0-9]/g, ''));
    if (!isNaN(num)) {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, budget: num } : c));
    }
  };

  const handleFrequencyChange = (id: string, freq: 'monthly' | 'yearly') => {
      setCategories(prev => prev.map(c => c.id === id ? { ...c, budgetFrequency: freq } : c));
  };

  const saveBudget = async (category: Category) => {
    setSaving(category.id);
    try {
      await storage.saveCategory(category);
      showToast(`Budget settings saved for ${category.name}`, 'success');
    } catch (error) {
      showToast('Failed to save budget settings', 'error');
    } finally {
      setSaving(null);
    }
  };

  const getSpent = (catId: string, frequency: 'monthly' | 'yearly' = 'monthly') => {
    const now = new Date();
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        if (frequency === 'monthly') {
            return e.categoryId === catId && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else {
            return e.categoryId === catId && d.getFullYear() === now.getFullYear();
        }
      })
      .reduce((sum, e) => sum + e.amount, 0);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8"><div className="h-10 w-48 skeleton rounded mb-8"></div><div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-xl"></div>)}</div></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">Budget Planner</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">Master your spending limits</p>
        </div>
        <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 w-full focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300"
            />
        </div>
      </div>

      <div className="card-professional bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="py-4 pl-6 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/4">Category</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/3">Usage & Status</th>
                        <th className="py-4 px-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Spent / Budget</th>
                        <th className="py-4 pr-6 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 w-1/4">Limit & Frequency</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredCategories.map(cat => {
                        const frequency = cat.budgetFrequency || 'monthly';
                        const spent = getSpent(cat.id, frequency);
                        const budget = cat.budget || 0;
                        const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
                        const isOver = budget > 0 && spent > budget;
                        const statusColor = budget === 0 ? 'bg-slate-100 text-slate-500' : (isOver ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600');
                        
                        return (
                            <tr key={cat.id} className="group hover:bg-slate-50/60 transition-colors">
                                <td className="py-5 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${isOver ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                            {cat.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{cat.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cat.type || 'General'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-5 px-4 align-middle">
                                    <div className="w-full max-w-xs">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${statusColor}`}>
                                                    {budget > 0 ? (isOver ? 'Over' : 'On Track') : '-'}
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{frequency}</span>
                                                {cat.rolloverEnabled && (
                                                    <span className="text-[9px] font-black uppercase text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded" title="Unused budget carries forward">Rollover</span>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">{budget > 0 ? `${Math.round(percentage)}%` : ''}</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-700 ease-out ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-1">
                                            {/* Smart Forecast (if budget set) */}
                                            {budget > 0 && frequency === 'monthly' && (
                                                <div className="flex items-center gap-1.5 text-[9px]">
                                                    <span className="text-slate-400 font-bold uppercase">Forecast:</span>
                                                    <span className={`font-black ${
                                                        (spent / new Date().getDate() * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()) > budget 
                                                        ? 'text-rose-600' 
                                                        : 'text-emerald-600'
                                                    }`}>
                                                        {formatCurrency(spent / (new Date().getDate() || 1) * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            {/* Avg / Suggestion (Always visible now) */}
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] text-slate-400 font-bold uppercase">Avg/Mo:</span>
                                                <button 
                                                    onClick={() => handleBudgetChange(cat.id, Math.round(
                                                            expenses
                                                                .filter(e => e.categoryId === cat.id)
                                                                .reduce((sum, e) => sum + e.amount, 0) 
                                                            / (Math.max(1, new Set(expenses.filter(e => e.categoryId === cat.id).map(e => e.date.substring(0, 7))).size))
                                                    ).toString())}
                                                    className="text-[9px] font-black text-slate-500 hover:text-indigo-600 hover:underline decoration-indigo-200"
                                                    title="Click to set as budget"
                                                >
                                                    {formatCurrency(
                                                        Math.round(
                                                            expenses
                                                                .filter(e => e.categoryId === cat.id)
                                                                .reduce((sum, e) => sum + e.amount, 0) 
                                                            / (Math.max(1, new Set(expenses.filter(e => e.categoryId === cat.id).map(e => e.date.substring(0, 7))).size))
                                                        )
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-5 px-4 text-right">
                                    <p className={`font-bold text-sm ${isOver ? 'text-red-600' : 'text-slate-800'}`}>{formatCurrency(spent)}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                                        of {budget > 0 ? formatCurrency(budget) : 'Unset'}
                                    </p>
                                </td>
                                <td className="py-5 pr-6">
                                    <div className="flex items-center justify-end gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                                <button
                                                    onClick={() => handleFrequencyChange(cat.id, 'monthly')}
                                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                                                        frequency === 'monthly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                >
                                                    Month
                                                </button>
                                                <button
                                                    onClick={() => handleFrequencyChange(cat.id, 'yearly')}
                                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                                                        frequency === 'yearly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                    }`}
                                                >
                                                    Year
                                                </button>
                                            </div>
                                            
                                            <button
                                                onClick={async () => {
                                                    const updated = { ...cat, rolloverEnabled: !cat.rolloverEnabled };
                                                    setCategories(prev => prev.map(c => c.id === cat.id ? updated : c));
                                                    await saveBudget(updated);
                                                }}
                                                className={`p-2 rounded-lg transition-all ${
                                                    cat.rolloverEnabled 
                                                    ? 'bg-indigo-100 text-indigo-600' 
                                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                }`}
                                                title={cat.rolloverEnabled ? "Rollover Active: Unused budget carries forward" : "Enable Rollover"}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            </button>
                                        </div>

                                        <div className="relative w-28">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px]">₹</span>
                                            <input 
                                                type="text" 
                                                value={cat.budget || ''} 
                                                onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                                                className="w-full pl-5 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition-all outline-none text-right"
                                                placeholder="0"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => saveBudget(cat)}
                                            disabled={saving === cat.id}
                                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                                            title="Save Limit"
                                        >
                                            {saving === cat.id ? (
                                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default BudgetManager;
