
import React, { useState, useEffect } from 'react';
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
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');

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
    if (cats.length && !categoryId) {
      setCategoryId(cats[0].id);
      setSubCategory(cats[0].subCategories[0] || '');
    }
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
      subCategory,
      description
    };
    await storage.saveExpense(newExpense);
    setExpenses([newExpense, ...expenses]);
    setAmount('');
    setDescription('');
    setShowAddForm(false);
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Ledger</h2>
        <button onClick={() => setShowAddForm(true)} className="btn-primary flex items-center gap-2">
          <ICONS.Plus className="w-4 h-4" />
          <span>New Entry</span>
        </button>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-xl border border-slate-200/60">
            <h3 className="text-lg font-extrabold text-slate-900 mb-6">Manual Log</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input-professional !text-lg font-bold" placeholder="0.00" />
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="input-professional" />
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className="input-professional bg-slate-50 font-semibold">
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
              </select>
              <div className="flex gap-2">
                <select 
                  value={categoryId} 
                  onChange={e => {
                    setCategoryId(e.target.value);
                    const cat = categories.find(c => c.id === e.target.value);
                    setSubCategory(cat?.subCategories[0] || '');
                  }}
                  className="flex-1 input-professional bg-slate-50 font-semibold"
                >
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <select value={subCategory} onChange={e => setSubCategory(e.target.value)} className="flex-1 input-professional bg-slate-50 font-semibold">
                  {selectedCategory?.subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>
              <input value={description} onChange={e => setDescription(e.target.value)} className="input-professional" placeholder="Entry Remarks" />
              <div className="flex gap-3 pt-4">
                 <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 btn-secondary">Discard</button>
                 <button type="submit" className="flex-1 btn-primary">Save Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div className="p-20 text-center"><div className="animate-spin h-6 w-6 border-b-2 border-slate-900 inline-block"></div></div> : (
        <div className="card-professional">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-500">{new Date(exp.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{categories.find(c => c.id === exp.categoryId)?.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{exp.subCategory}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded tracking-tight">
                       {accounts.find(a => a.id === exp.accountId)?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-900">₹{exp.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;