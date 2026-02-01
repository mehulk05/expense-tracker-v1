import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { storage } from '../../services/storage';
import { SplitGroup, Person, GroupExpense } from '../../types';
import SidePopover from '../../components/SidePopover';
import { ICONS } from '../../constants';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

const SplitDashboard: React.FC = () => {
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<GroupExpense[]>([]);
  const [totalOwed, setTotalOwed] = useState(0); // You are owed
  const [totalDebt, setTotalDebt] = useState(0); // You owe
  const [netBalance, setNetBalance] = useState(0);
  const [topGroup, setTopGroup] = useState<{name: string, total: number} | null>(null);
  const [groupBalances, setGroupBalances] = useState<{ id: string; name: string; owed: number; debt: number }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Create Group Form
  const [groupName, setGroupName] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
        const [fetchedGroups, fetchedPeople] = await Promise.all([
            storage.getGroups(),
            storage.getPeople()
        ]);
        setGroups(fetchedGroups);
        setPeople(fetchedPeople);

        // Compute Totals & Recents
        let allExpenses: GroupExpense[] = [];
        const expensesPromises = fetchedGroups.map(g => storage.getGroupExpenses(g.id));
        const expensesResults = await Promise.all(expensesPromises);
        
        let calculatedOwed = 0; 
        let calculatedDebt = 0;
        let maxGroupTotal = 0;
        let maxGroup: {name: string, total: number} | null = null;
        const balancesMap: Record<string, { id: string; name: string; owed: number; debt: number }> = {};

        const user = auth.currentUser;
        const me = fetchedPeople.find(p => p.email === user?.email || p.name === user?.displayName || p.name === 'Me');

        expensesResults.forEach((groupExpenses, index) => {
             const group = fetchedGroups[index];
             allExpenses = [...allExpenses, ...groupExpenses];

             // Initialize group balance
             if (!balancesMap[group.id]) {
                 balancesMap[group.id] = { id: group.id, name: group.name, owed: 0, debt: 0 };
             }

             const groupTotal = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
             if (groupTotal > maxGroupTotal) {
                 maxGroupTotal = groupTotal;
                 maxGroup = { name: group.name, total: groupTotal };
             }

             groupExpenses.forEach(exp => {
                 if (!me) return;
                 const isPayer = exp.paidBy === me.id;
                 const isInvolved = exp.participants.includes(me.id);
                 const splitAmount = exp.amount / (exp.participants.length || 1);

                 if (isPayer) {
                     const myShare = isInvolved ? splitAmount : 0;
                     const owedAmount = exp.amount - myShare;
                     calculatedOwed += owedAmount;
                     balancesMap[group.id].owed += owedAmount;
                 } else if (isInvolved) {
                     calculatedDebt += splitAmount;
                     balancesMap[group.id].debt += splitAmount;
                 }
             });
        });

        setTotalOwed(calculatedOwed);
        setTotalDebt(calculatedDebt);
        setNetBalance(calculatedOwed - calculatedDebt);
        setTopGroup(maxGroup);
        setGroupBalances(Object.values(balancesMap));

        // Sort by date desc
        setRecentExpenses(allExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
        
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!groupName) return;

      const user = auth.currentUser;
      let finalMemberIds = [...selectedMembers];

      // Auto-add current user if logged in
      if (user) {
          // Check if "Me" person exists by email or uid
          const mePerson = people.find(p => p.email === user.email || p.name === user.displayName);
          
          let meId: string;

          if (mePerson) {
              meId = mePerson.id;
          } else {
              // Create "Me" entry if missing
              const newMe: Person = {
                  id: crypto.randomUUID(),
                  name: user.displayName || 'Me',
                  email: user.email || undefined,
                  avatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'Me'}&background=random`
              };
              await storage.savePerson(newMe);
              setPeople(prev => [...prev, newMe]); // Update local state
              meId = newMe.id;
          }

          if (!finalMemberIds.includes(meId)) {
              finalMemberIds.push(meId);
          }
      }

      const newGroup: SplitGroup = {
          id: crypto.randomUUID(),
          name: groupName,
          currency,
          memberIds: finalMemberIds,
          createdAt: new Date().toISOString()
      };

      try {
          await storage.saveGroup(newGroup);
          setGroups(prev => [newGroup, ...prev]);
          addToast('Group created successfully', 'success');
          setShowAdd(false);
          setGroupName('');
          setSelectedMembers([]);
      } catch (error) {
          addToast('Failed to create group', 'error');
      }
  };

  const toggleMember = (id: string) => {
      setSelectedMembers(prev => 
        prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
      );
  };

  if (loading) return <div className="p-8"><div className="h-10 w-48 skeleton rounded mb-8"></div></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto space-y-10 pb-20">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Splitwise Dashboard</h1>
          <p className="text-slate-500 font-bold mt-1 text-xs uppercase tracking-wider">Financial Overview & Settle Up</p>
        </div>
        <div>
             <button onClick={() => setShowAdd(true)} className="btn-primary shadow-indigo-200">
                <ICONS.Plus className="w-4 h-4 mr-2" />
                <span className="text-[10px] uppercase tracking-widest">New Group</span>
             </button>
        </div>
      </div>

      {groups.length === 0 ? (
          // Empty State (Kept same as before but minimal edit for context)
          <div className="bg-white border border-slate-200 rounded-2xl p-12 shadow-sm text-center">
               {/* ... (reusing exact previous empty state content logic implicitly or explicitly) */}
               {/* Simplified for brevity in this replace, assuming user wants the new layout mainly. I'll paste the full empty state back to be safe */}
              <div className="max-w-2xl mx-auto text-left">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                      <ICONS.Users className="w-6 h-6 text-slate-700" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-4">Welcome to Splitwise</h2>
                  <p className="text-slate-500 text-lg font-medium mb-8 leading-relaxed">
                      The professional way to track shared expenses and settle debts. 
                      Streamline your group finances for trips, office events, or shared living.
                  </p>
                  <button onClick={() => setShowAdd(true)} className="btn-primary shadow-slate-200">
                      Create First Group
                  </button>
              </div>
          </div>
      ) : (
          <div className="space-y-10">
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Owed Card */}
                <div className="relative overflow-hidden card-professional p-8 bg-white border-slate-200 flex flex-col justify-between group hover:border-emerald-200 hover:shadow-emerald-50/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <div className="w-24 h-24 rounded-full bg-emerald-500 blur-2xl"></div>
                    </div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">You are owed</p>
                            <div className="flex items-center gap-3">
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{formatCurrency(totalOwed)}</h3>
                                {totalOwed > 0 && (
                                    <div className="px-2 py-1 bg-emerald-50 rounded-lg flex items-center gap-1">
                                        <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </div>
                    </div>
                </div>

                 {/* Debt Card */}
                <div className="relative overflow-hidden card-professional p-8 bg-white border-slate-200 flex flex-col justify-between group hover:border-rose-200 hover:shadow-rose-50/50 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <div className="w-24 h-24 rounded-full bg-rose-500 blur-2xl"></div>
                    </div>
                    <div className="relative z-10 flex justify-between items-start">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">You owe</p>
                            <div className="flex items-center gap-3">
                                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{formatCurrency(totalDebt)}</h3>
                                {totalDebt > 0 && (
                                    <div className="px-2 py-1 bg-rose-50 rounded-lg flex items-center gap-1">
                                        <svg className="w-3 h-3 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                        </div>
                    </div>
                </div>

                 {/* Net Position Card */}
                <div className="relative overflow-hidden card-professional p-8 bg-white border-slate-200 flex flex-col justify-between group hover:border-indigo-200 hover:shadow-indigo-50/50 transition-all">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <div className={`w-24 h-24 rounded-full blur-2xl ${netBalance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    </div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Net Position</p>
                            <div className="flex items-center gap-3">
                                <h3 className="text-4xl font-black tracking-tight text-slate-900">
                                    {formatCurrency(Math.abs(netBalance))}
                                </h3>
                                {netBalance !== 0 && (
                                     <div className={`px-2 py-1 rounded-lg flex items-center gap-1 ${netBalance >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                        {netBalance >= 0 ? (
                                            <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                        ) : (
                                            <svg className="w-3 h-3 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                         <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center">
                            <ICONS.Expense className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Groups Grid with Header */}
             <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Your Groups</h2>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{groups.length} active</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {groups.map(g => (
                            <div 
                                key={g.id} 
                                onClick={() => navigate(`/splitwise/group/${g.id}`)}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group relative"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-800 flex items-center justify-center font-black text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-inner">
                                        {g.name[0]}
                                    </div>
                                    <div className="flex -space-x-3">
                                        {g.memberIds.slice(0, 3).map(mid => {
                                            const p = people.find(person => person.id === mid);
                                            return (
                                                <div key={mid} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden shadow-sm" title={p?.name}>
                                                    <img src={p?.avatar || `https://ui-avatars.com/api/?name=${p?.name}`} alt="" className="w-full h-full" />
                                                </div>
                                            )
                                        })}
                                        {g.memberIds.length > 3 && (
                                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500 shadow-sm">
                                                +{g.memberIds.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{g.name}</h3>
                                    <p className="text-xs font-semibold text-slate-400">{g.memberIds.length} members</p>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Breakdown Cards Row (New Request) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Receivables Breakdown */}
                 <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                     <div className="flex items-center gap-4 mb-8">
                         <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                         </div>
                         <div>
                            <h3 className="text-xl font-black text-slate-900">Receivables</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Money owed to you</p>
                         </div>
                     </div>
                     <div className="space-y-4">
                         {groupBalances.filter(b => b.owed > 0).length > 0 ? (
                             groupBalances.filter(b => b.owed > 0).map(b => (
                                 <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-md transition-all cursor-default">
                                     <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-sm font-black text-slate-700">
                                             {b.name[0]}
                                         </div>
                                         <span className="font-bold text-slate-700">{b.name}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <span className="text-slate-900 font-black">{formatCurrency(b.owed)}</span>
                                         <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                         </div>
                                     </div>
                                 </div>
                             ))
                         ) : (
                             <div className="text-center py-10 opacity-50">
                                 <p className="text-sm font-bold text-slate-400">You are all settled up!</p>
                             </div>
                         )}
                     </div>
                 </div>

                 {/* Payables Breakdown */}
                 <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                     <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-5 transition-opacity">
                         <div className="w-32 h-32 rounded-full bg-rose-500 blur-3xl"></div>
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Payables</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Money you owe</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {groupBalances.filter(b => b.debt > 0).length > 0 ? (
                                groupBalances.filter(b => b.debt > 0).map(b => (
                                    <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-rose-100 hover:bg-rose-50/30 transition-all cursor-default shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-sm font-black text-slate-700">
                                                {b.name[0]}
                                            </div>
                                            <span className="font-bold text-slate-700">{b.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-900 font-black">{formatCurrency(b.debt)}</span>
                                            <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center">
                                                <svg className="w-3 h-3 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                ))
                         ) : (
                             <div className="text-center py-10 opacity-50">
                                 <p className="text-sm font-bold text-slate-400">No debts pending!</p>
                             </div>
                         )}
                     </div>
                 </div>
                 </div>
            </div>

            {/* Recent Activity Full Width */}
             <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                     <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Recent Activity</h3>
                     </div>
                 </div>
                 {recentExpenses.length === 0 ? (
                     <p className="text-sm font-bold text-slate-400 text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">No recent transactions to populate feed.</p>
                 ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {recentExpenses.map(exp => {
                             const group = groups.find(g => g.id === exp.groupId);
                             const payer = people.find(p => p.id === exp.paidBy);
                             return (
                                 <div key={exp.id} className="flex flex-col p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                                     <div className="flex justify-between items-start mb-3">
                                         <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                                             <ICONS.Expense className="w-5 h-5" />
                                         </div>
                                         <span className="text-sm font-black text-slate-900 bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{formatCurrency(exp.amount)}</span>
                                     </div>
                                     <div>
                                         <p className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">{exp.title}</p>
                                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{group?.name}</p>
                                         <p className="text-[10px] text-slate-400 mt-1">Paid by {payer?.name}</p>
                                     </div>
                                 </div>
                             )
                         })}
                     </div>
                 )}
             </div>

          </div>
      )}

       <SidePopover
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Create New Group"
        subtitle="Start tracking shared expenses"
      >
        <form onSubmit={handleCreateGroup} className="space-y-6">
            <div>
                <label className="label-professional">Group Name</label>
                <input 
                    type="text" 
                    value={groupName} 
                    onChange={e => setGroupName(e.target.value)}
                    required
                    className="input-professional"
                    placeholder="e.g. Goa Trip 2026"
                />
            </div>
            
            <div>
                 <label className="label-professional">Select Members</label>
                 <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                     {people.length === 0 && <div className="p-4 text-xs text-slate-400 text-center">No friends found. Add friends first!</div>}
                     {people.map(p => (
                         <div 
                            key={p.id} 
                            onClick={() => toggleMember(p.id)}
                            className={`flex items-center gap-3 p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${selectedMembers.includes(p.id) ? 'bg-indigo-50/50' : ''}`}
                         >
                             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedMembers.includes(p.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                                 {selectedMembers.includes(p.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                             </div>
                             <div className="flex-1">
                                 <p className="text-sm font-bold text-slate-900">{p.name}</p>
                                 <p className="text-[10px] text-slate-400 font-semibold">{p.email}</p>
                             </div>
                         </div>
                     ))}
                 </div>
                 <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider text-right">
                     {selectedMembers.length} selected
                 </p>
            </div>

            <div className="pt-8 flex gap-4">
                 <button type="button" onClick={() => setShowAdd(false)} className="flex-1 btn-secondary !py-4 uppercase tracking-widest text-[10px]">Cancel</button>
                 <button type="submit" disabled={!groupName} className="flex-1 btn-primary !py-4 uppercase tracking-widest text-[10px] shadow-indigo-200">
                    Create Group
                </button>
            </div>
        </form>
      </SidePopover>
    </div>
  );
};

export default SplitDashboard;
