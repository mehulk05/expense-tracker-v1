
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

  useEffect(() => {
    const load = async () => {
      const data = await storage.getCategories();
      setCategories(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName) return;
    try {
      const newCat: Category = {
        id: crypto.randomUUID(),
        name: newCatName,
        type: newCatType,
        subCategories: []
      };
      await storage.saveCategory(newCat);
      setCategories([...categories, newCat]);
      setNewCatName('');
    } catch (err) {
      alert("Permission denied. Could not add category.");
    }
  };

  const handleAddSubCategory = async (catId: string) => {
    if (!newSubName) return;
    try {
      const updated = categories.map(c => {
        if (c.id === catId) {
          return { ...c, subCategories: [...c.subCategories, newSubName] };
        }
        return c;
      });
      const target = updated.find(c => c.id === catId);
      if (target) await storage.saveCategory(target);
      setCategories(updated);
      setNewSubName('');
    } catch (err) {
      alert("Permission denied. Could not update subcategories.");
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await storage.deleteCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      if (activeCategoryId === id) setActiveCategoryId(null);
    } catch (err) {
      alert("Permission denied. Could not delete category.");
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Add New Category</h3>
            <div className="flex gap-2">
              <input 
                value={newCatName} 
                onChange={e => setNewCatName(e.target.value)} 
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl" 
                placeholder="Category Name" 
              />
              <select 
                value={newCatType} 
                onChange={e => setNewCatType(e.target.value as 'personal' | 'other')}
                className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm"
              >
                <option value="personal">Personal</option>
                <option value="other">Business/Other</option>
              </select>
              <button onClick={handleAddCategory} className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">Add</button>
            </div>
          </div>

          <div className="space-y-3">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => setActiveCategoryId(cat.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeCategoryId === cat.id ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100' : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${cat.type === 'personal' ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
                  <div>
                    <p className="font-semibold text-slate-800">{cat.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{cat.type} • {cat.subCategories.length} items</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><ICONS.Trash className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
          {activeCategoryId ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">{categories.find(c => c.id === activeCategoryId)?.name} Subcategories</h3>
                <span className="text-xs px-2 py-1 bg-slate-100 rounded-full font-medium text-slate-500 uppercase tracking-wider">{categories.find(c => c.id === activeCategoryId)?.type}</span>
              </div>
              <div className="flex gap-2">
                <input 
                  value={newSubName} 
                  onChange={e => setNewSubName(e.target.value)} 
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="New item (e.g. Coffee, Rent...)" 
                />
                <button onClick={() => handleAddSubCategory(activeCategoryId)} className="bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700">Add Item</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.find(c => c.id === activeCategoryId)?.subCategories.length === 0 ? (
                  <p className="text-slate-400 italic py-10 w-full text-center">No subcategories yet. Add your first one above.</p>
                ) : (
                  categories.find(c => c.id === activeCategoryId)?.subCategories.map((sub, i) => (
                    <span key={i} className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-medium border border-indigo-100 animate-in slide-in-from-bottom-1 duration-200">
                      {sub}
                    </span>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                <ICONS.Category className="w-8 h-8 opacity-20" />
              </div>
              <p>Select a category to manage sub-items</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
