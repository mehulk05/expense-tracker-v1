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
  const [timeRange, setTimeRange] = useState<'month' | 'year'>('month'); // Added timeRange

  
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

  const getAccountMetrics = (acc: Account) => {
    const now = new Date();
    const currentExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        if (timeRange === 'month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else {
            return d.getFullYear() === now.getFullYear();
        }
    }).filter(e => {
        if (e.accountId === acc.id) return true;
        
        // Fallback: Flexible Name match
        if (!e.accountId && e.paymentMethod === acc.type) {
             const source = (e as any).source || ''; 
             return source.toLowerCase() === acc.name.toLowerCase() || 
                    source.toLowerCase() === (acc.nickname || '').toLowerCase();
        }
        return false;
    });

    const totalSpent = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = currentExpenses.length;
    
    return { totalSpent, count };
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

  // Group accounts by Entity Name
  const groupedAccounts = React.useMemo(() => {
    return filteredAccounts.reduce((groups, acc) => {
        const name = acc.name;
        if (!groups[name]) groups[name] = [];
        groups[name].push(acc);
        return groups;
    }, {} as Record<string, Account[]>);
  }, [filteredAccounts]);

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-16 skeleton rounded-2xl w-full"></div>)}
    </div>
  );

  // Calculate Top 4 Accounts
  const accountStats = accounts.map(acc => ({
      ...acc,
      ...getAccountMetrics(acc)
  })).sort((a, b) => b.totalSpent - a.totalSpent);
  const topAccounts = accountStats.slice(0, 4);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">Verified Channels</h1>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">Active Liquidity Points</p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setTimeRange('month')} 
                        className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${timeRange === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        This Month
                    </button>
                    <button 
                        onClick={() => setTimeRange('year')} 
                        className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${timeRange === 'year' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        This Year
                    </button>
                </div>
                <button onClick={() => setShowAdd(true)} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                <ICONS.Plus className="w-4 h-4" />
                <span>Add Source</span>
                </button>
            </div>
        </div>

        {/* Top 4 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topAccounts.map(acc => (
                <div key={acc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2.5 rounded-xl ${getBadgeStyles(acc.type).replace('border', 'bg-opacity-20')}`}>
                            <ICONS.Account className="w-5 h-5" />
                        </div>
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${getBadgeStyles(acc.type)}`}>
                            {acc.type}
                        </span>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{acc.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{acc.nickname || '-'}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Spent</p>
                            <span className="text-lg font-black text-slate-900 tracking-tight">₹{acc.totalSpent.toLocaleString()}</span>
                        </div>
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Txns</p>
                            <span className="text-sm font-bold text-slate-600">{acc.count}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 p-1">
             <div className="relative flex-1">
                <ICONS.Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search accounts..." 
                    className="w-full bg-white border border-slate-200 rounded-lg pl-12 pr-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 hover:border-slate-300 transition-all"
                />
             </div>
             
             <div className="relative min-w-[200px]">
              <select 
               value={filter} 
               onChange={(e) => setFilter(e.target.value as any)}
               className="w-full bg-white border border-slate-200 rounded-lg px-6 py-2.5 font-bold text-[10px] uppercase tracking-widest outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 appearance-none pr-12 text-slate-600 hover:border-slate-300 transition-all"
             >
               <option value="all">All Channels</option>
               <option value="upi">UPI</option>
               <option value="credit">Credit Cards</option>
               <option value="debit">Debit Cards</option>
               <option value="cash">Cash</option>
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 pl-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nickname</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity Name</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Spend ({timeRange})</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Activity</th>
                <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                <th className="py-4 pr-6 w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="text-slate-300 mb-4 flex justify-center">
                       <ICONS.Account className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">No Channels Found</p>
                  </td>
                </tr>
              ) : (
                (Object.entries(groupedAccounts) as [string, Account[]][]).map(([entityName, accounts]) => (
                  <React.Fragment key={entityName}>
                    {/* Group Header */}
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <td colSpan={7} className="py-4 px-6">
                        <div className="flex items-center gap-3">
                            <span className="font-black text-slate-800 text-sm tracking-tight">{entityName}</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wide shadow-sm flex items-center gap-1">
                                {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
                            </span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Account Rows */}
                    {accounts.map((acc) => {
                      const badgeStyle = getBadgeStyles(acc.type);
                      const metrics = getAccountMetrics(acc);
                      
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50/50 transition-all group border-b border-slate-50 last:border-b-0">
                          <td className="py-5 pl-6 font-medium text-slate-600 text-sm">
                             {acc.nickname || '-'}
                          </td>
                          <td className="py-5 px-4 font-bold text-slate-800 text-sm">
                            {acc.name}
                          </td>
                          <td className="py-5 px-4 border-r border-slate-100 last:border-r-0">
                            <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border ${badgeStyle}`}>
                              {acc.type}
                            </span>
                          </td>
                          <td className="py-5 px-4 font-bold text-slate-900 text-sm text-right border-r border-slate-100 last:border-r-0">
                            {metrics.totalSpent > 0 ? `₹${metrics.totalSpent.toLocaleString()}` : <span className="text-slate-300">-</span>}
                          </td>
                          <td className="py-5 px-4 font-medium text-slate-600 text-xs text-right border-r border-slate-100 last:border-r-0">
                            {metrics.count > 0 ? `${metrics.count} txns` : <span className="text-slate-300">-</span>}
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
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountManager;