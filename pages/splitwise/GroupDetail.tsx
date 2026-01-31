import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage } from '../../services/storage';
import { SplitGroup, Person, GroupExpense } from '../../types';
import SidePopover from '../../components/SidePopover';
import { ICONS } from '../../constants';
// Add icons if ICONS doesn't have CheckCircle/ArrowRight, I will mock them or use generic svg.
// Actually checking constants first would be wise, but for now I'll use inline SVGs if needed or rely on ICONS 
// Update: ICONS likely has basic ones. I'll stick to ICONS.ChevronRight etc.
// Wait, I used ICONS.CheckCircle and ICONS.ArrowRight in my code above.
// I should verify if they exist in constants.
// I will check constants.tsx first basically.
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [group, setGroup] = useState<SplitGroup | null>(null);
  const [members, setMembers] = useState<Person[]>([]); // Subset of people who are in this group
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balances' | 'settings'>('expenses');
  const [searchTerm, setSearchTerm] = useState('');

  // Add Expense State
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  // We'll stick to equal split for MVP in this iteration as per complexity constraints,
  // but logic structure supports others.

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (groupId: string) => {
    try {
        const [allGroups, allPeople, groupExpenses] = await Promise.all([
            storage.getGroups(),
            storage.getPeople(),
            storage.getGroupExpenses(groupId)
        ]);
        
        const foundGroup = allGroups.find(g => g.id === groupId);
        if (!foundGroup) {
            addToast("Group not found", "error");
            navigate('/splitwise');
            return;
        }

        setGroup(foundGroup);
        // Filter people to only those in the group
        const groupMembers = allPeople.filter(p => foundGroup.memberIds.includes(p.id));
        setMembers(groupMembers);
        setExpenses(groupExpenses);
        
        // Defaults for form
        if (groupMembers.length > 0) {
            setPaidBy(groupMembers[0].id); // Default payer
            setParticipants(groupMembers.map(m => m.id)); // Default all included
        }

    } catch (e) {
        console.error(e);
        addToast("Error loading group details", "error");
    } finally {
        setLoading(false);
    }
  };

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const handleAddExpense = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!group || !title || !amount || !paidBy || participants.length === 0) {
          addToast("Please fill all fields and select participants", "error");
          return;
      }

      const expenseData: GroupExpense = {
          id: editingExpenseId || crypto.randomUUID(),
          groupId: group.id,
          title,
          amount: parseFloat(amount),
          date: editingExpenseId ? expenses.find(e => e.id === editingExpenseId)?.date || new Date().toISOString() : new Date().toISOString(),
          paidBy,
          participants,
          splitMethod: 'equal',
      };

      try {
          await storage.saveGroupExpense(expenseData);
          if (editingExpenseId) {
             setExpenses(prev => prev.map(e => e.id === editingExpenseId ? expenseData : e));
             addToast("Expense updated", "success");
          } else {
             setExpenses(prev => [expenseData, ...prev]);
             addToast("Expense added", "success");
          }
          setShowAdd(false);
          setEditingExpenseId(null);
          setTitle('');
          setAmount('');
      } catch (err) {
          addToast("Failed to save expense", "error");
      }
  };

  const handleEditExpense = (exp: GroupExpense) => {
      setEditingExpenseId(exp.id);
      setTitle(exp.title);
      setAmount(exp.amount.toString());
      setPaidBy(exp.paidBy);
      setParticipants(exp.participants);
      setShowAdd(true);
  };

  const handleDeleteExpense = async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this expense?")) return;
      try {
          await storage.deleteGroupExpense(id);
          setExpenses(prev => prev.filter(e => e.id !== id));
          addToast("Expense deleted", "success");
      } catch (e) {
          addToast("Failed to delete", "error");
      }
  };

  const toggleParticipant = (pid: string) => {
      setParticipants(prev => 
        prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid]
      );
  };

  // Manage Members State & Handlers
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);

  useEffect(() => {
     // Fetch all people once to populate the add modal
     storage.getPeople().then(setAllPeople);
  }, []);

  const openManageMembers = () => {
    if (group) {
        setEditMemberIds(group.memberIds);
        setShowManageMembers(true);
    }
  };

  const toggleEditMember = (pid: string) => {
    setEditMemberIds(prev => 
       prev.includes(pid) ? prev.filter(id => id !== pid) : [...prev, pid]
    );
  };

  const handleUpdateMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!group) return;

    const updatedGroup: SplitGroup = { ...group, memberIds: editMemberIds };
    try {
        await storage.saveGroup(updatedGroup);
        setGroup(updatedGroup);
        setMembers(allPeople.filter(p => editMemberIds.includes(p.id)));
        setShowManageMembers(false);
        addToast("Members updated", "success");
    } catch (e) {
        addToast("Failed member update", "error");
    }
  };

  // --- Derived Calculations ---
  
  const filteredExpenses = useMemo(() => {
      if (!searchTerm.trim()) return expenses;
      const lower = searchTerm.toLowerCase();
      return expenses.filter(e => 
        e.title.toLowerCase().includes(lower) || 
        e.amount.toString().includes(lower) ||
        members.find(m => m.id === e.paidBy)?.name.toLowerCase().includes(lower)
      );
  }, [expenses, searchTerm, members]);

  const totalGroupSpend = useMemo(() => {
      return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses]);

  const spendingByPerson = useMemo(() => {
      const map: Record<string, number> = {};
      expenses.forEach(exp => {
          map[exp.paidBy] = (map[exp.paidBy] || 0) + exp.amount;
      });
      return map;
  }, [expenses]);

  // --- Logic: Calculate Balances ---
  const balances = useMemo(() => {
      if (!group) return {};

      // Initialize map: personId -> netBalance (positive = owed, negative = owes)
      const bal: Record<string, number> = {};
      members.forEach(m => bal[m.id] = 0);

      expenses.forEach(exp => {
          const paidAmount = exp.amount;
          const payerId = exp.paidBy;
          
          // Add amount to payer (they are owed this much)
          bal[payerId] = (bal[payerId] || 0) + paidAmount;

          // Subtract fair share from each participant
          if (exp.splitMethod === 'equal') {
              const share = paidAmount / exp.participants.length;
              exp.participants.forEach(pid => {
                  bal[pid] = (bal[pid] || 0) - share;
              });
          }
      });

      return bal;
  }, [expenses, members, group]);

  // Generate simplest settlements (Greedy algorithm)
  const settlements = useMemo(() => {
      const debts: { from: string, to: string, amount: number }[] = [];
      
      // Clone balances to mutate
      const currentBalances = { ...balances };
      
      // Separate into lists
      let debtors = Object.entries(currentBalances).filter(([_, val]) => (val as number) < -0.01).sort((a,b) => (a[1] as number) - (b[1] as number)); 
      let creditors = Object.entries(currentBalances).filter(([_, val]) => (val as number) > 0.01).sort((a,b) => (b[1] as number) - (a[1] as number));

      let i = 0; // Debtor ptr
      let j = 0; // Creditor ptr

      while (i < debtors.length && j < creditors.length) {
          const [debtorId, val1] = debtors[i];
          const [creditorId, val2] = creditors[j];
          const debtAmount = val1 as number;
          const creditAmount = val2 as number;

          // Amount to settle is min of |debt| and credit
          const settleAmount = Math.min(Math.abs(debtAmount), creditAmount);
          
          // Record settlement
          debts.push({ from: debtorId, to: creditorId, amount: settleAmount });

          // Update remaining
          const remainingDebt = debtAmount + settleAmount;
          const remainingCredit = creditAmount - settleAmount;

          if (Math.abs(remainingDebt) < 0.01) {
              i++; // Debtor cleared
          } else {
              debtors[i] = [debtorId, remainingDebt];
          }

          if (Math.abs(remainingCredit) < 0.01) {
              j++; // Creditor cleared
          } else {
              creditors[j] = [creditorId, remainingCredit];
          }
      }

      return debts;
  }, [balances]);

  if (loading) return <div className="p-8"><div className="h-10 w-48 skeleton rounded mb-8"></div></div>;
  if (!group) return <div>Group not found</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-8">
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <button onClick={() => navigate('/splitwise')} className="text-xs text-slate-400 font-bold mb-2 hover:text-indigo-600 flex items-center gap-1">
             <ICONS.ChevronRight className="w-3 h-3 rotate-180" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">{group.name}</h1>
          <p className="text-slate-500 font-bold mt-1 text-xs uppercase tracking-wider">{expenses.length} expenses • {members.length} members</p>
        </div>
        <div className="flex gap-4">
             <button onClick={() => setShowAdd(true)} className="btn-primary shadow-indigo-200 !px-8">
                <ICONS.Plus className="w-4 h-4 mr-2" />
                <span className="text-[10px] uppercase tracking-widest">Add Expense</span>
             </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('expenses')}
            className={`px-6 py-3 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === 'expenses' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              Expenses
          </button>
          <button 
             onClick={() => setActiveTab('balances')}
             className={`px-6 py-3 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === 'balances' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              Balances
          </button>
          <button 
             onClick={() => setActiveTab('settings')}
             className={`px-6 py-3 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              Settings
          </button>
      </div>

      {activeTab === 'expenses' ? (
          <div className="space-y-6">
              <div className="relative">
                  <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search expenses..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-colors shadow-sm"
                  />
              </div>

              {filteredExpenses.length === 0 ? (
                  <div className="py-20 text-center text-slate-400">
                      <p className="font-bold text-sm">No expenses found.</p>
                  </div>
              ) : (
                  filteredExpenses.map(exp => {
                      const payer = members.find(m => m.id === exp.paidBy);
                      const dateObj = new Date(exp.date);
                      const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
                      const day = dateObj.getDate();
                      const year = dateObj.getFullYear();
                      
                      return (
                          <div key={exp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-slate-500">
                                      <span className="text-[10px] font-black uppercase text-slate-400 leading-none">{month}</span>
                                      <span className="text-lg font-black text-slate-900 leading-tight">{day}</span>
                                      <span className="text-[9px] font-bold text-slate-400 leading-none">{year}</span>
                                  </div>
                                  <div>
                                      <h3 className="text-base font-black text-slate-900">{exp.title}</h3>
                                      <div className="flex items-center gap-2 mt-1">
                                          <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${members.find(m => m.id === exp.paidBy)?.id ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                              {payer?.name} paid {formatCurrency(exp.amount)}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                              <div className="text-right">
                                   <div className="text-lg font-black text-slate-900 mb-1">{formatCurrency(exp.amount)}</div>
                                   <div className="flex justify-end gap-2 mb-2">
                                       <button onClick={() => handleEditExpense(exp)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded">
                                           <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                       </button>
                                       <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded">
                                           <ICONS.Trash className="w-3.5 h-3.5" />
                                       </button>
                                   </div>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Split</p>
                                   <div className="flex -space-x-1.5 justify-end">
                                      {exp.participants.map(pid => {
                                          const p = members.find(m => m.id === pid);
                                          return (
                                              <div key={pid} className="w-6 h-6 rounded-full border border-white bg-slate-200 overflow-hidden" title={p?.name}>
                                                  <img src={p?.avatar} className="w-full h-full" alt="" />
                                              </div>
                                          )
                                      })}
                                   </div>
                              </div>
                          </div>
                      );
                  })
              )}
          </div>
      ) : activeTab === 'settings' ? (
          <div className="space-y-8">
               {/* ... Settings Content remains same ... */}
               {/* 1. Group Details */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-6">Group Settings</h3>
                   <div className="flex gap-4 items-end">
                       <div className="flex-1">
                           <label className="label-professional">Group Name</label>
                           <input 
                               type="text" 
                               value={group.name} 
                               onChange={(e) => {
                                   const newName = e.target.value;
                                   setGroup(prev => prev ? { ...prev, name: newName } : null);
                               }}
                               className="input-professional"
                           />
                       </div>
                       <button 
                           onClick={async () => {
                               if (group) {
                                   await storage.saveGroup(group);
                                   addToast("Group updated", "success");
                               }
                           }}
                           className="btn-primary !py-3 bg-slate-900 shadow-slate-200"
                       >
                           Save Name
                       </button>
                   </div>
               </div>

               {/* 2. Manage Members */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Manage Members</h3>
                       <button onClick={openManageMembers} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                           + Add / Remove Friends
                       </button>
                   </div>
                   <div className="space-y-4">
                       {members.map(m => (
                           <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                               <div className="flex items-center gap-3">
                                   <img src={m.avatar} className="w-8 h-8 rounded-full bg-white border border-slate-200" />
                                   <div>
                                       <p className="font-bold text-slate-900 text-sm">{m.name}</p>
                                       <p className="text-[10px] text-slate-500 font-bold">{m.email}</p>
                                   </div>
                               </div>
                               <button 
                                   onClick={async () => {
                                        if (window.confirm(`Remove ${m.name} from group?`)) {
                                            const newIds = group.memberIds.filter(id => id !== m.id);
                                            const updated = { ...group, memberIds: newIds };
                                            await storage.saveGroup(updated);
                                            setGroup(updated);
                                            setMembers(prev => prev.filter(pm => pm.id !== m.id));
                                            addToast("Member removed", "success");
                                        }
                                   }}
                                   className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg"
                               >
                                   <ICONS.Trash className="w-4 h-4" />
                               </button>
                           </div>
                       ))}
                   </div>
               </div>

               {/* 3. Danger Zone */}
               <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                   <h3 className="text-sm font-black text-rose-700 uppercase tracking-wider mb-2">Danger Zone</h3>
                   <p className="text-xs text-rose-600 mb-6 font-medium">Deleting a group is permanent and will remove all associated expenses history.</p>
                   
                   <button 
                       onClick={async () => {
                           if (window.confirm("Are you sure you want to DELETE this group? This cannot be undone.")) {
                               await storage.deleteGroup(group.id);
                               // Ideally select all expenses and delete them too, but for now we orphan them or batch delete later
                               addToast("Group deleted", "success");
                               navigate('/splitwise');
                           }
                       }}
                       className="w-full py-4 rounded-xl border-2 border-rose-200 text-rose-600 font-black uppercase text-xs tracking-widest hover:bg-rose-600 hover:text-white transition-all"
                   >
                       Delete Group
                   </button>
               </div>
          </div>
      ) : (
          <div className="space-y-8">
              {/* Spending Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Modern Total Spend Card */}
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <ICONS.Chart className="w-24 h-24 text-indigo-600 rotate-12" />
                       </div>
                       <div className="relative z-10">
                           <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Group Spending</p>
                           <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
                               {formatCurrency(totalGroupSpend).split('.')[0]}<span className="text-xl text-slate-400">.{formatCurrency(totalGroupSpend).split('.')[1]}</span>
                           </h2>
                           <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                               <span className="text-[10px] font-black uppercase tracking-wide">All time tracked</span>
                           </div>
                       </div>
                   </div>

                   {/* Enhanced Spending by Person */}
                   <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                       <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Top Spenders</h3>
                       <div className="space-y-4">
                           {Object.entries(spendingByPerson).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([pid, amt]) => {
                               const person = members.find(m => m.id === pid);
                               const percentage = totalGroupSpend > 0 ? (amt / totalGroupSpend) * 100 : 0;
                               return (
                                   <div key={pid} className="group">
                                       <div className="flex justify-between items-end mb-1">
                                           <div className="flex items-center gap-2">
                                               <img src={person?.avatar} className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100" />
                                               <span className="text-xs font-bold text-slate-700">{person?.name}</span>
                                           </div>
                                           <span className="text-xs font-black text-slate-900">{formatCurrency(amt)}</span>
                                       </div>
                                       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                           <div className="h-full bg-indigo-500 rounded-full transition-all duration-500 group-hover:bg-indigo-600" style={{ width: `${percentage}%` }}></div>
                                       </div>
                                   </div>
                               );
                           })}
                           {Object.keys(spendingByPerson).length === 0 && <p className="text-xs text-slate-400 italic">No spending yet.</p>}
                       </div>
                   </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Member Balances */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Net Balances</h3>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">Who owes what in total</p>
                      </div>
                      <div className="divide-y divide-slate-50">
                          {members.map(m => {
                              const bal = balances[m.id] || 0;
                              const isZero = Math.abs(bal) < 0.01;
                              return (
                                  <div key={m.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                      <div className="flex items-center gap-3">
                                          <img src={m.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                          <div>
                                              <p className="font-bold text-slate-700 text-sm">{m.name}</p>
                                          </div>
                                      </div>
                                      <div className="text-right">
                                          {isZero ? (
                                              <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-wider">Settled</span>
                                          ) : bal > 0 ? (
                                              <div>
                                                  <p className="text-[10px] uppercase font-bold text-emerald-600 mb-0.5">Gets back</p>
                                                  <p className="text-sm font-black text-emerald-600">{formatCurrency(bal)}</p>
                                              </div>
                                          ) : (
                                              <div>
                                                  <p className="text-[10px] uppercase font-bold text-rose-500 mb-0.5">Owes</p>
                                                  <p className="text-sm font-black text-rose-500">{formatCurrency(Math.abs(bal))}</p>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  </div>

                  {/* Settlement Plan */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                       <div className="p-6 border-b border-slate-200 bg-white">
                           <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Settlement Plan</h3>
                           <p className="text-[10px] text-slate-500 font-bold mt-1">Recommended way to settle up</p>
                       </div>
                       <div className="p-6 space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                           {settlements.length === 0 ? (
                               <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-50">
                                   <ICONS.CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                                   <p className="text-sm font-black text-slate-900">All Settled Up!</p>
                                   <p className="text-xs text-slate-500">No debts remaining.</p>
                               </div>
                           ) : (
                               settlements.map((s, idx) => {
                                   const from = members.find(m => m.id === s.from);
                                   const to = members.find(m => m.id === s.to);
                                   return (
                                       <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-colors">
                                           <div className="flex items-center gap-3">
                                               <div className="relative">
                                                   <img src={from?.avatar} className="w-8 h-8 rounded-full border border-slate-100" />
                                                   <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-slate-100">
                                                        <ICONS.ArrowRight className="w-3 h-3 text-slate-400" />
                                                   </div>
                                               </div>
                                               <div className="flex flex-col">
                                                   <span className="text-xs font-bold text-slate-900">{from?.name}</span>
                                                   <span className="text-[10px] font-bold text-slate-400">pays {to?.name}</span>
                                               </div>
                                           </div>
                                           <div className="bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                                                <span className="text-xs font-black text-indigo-700">{formatCurrency(s.amount)}</span>
                                           </div>
                                       </div>
                                   )
                               })
                           )}
                       </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add Expenses Modal */}
      <SidePopover
        isOpen={showAdd}
        onClose={() => {
            setShowAdd(false);
            setEditingExpenseId(null);
            setTitle('');
            setAmount('');
            if (members.length > 0) {
                 setPaidBy(members[0].id);
                 setParticipants(members.map(m => m.id));
            }
        }}
        title={editingExpenseId ? "Edit Expense" : "Add Group Expense"}
        subtitle={editingExpenseId ? "Update expense details" : "Split equally between selected members"}
      >
           <form onSubmit={handleAddExpense} className="space-y-6">
                <div>
                    <label className="label-professional">Description</label>
                    <input 
                        value={title} onChange={e => setTitle(e.target.value)}
                        className="input-professional" placeholder="e.g. Dinner at Ritz" required
                    />
                </div>
                <div>
                     <label className="label-professional">Amount</label>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input 
                           type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                           className="input-professional !pl-10" placeholder="0.00" required
                        />
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label className="label-professional">Paid By</label>
                         <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="input-professional" required>
                             <option value="" disabled>Select Payer</option>
                             {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                         </select>
                     </div>
                     <div>
                         <label className="label-professional">Split</label>
                         <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-500">
                             Equally ({participants.length})
                         </div>
                     </div>
                </div>

                <div>
                    <label className="label-professional">Split Among</label>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                         {members.map(m => (
                             <div 
                                key={m.id} 
                                onClick={() => toggleParticipant(m.id)}
                                className={`flex items-center gap-3 p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${participants.includes(m.id) ? 'bg-indigo-50/50' : ''}`}
                             >
                                 <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${participants.includes(m.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                                     {participants.includes(m.id) && <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                 </div>
                                 <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900">{m.name}</p>
                                    <p className="text-[10px] text-slate-500">{m.email}</p>
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>

                <div className="pt-8 flex gap-4">
                     <button type="button" onClick={() => setShowAdd(false)} className="flex-1 btn-secondary !py-4 uppercase tracking-widest text-[10px]">Cancel</button>
                     <button type="submit" disabled={!title || !amount || participants.length === 0} className="flex-1 btn-primary !py-4 uppercase tracking-widest text-[10px] shadow-indigo-200">
                        {editingExpenseId ? 'Update Expense' : 'Record Expense'}
                    </button>
                </div>
           </form>
      </SidePopover>

      {/* Manage Members Modal */}
      <SidePopover
        isOpen={showManageMembers}
        onClose={() => setShowManageMembers(false)}
        title="Manage Members"
        subtitle="Add more friends from your global list"
      >
          <form onSubmit={handleUpdateMembers} className="space-y-6">
                 <div>
                    <label className="label-professional">Select Friends</label>
                    <div className="border border-slate-200 rounded-xl overflow-hidden max-h-80 overflow-y-auto custom-scrollbar">
                         {allPeople.length === 0 && <div className="p-4 text-xs text-slate-400 text-center">No friends found in directory.</div>}
                         {allPeople.map(p => (
                             <div 
                                key={p.id} 
                                onClick={() => toggleEditMember(p.id)}
                                className={`flex items-center gap-3 p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${editMemberIds.includes(p.id) ? 'bg-indigo-50/50' : ''}`}
                             >
                                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${editMemberIds.includes(p.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                                     {editMemberIds.includes(p.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                 </div>
                                 <div className="flex-1">
                                     <p className="text-sm font-bold text-slate-900">{p.name}</p>
                                     <p className="text-[10px] text-slate-400 font-semibold">{p.email}</p>
                                 </div>
                             </div>
                         ))}
                     </div>
                     <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider text-right">
                         {editMemberIds.length} selected
                     </p>
                </div>
                <div className="pt-8 flex gap-4">
                     <button type="button" onClick={() => setShowManageMembers(false)} className="flex-1 btn-secondary !py-4 uppercase tracking-widest text-[10px]">Cancel</button>
                     <button type="submit" className="flex-1 btn-primary !py-4 uppercase tracking-widest text-[10px] shadow-indigo-200">
                        Update Members
                    </button>
                </div>
          </form>
      </SidePopover>
    </div>
  );
};

export default GroupDetail;
