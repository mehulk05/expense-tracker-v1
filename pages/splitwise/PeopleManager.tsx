import React, { useState, useEffect } from 'react';
import { auth } from '../../services/firebase';
import { storage } from '../../services/storage';
import { Person } from '../../types';
import SidePopover from '../../components/SidePopover';
import { ICONS } from '../../constants';
import { useToast } from '../../context/ToastContext';

const PeopleManager: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [groups, setGroups] = useState<import('../../types').SplitGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [fetchedPeople, fetchedGroups] = await Promise.all([
        storage.getPeople(),
        storage.getGroups()
    ]);
    setPeople(fetchedPeople);
    setGroups(fetchedGroups);
    setLoading(false);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setEditingId(null);
    setShowAdd(false);
  };

  const handleEdit = (p: Person) => {
    setEditingId(p.id);
    setName(p.name);
    setEmail(p.email || '');
    setShowAdd(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (!editingId && people.some(p => p.email && p.email === email && email !== '')) {
       addToast("A person with this email already exists found.", 'error');
       return;
    }

    const newPerson: Person = {
      id: editingId || crypto.randomUUID(),
      name,
      email: email || undefined,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };

    try {
      await storage.savePerson(newPerson);
      if (editingId) {
        setPeople(prev => prev.map(p => p.id === newPerson.id ? newPerson : p));
        addToast('Friend updated successfully', 'success');
      } else {
        setPeople(prev => [...prev, newPerson].sort((a,b) => a.name.localeCompare(b.name)));
        addToast('Friend added successfully', 'success');
      }
      resetForm();
    } catch (error) {
       addToast('Failed to save.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    // Check for attached transactions
    let hasTransactions = false;
    try {
        setLoading(true);
        // 1. Get groups this person is in
        const memberGroups = groups.filter(g => g.memberIds.includes(id));
        
        // 2. Check expenses in those groups
        const checkPromises = memberGroups.map(g => storage.getGroupExpenses(g.id));
        const results = await Promise.all(checkPromises);
        
        for (const groupExpenses of results) {
            if (groupExpenses.some(e => e.paidBy === id || e.participants.includes(id))) {
                hasTransactions = true;
                break;
            }
        }
    } catch (e) {
        console.error("Error checking transactions", e);
    } finally {
        setLoading(false);
    }

    if (hasTransactions) {
        alert("⛔ Operation Blocked\n\nThis member cannot be removed because they are part of existing expenses.\n\nPlease settle or delete those transactions first to maintain data integrity.");
        return;
    } 

    if (!window.confirm("Are you sure you want to delete this friend?")) return;

    try {
        await storage.deletePerson(id);
        setPeople(prev => prev.filter(p => p.id !== id));
        addToast('Friend removed', 'success');
        
        // Optional: Remove from groups? 
        // Logic suggests we should clean up group.memberIds too.
        // I'll leave that for a robust backend trigger or do it here if simple.
        // For now, sticking to the requested transaction validation.
    } catch (error) {
        addToast('Failed to delete.', 'error');
    }
  };

  const filteredPeople = people.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentUser = auth.currentUser;

  if (loading) return <div className="p-8"><div className="h-10 w-48 skeleton rounded mb-8"></div></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight uppercase">Friends Directory</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1">Manage people for group splits</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <ICONS.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search friends..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-colors hover:border-slate-300 shadow-sm"
                />
             </div>
             <button onClick={() => setShowAdd(true)} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                <ICONS.Plus className="w-4 h-4" />
                <span>Add Friend</span>
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeople.length === 0 ? (
             <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                 <p className="text-slate-400 font-black uppercase text-xs tracking-widest">{searchTerm ? 'No matches found' : 'No friends added yet'}</p>
             </div>
          ) : (
             filteredPeople.map(p => {
                 const isMe = currentUser && (p.email === currentUser.email || p.name === currentUser.displayName || p.name === 'Me');
                 const memberGroups = groups.filter(g => g.memberIds.includes(p.id));

                 return (
                  <div key={p.id} className={`bg-white p-6 rounded-2xl border ${isMe ? 'border-blue-200 bg-blue-50/10' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative`}>
                     {isMe && <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">It's You</div>}
                     
                     <div className="flex items-center gap-4 mb-4">
                         <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full border border-slate-100 bg-white" />
                         <div>
                             <h3 className="font-bold text-slate-800 line-clamp-1 break-all" title={p.name}>{p.name}</h3>
                             <p className="text-[10px] font-bold text-slate-400 line-clamp-1 break-all" title={p.email}>{p.email || 'No email'}</p>
                         </div>
                     </div>

                      <div className="border-t border-slate-50 pt-3 mt-auto">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Member of {memberGroups.length} groups</p>
                        <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
                            {memberGroups.length > 0 ? (
                                memberGroups.slice(0, 3).map(g => (
                                    <span key={g.id} className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 max-w-[100px] truncate">
                                        {g.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-[9px] text-slate-300 italic">No groups yet</span>
                            )}
                            {memberGroups.length > 3 && (
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                    +{memberGroups.length - 3}
                                </span>
                            )}
                        </div>
                     </div>

                     <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur rounded p-1 shadow-sm border border-slate-100">
                         <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                         </button>
                         <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                             <ICONS.Trash className="w-3.5 h-3.5" />
                         </button>
                     </div>
                  </div>
              )})
          )}
      </div>

      <SidePopover
        isOpen={showAdd}
        onClose={resetForm}
        title={editingId ? "Edit Friend" : "Add New Friend"}
        subtitle="Person Details"
      >
        <form onSubmit={handleSave} className="space-y-6">
            <div>
                <label className="label-professional">Name</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    required
                    className="input-professional"
                    placeholder="e.g. Alice"
                />
            </div>
            <div>
                <label className="label-professional">Email (Optional)</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className={`input-professional ${editingId && people.find(p => p.id === editingId)?.email === auth.currentUser?.email ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                    placeholder="alice@example.com"
                    disabled={!!(editingId && people.find(p => p.id === editingId)?.email === auth.currentUser?.email)}
                />
                {editingId && people.find(p => p.id === editingId)?.email === auth.currentUser?.email && (
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-3 items-start">
                        <svg className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <p className="text-[10px] text-indigo-800 font-medium leading-relaxed">
                            This email is associated with your login account and cannot be modified here.
                        </p>
                    </div>
                )}
            </div>
            <div className="pt-8 flex gap-4">
                 <button type="button" onClick={resetForm} className="flex-1 btn-secondary !py-4 uppercase tracking-widest text-[10px]">Cancel</button>
                 <button type="submit" className="flex-1 btn-primary !py-4 uppercase tracking-widest text-[10px] shadow-indigo-200">
                    {editingId ? "Update" : "Save"}
                </button>
            </div>
        </form>
      </SidePopover>
    </div>
  );
};

export default PeopleManager;
