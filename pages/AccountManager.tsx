
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
    if (!window.confirm('Terminate this payment source?')) return;
    await storage.deleteAccount(id);
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const getTypeStyle = (t: AccountType) => {
    switch(t) {
      case 'credit': return { border: 'border-l-[6px] border-l-indigo-600', badge: 'bg-indigo-600 text-white' };
      case 'debit': return { border: 'border-l-[6px] border-l-slate-400', badge: 'bg-slate-100 text-slate-500' };
      case 'upi': return { border: 'border-l-[6px] border-l-indigo-900', badge: 'bg-indigo-900 text-white' };
      default: return { border: 'border-l-[6px] border-l-slate-200', badge: 'bg-slate-50 text-slate-400' };
    }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1,2,3].map(i => <div key={i} className="h-44 skeleton rounded-2xl"></div>)}
    </div>
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Payment Sources</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Verified Gateways</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary !px-8 shadow-indigo-200">
          <ICONS.Plus className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-widest">Add Source</span>
        </button>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tighter uppercase">New Account</h3>
            <form onSubmit={handleAdd} className="space-y-6">
              <div>
                <label className="label-professional">Bank / Provider Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="input-professional" placeholder="e.g. ICICI Bank" />
              </div>
              <div>
                <label className="label-professional">Alias (Optional)</label>
                <input value={nickname} onChange={e => setNickname(e.target.value)} className="input-professional" placeholder="e.g. Primary Salary Acc" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-professional">System Type</label>
                  <select value={type} onChange={e => setType(e.target.value as AccountType)} className="input-professional font-bold">
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="label-professional">Terminals (Last 4)</label>
                  <input value={lastFour} maxLength={4} onChange={e => setLastFour(e.target.value.replace(/\D/g, ''))} className="input-professional" placeholder="XXXX" />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 btn-secondary !py-4 uppercase tracking-widest text-[10px]">Discard</button>
                <button type="submit" className="flex-1 btn-primary !py-4 uppercase tracking-widest text-[10px] shadow-indigo-200">Initialize Source</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="card-professional flex flex-col items-center justify-center py-24 px-8 text-center border-dashed border-2">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
            <ICONS.Account className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No Verified Sources</h3>
          <p className="text-xs font-bold text-slate-400 mb-10 uppercase tracking-widest max-w-xs">Link your accounts to categorize expenditure accurately</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary !px-10">Initialize Your First Account</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {accounts.map(acc => {
            const styles = getTypeStyle(acc.type);
            return (
              <div key={acc.id} className={`card-professional ${styles.border} p-8 flex flex-col relative group`}>
                <div className="flex justify-between items-start mb-10">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${styles.badge}`}>
                     {acc.type}
                  </span>
                  <button onClick={() => handleDelete(acc.id)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all text-slate-300">
                    <ICONS.Trash className="w-4 h-4" />
                  </button>
                </div>
                <div className="mb-8">
                  <h3 className="text-xl font-black text-slate-900 tracking-tighter leading-none">{acc.name}</h3>
                  {acc.nickname && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{acc.nickname}</p>}
                </div>
                <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-100">
                   <span className="text-xs font-black text-slate-900 font-mono tracking-widest">{acc.lastFour ? `•••• ${acc.lastFour}` : 'ACTIVE GATEWAY'}</span>
                   <ICONS.Account className="w-4 h-4 text-slate-200" />
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowAdd(true)} className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/20 hover:text-indigo-600 transition-all min-h-[220px]">
            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
               <ICONS.Plus className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">New Financial Source</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
