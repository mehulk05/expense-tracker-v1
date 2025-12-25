
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Account, AccountType } from '../types';
import { ICONS } from '../constants';

const AccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
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
      nickname: nickname.trim() || undefined,
      type,
      lastFour: lastFour || undefined
    };

    await storage.saveAccount(newAcc);
    setAccounts([...accounts, newAcc]);
    resetForm();
    setShowAdd(false);
  };

  const resetForm = () => {
    setName('');
    setNickname('');
    setType('debit');
    setLastFour('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this account?')) return;
    await storage.deleteAccount(id);
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const getTypeColor = (t: AccountType) => {
    switch(t) {
      case 'credit': return 'from-rose-500 to-rose-700';
      case 'debit': return 'from-indigo-600 to-indigo-800';
      case 'upi': return 'from-emerald-500 to-emerald-700';
      default: return 'from-slate-600 to-slate-800';
    }
  };

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      <p className="text-slate-500 font-medium">Loading your vault...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">My Cards & Accounts</h2>
        {accounts.length > 0 && (
          <button 
            onClick={() => setShowAdd(true)} 
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 font-semibold"
          >
            <ICONS.Plus className="w-5 h-5" />
            <span>Add Account</span>
          </button>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl scale-in-center">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800">New Account</h3>
              <button onClick={() => { setShowAdd(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600 ml-1">Bank or App Name</label>
                <input 
                  required
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                  placeholder="e.g. HDFC Bank, ICICI, GPay" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-600 ml-1">Nickname (Optional)</label>
                <input 
                  value={nickname} 
                  onChange={e => setNickname(e.target.value)} 
                  className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                  placeholder="e.g. Daily Use, Savings, Travel" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 ml-1">Account Type</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as AccountType)} 
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-2xl bg-slate-50 font-medium"
                  >
                    <option value="debit">Debit Card</option>
                    <option value="credit">Credit Card</option>
                    <option value="upi">UPI / Wallet</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 ml-1">Last 4 Digits</label>
                  <input 
                    value={lastFour} 
                    maxLength={4}
                    onChange={e => setLastFour(e.target.value.replace(/\D/g, ''))} 
                    className="w-full px-5 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                    placeholder="1234" 
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button 
                  type="button" 
                  onClick={() => { setShowAdd(false); resetForm(); }} 
                  className="flex-1 py-4 font-bold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[2rem] border border-dashed border-slate-300">
          <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-500 mb-6">
            <ICONS.Account className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">No Accounts Added Yet</h3>
          <p className="text-slate-500 max-w-xs mb-8">
            Add your credit cards, debit cards, or UPI accounts to start tracking where your money flows.
          </p>
          <button 
            onClick={() => setShowAdd(true)} 
            className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3"
          >
            <ICONS.Plus className="w-6 h-6" />
            <span>Add Your First Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div key={acc.id} className={`bg-gradient-to-br ${getTypeColor(acc.type)} p-7 rounded-[2rem] text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}>
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="uppercase text-[10px] tracking-[0.2em] font-black opacity-60 bg-white/10 px-2 py-1 rounded-md">
                      {acc.type === 'upi' ? 'UPI WALLET' : `${acc.type} card`}
                    </span>
                    <button 
                      onClick={() => handleDelete(acc.id)} 
                      className="p-2 bg-white/10 hover:bg-red-500/80 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Account"
                    >
                      <ICONS.Trash className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold tracking-tight">{acc.name}</h3>
                    {acc.nickname && (
                      <p className="text-sm font-medium opacity-80 mt-1 italic">"{acc.nickname}"</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-12 flex justify-between items-end">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                      <ICONS.Account className="w-5 h-5 opacity-70" />
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/5"></div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-mono tracking-wider">
                      {acc.lastFour ? `•••• ${acc.lastFour}` : 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-24 h-24 bg-indigo-400/10 rounded-full blur-xl"></div>
            </div>
          ))}
          
          {/* Add Mini-Card Trigger */}
          <button 
            onClick={() => setShowAdd(true)}
            className="border-2 border-dashed border-slate-200 p-7 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all group"
          >
            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-100 transition-colors">
              <ICONS.Plus className="w-6 h-6" />
            </div>
            <span className="font-bold">Add Another</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
