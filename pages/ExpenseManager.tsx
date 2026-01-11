
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

  if (loading) return <div className="p-20 text-center"><div className="animate-spin h-6 w-6 border-b-2 border-indigo-600 inline-block"></div></div>;

  if (categories.length === 0) {
    return (
      <div className="card-professional p-12 text-center max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-300 mx-auto mb-6">
          <ICONS.Category className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Setup Required</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-8">Define spending categories to enable ledger entry.</p>
        <Link to="/categories" className="btn-primary inline-flex items-center gap-2 !py-3 !px-8 text-xs uppercase tracking-widest">
          <span>Go to Categories</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tighter">Transaction Ledger</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Verified financial records</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 font-black text-[10px] uppercase tracking-wider outline-none focus:border-indigo-500"
          >
            <option value="all">Full Record</option>
            <option value="personal">Personal only</option>
            <option value="other">Institutional</option>
          </select>
          <button onClick={() => setShowAddForm(true)} className="btn-primary !py-2 text-xs uppercase tracking-widest ml-auto">
            <span>Manual Entry</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-900/10 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-10 w-full max-w-sm shadow-2xl border border-slate-100">
            <h3 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-tighter">New Entry</h3>
            <form onSubmit={handleAddExpense} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Value (INR)</label>
                <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input-professional !text-2xl font-black focus:border-indigo-500" placeholder="0.00" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Date</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="input-professional focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Source</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} className="input-professional bg-slate-50 font-bold focus:border-indigo-500">
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Category</label>
                <select 
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)}
                  className="input-professional bg-slate-50 font-bold focus:border-indigo-500"
                >
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3 py-1">
                <input 
                  type="checkbox" 
                  id="personal" 
                  checked={isPersonal} 
                  onChange={e => setIsPersonal(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                />
                <label htmlFor="personal" className="text-sm font-bold text-slate-700 cursor-pointer">Personal account spend</label>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Reference</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="input-professional focus:border-indigo-500" placeholder="Add remarks..." />
              </div>

              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 btn-secondary text-[10px] uppercase tracking-widest">Discard</button>
                 <button type="submit" className="flex-1 btn-primary text-[10px] uppercase tracking-widest">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card-professional">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Scope</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => {
                const expIsPersonal = exp.personalExpense ?? true;
                return (
                  <tr key={exp.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-5 font-bold text-slate-500 text-xs">{new Date(exp.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</td>
                    <td className="px-6 py-5">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-tighter border ${
                        expIsPersonal ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'
                      }`}>
                        {expIsPersonal ? 'Personal' : 'Institutional'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-black text-slate-900 text-sm group-hover:text-indigo-700 transition-colors">{categories.find(c => c.id === exp.categoryId)?.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{exp.description || '-'}</p>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">₹{exp.amount.toLocaleString()}</td>
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

export default ExpenseManager;
