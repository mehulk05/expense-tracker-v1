
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
    if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setError(`Duplicate Category: "${cleanName}"`);
      return;
    }
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
  };

  const handleAddSubCategory = async (catId: string) => {
    setError(null);
    const cleanSub = newSubName.trim();
    if (!cleanSub) return;
    const currentCat = categories.find(c => c.id === catId);
    if (currentCat?.subCategories.some(s => s.toLowerCase() === cleanSub.toLowerCase())) {
      setError(`Duplicate Item: "${cleanSub}"`);
      return;
    }
    const updated = categories.map(c => c.id === catId ? { ...c, subCategories: [...c.subCategories, cleanSub] } : c);
    const target = updated.find(c => c.id === catId);
    if (target) await storage.saveCategory(target);
    setCategories(updated);
    setNewSubName('');
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Delete category framework?')) return;
    await storage.deleteCategory(id);
    const filtered = categories.filter(c => c.id !== id);
    setCategories(filtered);
    if (activeCategoryId === id) setActiveCategoryId(filtered[0]?.id || null);
  };

  const activeCategory = categories.find(c => c.id === activeCategoryId);

  if (loading) return <div className="p-20 text-center"><div className="animate-spin h-6 w-6 border-b-2 border-slate-900 inline-block"></div></div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {error && <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-xs font-bold border border-rose-100 mb-4">{error}</div>}

      {categories.length === 0 ? (
        <div className="card-professional p-12 text-center border-dashed">
           <h2 className="text-xl font-extrabold mb-8">Classification Framework</h2>
           <div className="max-w-xs mx-auto space-y-4">
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} className="input-professional text-center" placeholder="Category Name" />
              <button onClick={handleAddCategory} className="btn-primary w-full">Define Framework</button>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-4">
            <div className="card-professional p-4 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Add Segment</p>
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} className="input-professional !py-2" placeholder="Segment Name" />
              <button onClick={handleAddCategory} className="btn-primary w-full !py-2 !text-xs">Create</button>
            </div>
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Structure</p>
               {categories.map(cat => (
                 <button 
                   key={cat.id} 
                   onClick={() => setActiveCategoryId(cat.id)}
                   className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-all ${activeCategoryId === cat.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}
                 >
                   <span className="text-sm font-bold">{cat.name}</span>
                   <ICONS.ChevronRight className={`w-3 h-3 opacity-40 ${activeCategoryId === cat.id ? 'text-white' : ''}`} />
                 </button>
               ))}
            </div>
          </div>

          <div className="md:col-span-3 card-professional p-8">
            {activeCategory ? (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex justify-between items-start pb-6 border-b border-slate-100">
                   <div>
                      <h3 className="text-2xl font-extrabold tracking-tight">{activeCategory.name}</h3>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">{activeCategory.type} domain</p>
                   </div>
                   <button onClick={() => deleteCategory(activeCategory.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><ICONS.Trash className="w-4 h-4" /></button>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Append Specification</p>
                   <div className="flex gap-2">
                      <input value={newSubName} onChange={e => setNewSubName(e.target.value)} className="flex-1 input-professional" placeholder="New item label..." />
                      <button onClick={() => handleAddSubCategory(activeCategory.id)} className="btn-primary">Add Item</button>
                   </div>
                </div>

                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Linked Items</p>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {activeCategory.subCategories.map((sub, i) => (
                        <div key={i} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                           {sub}
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ) : <div className="flex items-center justify-center h-full text-slate-300 font-bold italic">Select Segment</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;