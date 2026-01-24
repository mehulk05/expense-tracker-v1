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
    if (!window.confirm('Archive this financial source?')) return;
    await storage.deleteAccount(id);
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const getTypeStyle = (t: AccountType) => {
    switch(t) {
      case 'credit': return { border: 'border-l-[8px] border-l-indigo-600', badge: 'bg-indigo-600 text-white' };
      case 'debit': return { border: 'border-l-[8px] border-l-slate-400', badge: 'bg-slate-100 text-slate-600' };
      case 'upi': return { border: 'border-l-[8px] border-l-indigo-900', badge: 'bg-indigo-900 text-white' };
      default: return { border: 'border-l-[8px] border-l-slate-200', badge: 'bg-slate-50 text-slate-400' };
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[1,2,3].map(i => <div key={i} className="h-48 skeleton rounded-2xl"></div>)}
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Verified Channels</h2>
          <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Active Liquidity Points</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary !px-10 shadow-indigo-200">
          <ICONS.Plus className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-widest">Add Source</span>
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-12 w-full max-w-xl shadow-2xl border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-10 tracking-tighter uppercase">Source Provisioning</h3>
            <form onSubmit={handleAdd} className="space-y-8">
              <div>
                <label className="label-professional">Entity Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="input-professional" placeholder="e.g. Standard Chartered / Amex" />
              </div>
              <div>
                <label className="label-professional">Internal Identifier</label>
                <input value={nickname} onChange={e => setNickname(e.target.value)} className="input-professional" placeholder="e.g. Office Travel Card" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="label-professional">Network Type</label>
                  <select value={type} onChange={e => setType(e.target.value as AccountType)} className="input-professional font-bold">
                    <option value="debit">Debit Account</option>
                    <option value="credit">Credit Line</option>
                    <option value="upi">UPI Gateway</option>
                  </select>
                </div>
                <div>
                  <label className="label-professional">Last 4 Digits</label>
                  <input value={lastFour} maxLength={4} onChange={e => setLastFour(e.target.value.replace(/\D/g, ''))} className="input-professional" placeholder="XXXX" />
                </div>
              </div>
              <div className="flex gap-6 pt-8">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 btn-secondary !py-5 uppercase tracking-widest text-[11px]">Cancel</button>
                <button type="submit" className="flex-1 btn-primary !py-5 uppercase tracking-widest text-[11px] shadow-indigo-200">Activate Channel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="card-professional flex flex-col items-center justify-center py-28 px-8 text-center border-dashed border-2 bg-slate-50/50">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mb-8 border-2 border-slate-100 shadow-xl shadow-slate-200/50">
            <ICONS.Account className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">No Active Channels</h3>
          <p className="text-sm font-bold text-slate-400 mb-12 uppercase tracking-widest max-w-sm">Linking sources allows for precise categorization of capital movement.</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary !px-12 py-4">Provision First Source</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {accounts.map(acc => {
            const styles = getTypeStyle(acc.type);
            return (
              <div key={acc.id} className={`card-professional ${styles.border} p-10 flex flex-col relative group`}>
                <div className="flex justify-between items-start mb-12">
                  <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${styles.badge}`}>
                     {acc.type}
                  </span>
                  <button onClick={() => handleDelete(acc.id)} className="opacity-0 group-hover:opacity-100 p-2.5 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all text-slate-300">
                    <ICONS.Trash className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-10">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-tight group-hover:text-indigo-600 transition-colors">{acc.name}</h3>
                  {acc.nickname && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">{acc.nickname}</p>}
                </div>
                <div className="mt-auto flex justify-between items-center pt-8 border-t border-slate-100">
                   <span className="text-xs font-black text-slate-900 font-mono tracking-[0.2em]">{acc.lastFour ? `•••• ${acc.lastFour}` : 'OPERATIONAL'}</span>
                   <ICONS.Account className="w-5 h-5 text-slate-200 group-hover:text-indigo-200 transition-colors" />
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowAdd(true)} className="border-2 border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center p-10 text-slate-400 hover:border-indigo-400 hover:bg-white hover:text-indigo-600 transition-all min-h-[260px] group shadow-sm hover:shadow-xl hover:shadow-indigo-100/50">
            <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center mb-6 border-2 border-slate-100 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-all">
               <ICONS.Plus className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">New Financial Access Point</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountManager;