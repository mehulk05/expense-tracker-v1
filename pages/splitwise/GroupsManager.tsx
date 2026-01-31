import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../services/firebase';
import { storage } from '../../services/storage';
import { SplitGroup, Person } from '../../types';
import SidePopover from '../../components/SidePopover';
import { ICONS } from '../../constants';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/currency';

const GroupsManager: React.FC = () => {
  const [groups, setGroups] = useState<SplitGroup[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Create/Edit State
  const [showAdd, setShowAdd] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
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
    } catch (e) {
        console.error(e);
        addToast("Failed to load groups", "error");
    } finally {
        setLoading(false);
    }
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!groupName) return;

      const user = auth.currentUser;
      let finalMemberIds = [...selectedMembers];

      if (!editingGroupId && user) {
          // Only auto-add 'Me' on creation, not editing (unless logic dictates otherwise)
          // Actually, preserving 'Me' logic is good, but for edit we typically just modify name/members
          // For MVP Edit, we will just allow Name change. Member management is complex in "Quick Edit".
          // Better: Use same logic.
          
          const mePerson = people.find(p => p.email === user.email || p.name === user.displayName);
          let meId = mePerson ? mePerson.id : '';
          
          if (!meId) {
             const newMe: Person = {
                  id: crypto.randomUUID(),
                  name: user.displayName || 'Me',
                  email: user.email || undefined,
                  avatar: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'Me'}&background=random`
             };
             await storage.savePerson(newMe);
             setPeople(prev => [...prev, newMe]);
             meId = newMe.id;
          }
           if (!finalMemberIds.includes(meId)) {
              finalMemberIds.push(meId);
          }
      }

      // Detect removed members
      if (editingGroupId && existingGroup) {
          const removedMemberIds = existingGroup.memberIds.filter(id => !finalMemberIds.includes(id));
          
          if (removedMemberIds.length > 0) {
              try {
                  setLoading(true);
                  const groupExpenses = await storage.getGroupExpenses(editingGroupId);
                  
                  // Find expenses where removed members are involved
                  const conflictingExpenses = groupExpenses.filter(exp => 
                      removedMemberIds.includes(exp.paidBy) || 
                      exp.participants.some(p => removedMemberIds.includes(p))
                  );

                  if (conflictingExpenses.length > 0) {
                      alert(
                          `⛔ Operation Blocked\n\nThe members you are trying to remove are part of ${conflictingExpenses.length} active transactions in this group.\n\nPlease delete those transactions first if you really need to remove these members.`
                      );
                      setLoading(false);
                      return;
                  }
              } catch (e) {
                  console.error(e);
                  addToast("Error validating member removal", "error");
                  setLoading(false);
                  return;
              } finally {
                  setLoading(false);
              }
          }
      }

      const groupData: SplitGroup = {
          id: editingGroupId || crypto.randomUUID(),
          name: groupName,
          currency: existingGroup?.currency || currency,
          memberIds: finalMemberIds, // Fixed: Use the updated members list
          createdAt: existingGroup?.createdAt || new Date().toISOString()
      };

      try {
          await storage.saveGroup(groupData);
          if (editingGroupId) {
              setGroups(prev => prev.map(g => g.id === editingGroupId ? groupData : g));
              addToast('Group updated successfully', 'success');
          } else {
              setGroups(prev => [groupData, ...prev]);
              addToast('Group created successfully', 'success');
          }
          closeModal();
      } catch (error) {
          addToast('Failed to save group', 'error');
      }
  };

  const handleDeleteGroup = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent row click
      if (!window.confirm("Are you sure you want to delete this group?")) return;
      try {
          await storage.deleteGroup(id);
          setGroups(prev => prev.filter(g => g.id !== id));
          addToast("Group deleted", "success");
      } catch (e) {
          addToast("Failed to delete", "error");
      }
  };

  const openEdit = (g: SplitGroup, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingGroupId(g.id);
      setGroupName(g.name);
      setSelectedMembers(g.memberIds); // Pre-populate members
      setShowAdd(true);
  };

  const closeModal = () => {
      setShowAdd(false);
      setEditingGroupId(null);
      setGroupName('');
      setSelectedMembers([]);
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Manage Groups</h1>
          <p className="text-slate-500 font-bold mt-1 text-xs uppercase tracking-wider">Your shared expense groups</p>
        </div>
        <div>
             <button onClick={() => setShowAdd(true)} className="btn-primary shadow-indigo-200">
                <ICONS.Plus className="w-4 h-4 mr-2" />
                <span className="text-[10px] uppercase tracking-widest">New Group</span>
             </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {groups.length === 0 ? (
             <div className="p-12 text-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                     <ICONS.Users className="w-8 h-8 text-slate-300" />
                 </div>
                 <h3 className="text-lg font-black text-slate-900">No Groups Yet</h3>
                 <p className="text-slate-500 text-sm mt-1 mb-6">Create your first group to start tracking.</p>
                 <button onClick={() => setShowAdd(true)} className="btn-primary">Create Group</button>
             </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="py-4 pl-6 text-[10px] font-black uppercase tracking-widest text-slate-500">Group Name</th>
                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Members</th>
                            <th className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Created</th>
                            <th className="py-4 pr-6 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {groups.map(g => (
                            <tr 
                                key={g.id} 
                                onClick={() => navigate(`/splitwise/group/${g.id}`)}
                                className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                            >
                                <td className="py-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                                            {g.name[0]}
                                        </div>
                                        <span className="font-bold text-slate-900">{g.name}</span>
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="flex -space-x-2">
                                        {g.memberIds.slice(0, 4).map(mid => {
                                            const p = people.find(person => person.id === mid);
                                            return (
                                                <div key={mid} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 overflow-hidden" title={p?.name}>
                                                    <img src={p?.avatar || `https://ui-avatars.com/api/?name=${p?.name}`} alt="" className="w-full h-full" />
                                                </div>
                                            )
                                        })}
                                        {g.memberIds.length > 4 && (
                                            <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                                                +{g.memberIds.length - 4}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4">
                                    <span className="text-xs font-bold text-slate-400">
                                        {new Date(g.createdAt || Date.now()).toLocaleDateString()}
                                    </span>
                                </td>
                                <td className="py-4 pr-6 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => openEdit(g, e)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 rounded-lg shadow-sm"
                                            title="Rename Group"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteGroup(g.id, e)}
                                            className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 hover:border-rose-200 rounded-lg shadow-sm"
                                            title="Delete Group"
                                        >
                                            <ICONS.Trash className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

       <SidePopover
        isOpen={showAdd}
        onClose={closeModal}
        title={editingGroupId ? "Edit Group" : "Create New Group"}
        subtitle={editingGroupId ? "Rename your group" : "Start tracking shared expenses"}
      >
        <form onSubmit={handleSaveGroup} className="space-y-6">
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
                 <button type="button" onClick={closeModal} className="flex-1 btn-secondary !py-4 uppercase tracking-widest text-[10px]">Cancel</button>
                 <button type="submit" disabled={!groupName} className="flex-1 btn-primary !py-4 uppercase tracking-widest text-[10px] shadow-indigo-200">
                    {editingGroupId ? 'Update Group' : 'Create Group'}
                </button>
            </div>
        </form>
      </SidePopover>
    </div>
  );
};

export default GroupsManager;
