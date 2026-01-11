
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Account, AccountType } from '../types';
import { ICONS } from '../constants';

const AccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  
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
    if (!window.confirm('Confirm account removal?')) return;
    await storage.deleteAccount(id);
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const getTypeStyle = (t: AccountType) => {
    switch(t) {
      case 'credit': return 'bg-indigo-600 text-white shadow-indigo-200';
      case 'debit': return 'bg-white text-slate-900 border border-slate-200 shadow-sm';
      case 'upi': return 'bg-indigo-900 text-white shadow-slate-200';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  if (loading) return (
    <div className="p-20 text-center"><div className="animate-spin h-6 w-6 border-b-2 border-indigo-600 inline-block"></div></div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Payment Sources</h2>
          <p className="text-xs text-slate-500 font-medium">Manage your active accounts and cards</p>
        </div>
        {accounts.length > 0 && (
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <ICONS.Plus className="w-4 h-4" />
            <span>Add Source</span>
          </button>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-8 w-full max-w-sm shadow-2xl border border-slate-100 animate-in zoom-in duration-200">
            <h3 className="text-lg font-extrabold text-slate-900 mb-6">New Account</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Account Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="input-professional" placeholder="e.g. HDFC Bank" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nickname (Optional)</label>
                <input value={nickname} onChange={e => setNickname(e.target.value)} className="input-professional" placeholder="e.g. Primary Card" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Type</label>
                  <select value={type} onChange={e => setType(e.target.value as AccountType)} className="w-full input-professional bg-white font-semibold">
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Last 4</label>
                  <input value={lastFour} maxLength={4} onChange={e => setLastFour(e.target.value.replace(/\D/g, ''))} className="w-full input-professional" placeholder="XXXX" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Save Source</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="card-professional flex flex-col items-center justify-center py-20 px-8 text-center border-dashed">
          <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
            <ICONS.Account className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Sources Linked</h3>
          <p className="text-xs text-slate-400 mb-8 max-w-xs">Link your accounts to start attribute spending to specific funds.</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary">Link Your First Account</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(acc => (
            <div key={acc.id} className={`${getTypeStyle(acc.type)} p-6 rounded-xl relative group transition-all hover:translate-y-[-2px] hover:shadow-lg`}>
              <div className="flex justify-between items-start mb-10">
                <span className={`text-[9px] font-black uppercase tracking-widest ${acc.type === 'debit' ? 'text-slate-400' : 'opacity-70'}`}>
                   {acc.type} account
                </span>
                <button onClick={() => handleDelete(acc.id)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-black/5 rounded transition-all">
                  <ICONS.Trash className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mb-8">
                <h3 className="text-lg font-bold tracking-tight leading-none">{acc.name}</h3>
                {acc.nickname && <p className={`text-[10px] font-medium mt-1.5 italic ${acc.type === 'debit' ? 'text-slate-500' : 'opacity-70'}`}>"{acc.nickname}"</p>}
              </div>
              <div className={`flex justify-between items-center border-t pt-4 ${acc.type === 'debit' ? 'border-slate-100' : 'border-white/20'}`}>
                 <span className={`text-xs font-mono tracking-widest ${acc.type === 'debit' ? 'text-slate-400' : 'opacity-80'}`}>{acc.lastFour ? `•••• ${acc.lastFour}` : 'ACTIVE'}</span>
                 <ICONS.Account className={`w-4 h-4 ${acc.type === 'debit' ? 'text-slate-200' : 'opacity-40'}`} />
              </div>
            </div>
          ))}
          <button onClick={() => setShowAdd(true)} className="border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-6 text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all min-h-[180px]">
            <ICONS.Plus className="w-6 h-6 mb-2" />
            <span className="text-[10px] font-bold uppercase tracking-wider">New Source</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
