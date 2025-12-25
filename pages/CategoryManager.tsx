
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Category } from '../types';
import { ICONS } from '../constants';

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
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
    const newCat: Category = {
      id: crypto.randomUUID(),
      name: newCatName,
      type: 'other',
      subCategories: []
    };
    await storage.saveCategory(newCat);
    setCategories([...categories, newCat]);
    setNewCatName('');
  };

  const handleAddSubCategory = async (catId: string) => {
    if (!newSubName) return;
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
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    await storage.deleteCategory(id);
    setCategories(categories.filter(c => c.id !== id));
    if (activeCategoryId === id) setActiveCategoryId(null);
  };

  if (loading) return <div className="p-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1 px-4 py-2 border rounded-xl" placeholder="Category Name" />
            <button onClick={handleAddCategory} className="bg-indigo-600 text-white px-4 py-2 rounded-xl">Add</button>
          </div>
          <div className="space-y-3">
            {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => setActiveCategoryId(cat.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  activeCategoryId === cat.id ? 'border-indigo-600 bg-indigo-50' : 'bg-white'
                }`}
              >
                <div>
                  <p className="font-semibold">{cat.name}</p>
                  <p className="text-xs text-slate-500">{cat.subCategories.length} subcategories</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} className="text-slate-300 hover:text-red-500 p-2"><ICONS.Trash className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm min-h-[300px]">
          {activeCategoryId ? (
            <div className="space-y-6">
              <h3 className="text-xl font-bold">{categories.find(c => c.id === activeCategoryId)?.name} Subs</h3>
              <div className="flex gap-2">
                <input value={newSubName} onChange={e => setNewSubName(e.target.value)} className="flex-1 px-4 py-2 border rounded-xl" placeholder="Add sub..." />
                <button onClick={() => handleAddSubCategory(activeCategoryId)} className="bg-slate-800 text-white px-4 py-2 rounded-xl">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.find(c => c.id === activeCategoryId)?.subCategories.map((sub, i) => (
                  <span key={i} className="px-4 py-2 bg-slate-100 rounded-full text-sm">{sub}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">Select a category</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
