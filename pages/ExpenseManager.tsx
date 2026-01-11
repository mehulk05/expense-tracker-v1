
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

  if (loading) return <div className="p-20 text-center"><div className="animate-spin h-6 w-6 border-b-2 border-slate-900 inline-block"></div></div>;

  if (categories.length === 0) {
    return (
      <div className="card-professional p-12 text-center max-w-lg mx-auto mt-12">
        <div className="w-16 h-16 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mx-auto mb-6">
          <ICONS.Category className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">Category Required</h2>
        <p className="text-slate-500 text-sm mb-8">You can't add an expense until you create at least one category to organize your spends.</p>
        <Link to="/categories" className="btn-primary inline-flex items-center gap-2">
          <span>Go to Categories</span>
          <ICONS.ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Ledger</h2>
          <p className="text-xs text-slate-400 font-medium">History of all transactions</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="input-professional !py-1.5 !px-3 bg-white font-bold text-[10px] uppercase tracking-wider w-32"
          >
            <option value="all">All Spends</option>
            <option value="personal">Personal Only</option>
            <option value="other">Other Only</option>
          </select>
          <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2 text-xs py-1.5 px-4 ml-auto">
            <ICONS.Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-2xl border border-slate-200">
            <h3 className="text-lg font-extrabold text-slate-900 mb-6">Manual Transaction</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Amount</label>
                <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input-professional !text-lg font-bold" placeholder="0.00" />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="input-professional" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Source</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} className="input-professional bg-slate-50 font-semibold">
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                    {accounts.length === 0 && <option value="">No Accounts</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Category</label>
                <select 
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)}
                  className="input-professional bg-slate-50 font-semibold"
                >
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 py-2 px-1">
                <input 
                  type="checkbox" 
                  id="personal" 
                  checked={isPersonal} 
                  onChange={e => setIsPersonal(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="personal" className="text-sm font-bold text-slate-700 cursor-pointer">Personal expense</label>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Remarks</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="input-professional" placeholder="What was this for?" />
              </div>

              <div className="flex gap-3 pt-4">
                 <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 btn-secondary">Discard</button>
                 <button type="submit" className="flex-1 btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card-professional overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No matching records found.</td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const expIsPersonal = exp.personalExpense ?? true;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-500 whitespace-nowrap">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tight border ${
                          expIsPersonal ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {expIsPersonal ? 'Personal' : 'Other'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{categories.find(c => c.id === exp.categoryId)?.name || 'Uncategorized'}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{exp.description || 'No remarks'}</p>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900 whitespace-nowrap">₹{exp.amount.toLocaleString()}</td>
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
