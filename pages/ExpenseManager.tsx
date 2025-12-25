
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Expense, Account, Category } from '../types';
import { ICONS } from '../constants';

const ExpenseManager: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
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
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        setError("Database access denied. Please verify your Firestore security rules.");
      } else {
        setError("Failed to load data. Please refresh the page.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !accountId || !categoryId) return;

    try {
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
    } catch (err) {
      alert("Permission denied or database error. Could not save expense.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await storage.deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (err) {
      alert("Permission denied or database error. Could not delete expense.");
    }
  };

  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">My Expenses</h2>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <ICONS.Plus className="w-5 h-5" />
          <span>Add Expense</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-800">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">New Expense</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                <input 
                  type="number" required value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200">
                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category & Sub</label>
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    value={categoryId} 
                    onChange={e => {
                      const id = e.target.value;
                      setCategoryId(id);
                      const cat = categories.find(c => c.id === id);
                      if (cat) setSubCategory(cat.subCategories[0] || '');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200"
                  >
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  <select value={subCategory} onChange={e => setSubCategory(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200">
                    {selectedCategory?.subCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>
              <input 
                type="text" value={description} onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200" placeholder="Description"
              />
              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">Save Expense</button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Account</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-900">{categories.find(c => c.id === exp.categoryId)?.name}</span>
                      <span className="block text-xs text-slate-400">{exp.subCategory}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">{accounts.find(a => a.id === exp.accountId)?.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">₹{exp.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleDelete(exp.id)} className="text-red-400 hover:text-red-600"><ICONS.Trash className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
