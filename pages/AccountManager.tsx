import React, { useState, useEffect } from 'react';
import SidePopover from '../components/SidePopover';
import { storage } from '../services/storage';
import { Account, AccountType, Expense } from '../types';
import { ICONS } from '../constants';

const AccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]); // Added for insights
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<AccountType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [type, setType] = useState<AccountType>('debit');
  const [lastFour, setLastFour] = useState('');

  // Validation
  const isValid = name.trim().length > 0;

  const loadData = async () => {
    const [accs, exps] = await Promise.all([
      storage.getAccounts(),
      storage.getExpenses() // Fetch expenses too
    ]);
    setAccounts(accs);
    setExpenses(exps);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    
    const id = editingId || crypto.randomUUID();
    const newAcc: Account = {
      id,
      name,
      nickname: nickname.trim() || undefined,
      type,
      lastFour: lastFour || undefined
    };
    await storage.saveAccount(newAcc);
    
    // Update local state
    if (editingId) {
        setAccounts(accounts.map(a => a.id === id ? newAcc : a));
    } else {
        setAccounts([...accounts, newAcc]);
    }
    
    resetForm();
  };

  const handleEdit = (acc: Account) => {
      setEditingId(acc.id);
      setName(acc.name);
      setNickname(acc.nickname || '');
      setType(acc.type);
      setLastFour(acc.lastFour || '');
      setShowAdd(true);
  };

  const resetForm = () => {
    setName('');
    setNickname('');
    setType('debit');
    setLastFour('');
    setEditingId(null);
    setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Archive this financial source?')) return;
    await storage.deleteAccount(id);
    setAccounts(accounts.filter(a => a.id !== id));
  };

  const getBadgeStyles = (t: AccountType) => {
    switch(t) {
      case 'credit': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'debit': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'upi': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'cash': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  const getUsageInsight = (acc: Account) => {
    const now = new Date();
    const currentMonthExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const totalMonthly = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    if (totalMonthly === 0) return null;

    const accountMonthly = currentMonthExpenses
        .filter(e => {
            // Strict match by ID
            if (e.accountId === acc.id) return true;
            
            // Fallback: Flexible Name match (if migrated from CSV where IDs might be missing)
            if (!e.accountId && e.paymentMethod === acc.type) {
                // Try matching nickname or entity name
                 const source = (e as any).source || ''; // Cast to any if source isn't on type yet, unlikely but safe
                 return source.toLowerCase() === acc.name.toLowerCase() || 
                        source.toLowerCase() === (acc.nickname || '').toLowerCase();
            }
            return false;
        })
        .reduce((sum, e) => sum + e.amount, 0);
    
    if (accountMonthly === 0) return null;

    const percentage = Math.round((accountMonthly / totalMonthly) * 100);
    return percentage;
  };

  const filteredAccounts = accounts.filter(acc => {
      const matchesFilter = filter === 'all' || acc.type === filter;
      const matchesSearch = (acc.name.toLowerCase().includes(search.toLowerCase())) || 
                            (acc.nickname?.toLowerCase().includes(search.toLowerCase()) || false);
      return matchesFilter && matchesSearch;
  });

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-2xl w-full"></div>)}
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Verified Channels</h2>
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Active Liquidity Points</p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
                <button onClick={() => setShowAdd(true)} className="btn-primary !px-10 shadow-indigo-200">
                <ICONS.Plus className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-widest">Add Source</span>
                </button>
            </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 p-1">
             <div className="relative flex-1">
                <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search accounts..." 
                    className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 shadow-sm transition-all"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             
             <div className="relative min-w-[200px]">
              <select 
               value={filter} 
               onChange={(e) => setFilter(e.target.value as any)}
               className="w-full bg-white border border-slate-200 rounded-xl px-6 py-3.5 font-black text-[10px] uppercase tracking-widest outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 appearance-none pr-12 shadow-sm text-slate-600"
             >
               <option value="all">All Channels</option>
               <option value="upi">UPI</option>
               <option value="credit">Credit Cards</option>
               <option value="debit">Debit Cards</option>
               <option value="cash">Cash</option>
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
             </div>
           </div>
        </div>
      </div>

      <SidePopover
        isOpen={showAdd}
        onClose={resetForm}
        title={editingId ? "Edit Source" : "Source Provisioning"}
        subtitle={editingId ? "Update Channel Details" : "Add New Financial Channel"}
      >
        <form onSubmit={handleAdd} className="space-y-8">
          <div>
            <label className="label-professional">Entity Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="input-professional" placeholder="e.g. Standard Chartered / Amex" />
          </div>
          <div>
            <label className="label-professional">Internal Identifier (Nickname)</label>
            <input value={nickname} onChange={e => setNickname(e.target.value)} className="input-professional" placeholder="e.g. Office Travel Card" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="label-professional">Network Type</label>
              <select value={type} onChange={e => setType(e.target.value as AccountType)} className="input-professional font-bold uppercase text-xs">
                <option value="debit">Debit Account</option>
                <option value="credit">Credit Line</option>
                <option value="upi">UPI Gateway</option>
                {/* Cash removed from manual Add/Edit as requested */}
              </select>
            </div>
            <div>
              <label className="label-professional">Last 4 Digits</label>
              <input value={lastFour} maxLength={4} onChange={e => setLastFour(e.target.value.replace(/\D/g, ''))} className="input-professional" placeholder="XXXX" />
            </div>
          </div>
          <div className="flex gap-4 pt-8 border-t border-slate-100 sticky bottom-0 bg-white pb-2">
            <button type="button" onClick={resetForm} className="flex-1 btn-secondary !py-4 uppercase tracking-widest text-[10px]">Cancel</button>
            <button 
              type="submit" 
              disabled={!isValid}
              className="flex-1 btn-primary !py-4 uppercase tracking-widest text-[10px] shadow-indigo-200"
            >
              {editingId ? "Update Channel" : "Activate Channel"}
            </button>
          </div>
        </form>
      </SidePopover>

      {/* Data Table */}
       <div className="card-professional shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="text-slate-700 bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 pl-6 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-100 last:border-r-0">Nickname</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-100 last:border-r-0">Entity Name</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-100 last:border-r-0">Type</th>
                <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest border-r border-slate-100 last:border-r-0">Details</th>
                <th className="py-4 pr-6 w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="text-slate-300 mb-4 flex justify-center">
                       <ICONS.Account className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">No Channels Found</p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const badgeStyle = getBadgeStyles(acc.type);
                  const usagePercentage = getUsageInsight(acc);
                  
                  return (
                    <tr key={acc.id} className="hover:bg-indigo-50/20 transition-all group border-b border-slate-50 last:border-b-0">
                      <td className="py-5 pl-6 font-bold text-slate-600 text-xs border-r border-slate-100 last:border-r-0">
                         {acc.nickname || '-'}
                      </td>
                      <td className="py-5 px-4 font-black text-slate-900 text-base border-r border-slate-100 last:border-r-0">
                        {acc.name}
                        {usagePercentage !== null && (
                            <div className="text-[9px] font-black uppercase tracking-wide text-indigo-500 mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                Used {usagePercentage}% this month
                            </div>
                        )}
                      </td>
                      <td className="py-5 px-4 border-r border-slate-100 last:border-r-0">
                        <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border ${badgeStyle}`}>
                          {acc.type}
                        </span>
                      </td>
                       <td className="py-5 px-4 font-mono text-xs text-slate-600 font-bold tracking-wider border-r border-slate-100 last:border-r-0">
                         {acc.lastFour ? `•••• ${acc.lastFour}` : '—'}
                      </td>
                      <td className="py-5 pr-6 text-right">
                        <div className="flex justify-end gap-2 transition-opacity">
                            <button 
                                onClick={() => handleEdit(acc)}
                                className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button 
                                onClick={() => handleDelete(acc.id)}
                                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                                <ICONS.Trash className="w-4 h-4" />
                            </button>
                        </div>
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

export default AccountManager;