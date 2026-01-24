import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../services/storage';
import { Expense, Account, Category } from '../types';
import { ICONS } from '../constants';

const ExpenseManager: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPersonal, setIsPersonal] = useState(true);
  const [description, setDescription] = useState('');
  const [filter, setFilter] = useState<'all' | 'personal' | 'other'>('all');

  const loadData = async () => {
    setLoading(true);
    const [exps, accs, cats] = await Promise.all([
      storage.getExpenses(),
      storage.getAccounts(),
      storage.getCategories()
    ]);
    setExpenses(exps);
    setAccounts(accs);
    setCategories(cats);
    if (accs.length && !accountId) setAccountId(accs[0].id);
    if (cats.length && !categoryId) setCategoryId(cats[0].id);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId || !categoryId) return;
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      amount: parseFloat(amount),
      date,
      accountId,
      categoryId,
      personalExpense: isPersonal,
      description
    };
    await storage.saveExpense(newExpense);
    setExpenses([newExpense, ...expenses]);
    setAmount('');
    setDescription('');
    setIsPersonal(true);
    setShowAddForm(false);
  };

  const filteredExpenses = expenses.filter(exp => {
    if (filter === 'all') return true;
    const expIsPersonal = exp.personalExpense ?? true;
    return filter === 'personal' ? expIsPersonal : !expIsPersonal;
  });

  if (loading) return (
     <div className="space-y-10">
       <div className="h-16 skeleton rounded-2xl w-full"></div>
       <div className="h-[500px] skeleton rounded-2xl w-full"></div>
     </div>
  );

  if (categories.length === 0) {
    return (
      <div className="card-professional p-16 text-center max-w-xl mx-auto mt-24">
        <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-500 mx-auto mb-10 border-2 border-indigo-100 shadow-xl shadow-indigo-100/50">
          <ICONS.Category className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Inventory Empty</h2>
        <p className="text-slate-500 text-base font-semibold mb-12 leading-relaxed px-6">Your classification system is currently empty. Define categories to begin logging transactions.</p>
        <Link to="/categories" className="btn-primary w-full !py-4.5 text-xs uppercase tracking-widest shadow-indigo-200">
          Configure Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Ledger Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Transaction Ledger</h2>
          <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Consolidated Spending Audit</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative group flex-1 sm:flex-initial">
             <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-xl px-6 py-3.5 font-black text-[10px] uppercase tracking-widest outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 appearance-none pr-12 shadow-sm"
            >
              <option value="all">Full Record</option>
              <option value="personal">Personal only</option>
              <option value="other">Institutional</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <button onClick={() => setShowAddForm(true)} className="btn-primary !px-10 shadow-indigo-200">
            <ICONS.Plus className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-widest">Manual Entry</span>
          </button>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-12 w-full max-w-xl shadow-2xl border border-slate-100 transform animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-12">
               <div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">New Entry</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Manual Transaction Logging</p>
               </div>
               <button onClick={() => setShowAddForm(false)} className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-90">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-8">
              <div className="bg-slate-50 p-8 rounded-3xl border-2 border-slate-100 shadow-inner">
                <label className="label-professional">Value (INR)</label>
                <div className="relative mt-2">
                   <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-300 text-3xl">₹</span>
                   <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input-professional !pl-12 !text-4xl font-black text-indigo-600 !py-6 !border-none !shadow-none bg-transparent" placeholder="0.00" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label-professional">Date</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="input-professional" />
                </div>
                <div>
                  <label className="label-professional">Source</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} className="input-professional font-bold">
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label-professional">Classification</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input-professional font-bold">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-5 bg-indigo-50/70 p-6 rounded-2xl border border-indigo-100 group cursor-pointer" onClick={() => setIsPersonal(!isPersonal)}>
                <input 
                  type="checkbox" 
                  checked={isPersonal} 
                  onChange={e => setIsPersonal(e.target.checked)}
                  className="w-7 h-7 rounded-xl border-slate-300 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 accent-indigo-600 cursor-pointer"
                />
                <span className="text-sm font-black text-slate-700 select-none">Private / Personal Account Spend</span>
              </div>

              <div>
                <label className="label-professional">Reference Details</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="input-professional" placeholder="e.g. Weekly Starbucks or Server costs" />
              </div>

              <div className="flex gap-6 pt-10 border-t border-slate-100">
                 <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 btn-secondary !py-5 uppercase tracking-widest text-[11px]">Discard</button>
                 <button type="submit" className="flex-1 btn-primary !py-5 uppercase tracking-widest text-[11px] shadow-indigo-200">Confirm Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="card-professional shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Channel</th>
                <th>Classification</th>
                <th className="text-right">Value</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="text-slate-300 mb-4 flex justify-center">
                       <ICONS.Expense className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">No Transactions Recorded</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const expIsPersonal = exp.personalExpense ?? true;
                  return (
                    <tr key={exp.id} className="hover:bg-indigo-50/20 transition-all group">
                      <td className="font-bold text-slate-400 text-[11px] uppercase tracking-wider">
                        {new Date(exp.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </td>
                      <td>
                        <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border transition-all ${
                          expIsPersonal 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                            : 'bg-white text-slate-500 border-slate-300'
                        }`}>
                          {expIsPersonal ? 'Personal' : 'External'}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col">
                           <p className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                            {categories.find(c => c.id === exp.categoryId)?.name || 'Misc'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[300px] mt-1.5">
                            {exp.description || 'Verified entry'}
                          </p>
                        </div>
                      </td>
                      <td className="text-right font-black text-slate-900 text-base">
                        ₹{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpenseManager;