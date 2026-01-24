
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
     <div className="space-y-6">
       <div className="h-12 skeleton rounded-xl w-full"></div>
       <div className="h-[400px] skeleton rounded-xl w-full"></div>
     </div>
  );

  if (categories.length === 0) {
    return (
      <div className="card-professional p-12 text-center max-w-lg mx-auto mt-20">
        <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-400 mx-auto mb-8 border-2 border-indigo-100 shadow-xl shadow-indigo-100/50">
          <ICONS.Category className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Configuration Needed</h2>
        <p className="text-slate-500 text-sm font-semibold mb-10 leading-relaxed">You haven't added any spending categories yet. Let's set those up first.</p>
        <Link to="/categories" className="btn-primary w-full !py-4 text-xs uppercase tracking-widest shadow-indigo-200">
          Set Up Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Transaction Ledger</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Official Spending Log</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative group flex-1 sm:flex-initial">
             <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-xl px-5 py-3 font-bold text-xs uppercase tracking-wider outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 appearance-none pr-10"
            >
              <option value="all">Full Record</option>
              <option value="personal">Personal only</option>
              <option value="other">Institutional</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <button onClick={() => setShowAddForm(true)} className="btn-primary !px-8 shadow-indigo-200">
            <ICONS.Plus className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-widest">New Entry</span>
          </button>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-10 w-full max-w-lg shadow-2xl border border-slate-100 transform animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">Add Entry</h3>
               <button onClick={() => setShowAddForm(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <label className="label-professional">Transaction Value (INR)</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-2xl">₹</span>
                   <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input-professional !pl-10 !text-3xl font-black text-indigo-600 !py-4" placeholder="0.00" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-professional">Timestamp</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="input-professional" />
                </div>
                <div>
                  <label className="label-professional">Account Source</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} className="input-professional font-bold">
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label-professional">Spending Category</label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input-professional font-bold">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <input 
                  type="checkbox" 
                  id="personal" 
                  checked={isPersonal} 
                  onChange={e => setIsPersonal(e.target.checked)}
                  className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 accent-indigo-600 cursor-pointer"
                />
                <label htmlFor="personal" className="text-sm font-black text-slate-700 cursor-pointer select-none">Mark as Personal Expense</label>
              </div>

              <div>
                <label className="label-professional">Remarks (Reference)</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="input-professional" placeholder="Add specific details..." />
              </div>

              <div className="flex gap-4 pt-6 border-t border-slate-100">
                 <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 btn-secondary !py-4 uppercase tracking-widest text-[10px]">Discard</button>
                 <button type="submit" className="flex-1 btn-primary !py-4 uppercase tracking-widest text-[10px] shadow-indigo-200">Confirm & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="card-professional">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>Classification</th>
                <th>Category</th>
                <th className="text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No ledger entries found</td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const expIsPersonal = exp.personalExpense ?? true;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="font-bold text-slate-500 text-xs">
                        {new Date(exp.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </td>
                      <td>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border transition-all ${
                          expIsPersonal 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100' 
                            : 'bg-white text-slate-500 border-slate-300'
                        }`}>
                          {expIsPersonal ? 'Personal' : 'Institutional'}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col">
                           <p className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                            {categories.find(c => c.id === exp.categoryId)?.name || 'Uncategorized'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[240px] mt-0.5">
                            {exp.description || 'No reference added'}
                          </p>
                        </div>
                      </td>
                      <td className="text-right font-black text-slate-900 text-sm">
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
