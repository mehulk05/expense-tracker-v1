
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Category } from '../types';
import { ICONS } from '../constants';

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'personal' | 'other'>('personal');
  const [newSubName, setNewSubName] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await storage.getCategories();
      setCategories(data);
      if (data.length > 0) setActiveCategoryId(data[0].id);
      setLoading(false);
    };
    load();
  }, []);

  const handleAddCategory = async () => {
    setError(null);
    const cleanName = newCatName.trim();
    if (!cleanName) return;

    // Duplicate Check
    const exists = categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      setError(`A category named "${cleanName}" already exists.`);
      return;
    }

    try {
      const newCat: Category = {
        id: crypto.randomUUID(),
        name: cleanName,
        type: newCatType,
        subCategories: []
      };
      await storage.saveCategory(newCat);
      setCategories([...categories, newCat]);
      setNewCatName('');
      setActiveCategoryId(newCat.id);
    } catch (err) {
      setError("Failed to save category. Please try again.");
    }
  };

  const handleAddSubCategory = async (catId: string) => {
    setError(null);
    const cleanSub = newSubName.trim();
    if (!cleanSub) return;

    const currentCat = categories.find(c => c.id === catId);
    if (!currentCat) return;

    // Subcategory Duplicate Check
    const exists = currentCat.subCategories.some(s => s.toLowerCase() === cleanSub.toLowerCase());
    if (exists) {
      setError(`"${cleanSub}" is already a subcategory in this section.`);
      return;
    }

    try {
      const updated = categories.map(c => {
        if (c.id === catId) {
          return { ...c, subCategories: [...c.subCategories, cleanSub] };
        }
        return c;
      });
      const target = updated.find(c => c.id === catId);
      if (target) await storage.saveCategory(target);
      setCategories(updated);
      setNewSubName('');
    } catch (err) {
      setError("Failed to update subcategories.");
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category and all its data?')) return;
    try {
      await storage.deleteCategory(id);
      const filtered = categories.filter(c => c.id !== id);
      setCategories(filtered);
      if (activeCategoryId === id) {
        setActiveCategoryId(filtered.length > 0 ? filtered[0].id : null);
      }
    } catch (err) {
      setError("Failed to delete category.");
    }
  };

  const activeCategory = categories.find(c => c.id === activeCategoryId);

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      <p className="text-slate-500 font-medium italic">Sorting your buckets...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Validation Message */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-700 animate-in slide-in-from-top-4 duration-300">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-sm font-bold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-rose-100 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 animate-in fade-in duration-500">
           <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 mb-8">
              <ICONS.Category className="w-12 h-12" />
           </div>
           <h2 className="text-3xl font-bold text-slate-800 mb-4">No Spending Buckets</h2>
           <p className="text-slate-500 max-w-sm mb-10 text-lg">Categories help SpendWise understand your habits. Start by adding your first one below.</p>
           
           <div className="w-full max-w-md bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="space-y-4">
                <input 
                  value={newCatName} 
                  onChange={e => { setNewCatName(e.target.value); setError(null); }} 
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="w-full px-6 py-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-center text-xl font-bold placeholder:text-slate-300" 
                  placeholder="e.g. Shopping" 
                />
                <select 
                  value={newCatType} 
                  onChange={e => setNewCatType(e.target.value as 'personal' | 'other')}
                  className="w-full px-6 py-4 border border-slate-200 rounded-2xl bg-white font-semibold text-slate-600 appearance-none text-center"
                >
                  <option value="personal">Personal Use</option>
                  <option value="other">Business / Others</option>
                </select>
                <button 
                  onClick={handleAddCategory} 
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                  Create Category
                </button>
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: List & Add */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">New Bucket</h3>
              <div className="space-y-3">
                <input 
                  value={newCatName} 
                  onChange={e => { setNewCatName(e.target.value); setError(null); }} 
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold" 
                  placeholder="Category Name..." 
                />
                <div className="flex gap-2">
                  <select 
                    value={newCatType} 
                    onChange={e => setNewCatType(e.target.value as 'personal' | 'other')}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-600"
                  >
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                  </select>
                  <button onClick={handleAddCategory} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95">Add</button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest ml-1">Available</h3>
              {categories.map(cat => (
                <div 
                  key={cat.id} 
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer flex items-center justify-between group ${
                    activeCategoryId === cat.id ? 'border-indigo-600 bg-indigo-50/50 shadow-lg shadow-indigo-50' : 'bg-white border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${cat.type === 'personal' ? 'bg-indigo-500' : 'bg-amber-500'} shadow-sm`}></div>
                    <div>
                      <p className={`font-bold transition-colors ${activeCategoryId === cat.id ? 'text-indigo-900' : 'text-slate-700'}`}>{cat.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{cat.subCategories.length} items</p>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} className="text-slate-200 hover:text-rose-500 p-2 transition-all opacity-0 group-hover:opacity-100"><ICONS.Trash className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Subcategory Details */}
          <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[500px] flex flex-col">
            {activeCategory ? (
              <div className="space-y-8 animate-in fade-in duration-300 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">{activeCategory.name}</h3>
                    <p className="text-sm text-slate-400 font-medium italic mt-1">Manage subcategories for this section</p>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.15em] border ${
                    activeCategory.type === 'personal' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {activeCategory.type}
                  </span>
                </div>

                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-500 mb-4">Add Sub-Bucket</h4>
                  <div className="flex gap-3">
                    <input 
                      value={newSubName} 
                      onChange={e => { setNewSubName(e.target.value); setError(null); }} 
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSubCategory(activeCategoryId!)}
                      className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-bold placeholder:text-slate-300" 
                      placeholder="e.g. Coffee, Fuel, Rent..." 
                    />
                    <button onClick={() => handleAddSubCategory(activeCategoryId!)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95">Add</button>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 ml-1">Current Items</h4>
                  <div className="flex flex-wrap gap-3">
                    {activeCategory.subCategories.length === 0 ? (
                      <div className="w-full flex flex-col items-center justify-center py-16 text-slate-300">
                         <ICONS.Plus className="w-12 h-12 mb-2 opacity-10" />
                         <p className="font-bold italic">No items yet</p>
                      </div>
                    ) : (
                      activeCategory.subCategories.map((sub, i) => (
                        <div key={i} className="group flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-300 hover:bg-indigo-50 transition-all animate-in slide-in-from-bottom-2 duration-300">
                          <span className="font-bold text-slate-700">{sub}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="pt-8 border-t border-slate-100 mt-auto">
                   <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                     <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                     Unique subcategories help AI identify your spends better.
                   </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                  <ICONS.Category className="w-10 h-10 opacity-10" />
                </div>
                <p className="font-bold text-lg">Select a bucket to view items</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
