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
        // Fetch expenses for all groups in parallel (Not ideal for large scale, but fine for personal app)
        const expensesPromises = fetchedGroups.map(g => storage.getGroupExpenses(g.id));
        const expensesResults = await Promise.all(expensesPromises);
        
        let owed = 0;
        let debt = 0;

        expensesResults.forEach((groupExpenses, index) => {
             const group = fetchedGroups[index];
             allExpenses = [...allExpenses, ...groupExpenses];

             // Mock calculation for "Me" (Assuming user maps to one of the people? 
             // LIMITATION: We don't have a "Me" person concept linked to Auth yet properly in Splitwise module.
             // We will assume simpler logic: Just show raw totals of group spend for now, 
             // Or we just show the group summary. 
             // To properly show "You Owe", we need to know who "You" are in the context of these People.
             // For now, we will skip the specific "My Debt" calculation to avoid confusion until "Me-linking" is built.
             // Instead, we will show "Total Group Spend" across all groups.
        });

        // Use total spend for now to populate cards with *something* useful
        const totalSpend = allExpenses.reduce((sum, e) => sum + e.amount, 0);
        setTotalOwed(totalSpend); // Re-purposing card for "Total Tracked"

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto space-y-8">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Splitwise Dashboard</h1>
          <p className="text-slate-500 font-bold mt-1 text-xs uppercase tracking-wider">Overview of shared expenses</p>
        </div>
        <div>
             <button onClick={() => setShowAdd(true)} className="btn-primary shadow-indigo-200">
                <ICONS.Plus className="w-4 h-4 mr-2" />
                <span className="text-[10px] uppercase tracking-widest">New Group</span>
             </button>
        </div>
      </div>

      {groups.length === 0 ? (
          // Empty State User Guide - Minimal & Professional
          <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-sm">
              <div className="max-w-2xl">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6">
                      <ICONS.Users className="w-6 h-6 text-slate-700" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-4">Welcome to Splitwise</h2>
                  <p className="text-slate-500 text-lg font-medium mb-8 leading-relaxed">
                      The professional way to track shared expenses and settle debts. 
                      Streamline your group finances for trips, office events, or shared living.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                          <h3 className="font-bold text-slate-900 mb-1 text-sm">1. Add Friends</h3>
                          <p className="text-xs text-slate-500">Build your contact list.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                          <h3 className="font-bold text-slate-900 mb-1 text-sm">2. Create Group</h3>
                          <p className="text-xs text-slate-500">Organize expenses by event.</p>
                      </div>
                      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                          <h3 className="font-bold text-slate-900 mb-1 text-sm">3. Settle Up</h3>
                          <p className="text-xs text-slate-500">Track balances instantly.</p>
                      </div>
                  </div>

                  <button onClick={() => setShowAdd(true)} className="btn-primary shadow-slate-200">
                      Create First Group
                  </button>
              </div>
          </div>
      ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card-professional p-6 bg-white border-slate-200 flex flex-col justify-between h-full">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Tracked Volume</p>
                        <h3 className="text-3xl font-black text-slate-900">{formatCurrency(totalOwed)}</h3>
                        <p className="text-xs text-slate-400 font-bold mt-2">Across {groups.length} active groups</p>
                    </div>
                </div>
                 {/* Recent Activity Feed */}
                 <div className="card-professional p-6 bg-white border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Activity</p>
                    </div>
                    {recentExpenses.length === 0 ? (
                        <p className="text-xs font-bold text-slate-400 text-center py-6">No recent expenses</p>
                    ) : (
                        <div className="space-y-3">
                            {recentExpenses.map(exp => {
                                const group = groups.find(g => g.id === exp.groupId);
                                const payer = people.find(p => p.id === exp.paidBy);
                                return (
                                    <div key={exp.id} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                                <ICONS.Expense className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 line-clamp-1">{exp.title}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{group?.name} • {payer?.name} paid</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black text-slate-900">{formatCurrency(exp.amount)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                 </div>
            </div>

            {/* Groups Grid */}
            <div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4">Your Groups</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {groups.map(g => (
                            <div 
                                key={g.id} 
                                onClick={() => navigate(`/splitwise/group/${g.id}`)}
                                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group relative"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        {g.name[0]}
                                    </div>
                                    <div className="flex -space-x-2">
                                        {g.memberIds.slice(0, 3).map(mid => {
                                            const p = people.find(person => person.id === mid);
                                            return (
                                                <div key={mid} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden" title={p?.name}>
                                                    <img src={p?.avatar || `https://ui-avatars.com/api/?name=${p?.name}`} alt="" className="w-full h-full" />
                                                </div>
                                            )
                                        })}
                                        {g.memberIds.length > 3 && (
                                            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-500">
                                                +{g.memberIds.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{g.name}</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">{g.memberIds.length} members</p>
                            </div>
                        ))}
                </div>
            </div>
          </>
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
