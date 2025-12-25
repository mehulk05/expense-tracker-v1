
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Account, AccountType } from '../types';
import { ICONS } from '../constants';

const AccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('debit');
  const [lastFour, setLastFour] = useState('');

  useEffect(() => {
    const load = async () => {
      const data = await storage.getAccounts();
      setAccounts(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    const newAcc: Account = {
      id: crypto.randomUUID(),
      name,
      type,
      lastFour: lastFour || undefined
    };

    await storage.saveAccount(newAcc);
    setAccounts([...accounts, newAcc]);
    setName('');
    setLastFour('');
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this account?')) return;
    await storage.deleteAccount(id);
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const getTypeColor = (t: AccountType) => {
    switch(t) {
      case 'credit': return 'bg-rose-500';
      case 'debit': return 'bg-indigo-600';
      case 'upi': return 'bg-emerald-500';
      default: return 'bg-slate-600';
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">My Cards & Accounts</h2>
        <button onClick={() => setShowAdd(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"><ICONS.Plus className="w-5 h-5" /><span>Add Account</span></button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">New Account</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border rounded-xl" placeholder="Account Name" />
              <div className="grid grid-cols-2 gap-4">
                <select value={type} onChange={e => setType(e.target.value as AccountType)} className="w-full px-4 py-3 border rounded-xl">
                  <option value="debit">Debit Card</option>
                  <option value="credit">Credit Card</option>
                  <option value="upi">UPI</option>
                </select>
                <input value={lastFour} onChange={e => setLastFour(e.target.value)} className="w-full px-4 py-3 border rounded-xl" placeholder="Last 4 (optional)" />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => (
          <div key={acc.id} className={`${getTypeColor(acc.type)} p-6 rounded-3xl text-white shadow-lg relative group`}>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="uppercase text-[10px] tracking-widest font-bold opacity-75">{acc.type}</span>
                  <button onClick={() => handleDelete(acc.id)} className="opacity-0 group-hover:opacity-100 transition-opacity"><ICONS.Trash className="w-4 h-4" /></button>
                </div>
                <h3 className="text-xl font-bold mt-2">{acc.name}</h3>
              </div>
              <div className="mt-8 flex justify-between items-end">
                <div className="flex gap-2"><div className="w-8 h-8 rounded bg-white/20"></div><div className="w-8 h-8 rounded bg-white/20"></div></div>
                <span className="text-lg font-mono">{acc.lastFour ? `•••• ${acc.lastFour}` : 'Linked'}</span>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountManager;
