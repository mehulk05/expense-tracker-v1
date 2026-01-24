
import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Category } from '../types';
import { ICONS } from '../constants';

const SUGGESTED_CATEGORIES = [
  "Grocery", "Dining", "Transport", "Rent", "Utilities", 
  "Medical", "Shopping", "Entertainment", "Insurance", "Recharge"
];

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await storage.getCategories();
      setCategories(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleAddCategory = async (nameToUse?: string) => {
    setError(null);
    const cleanName = (nameToUse || newCatName).trim();
    if (!cleanName) return;

    if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setError(`Collision: "${cleanName}" is already an active category.`);
      return;
    }

    const newCat: Category = {
      id: crypto.randomUUID(),
      name: cleanName
    };
    await storage.saveCategory(newCat);
    setCategories([...categories, newCat]);
    setNewCatName('');
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Confirm category deletion? Past transactions will remain logged but uncategorized.')) return;
    await storage.deleteCategory(id);
    setCategories(categories.filter(c => c.id !== id));
  };

  if (loading) return (
     <div className="space-y-6 max-w-3xl mx-auto">
       <div className="h-44 skeleton rounded-2xl w-full"></div>
       <div className="h-64 skeleton rounded-2xl w-full"></div>
     </div>
  );

  return (
    <div className="space-y-10 max-w-3xl mx-auto animate-in fade-in duration-500">
      {/* Category Creation Card */}
      <div className="card-professional p-10">
        <h2 className="text-xl font-black text-slate-900 mb-8 tracking-tighter uppercase">Spending Classifications</h2>
        
        <div className="space-y-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="label-professional">New Category</label>
              <input 
                value={newCatName} 
                onChange={e => { setNewCatName(e.target.value); setError(null); }} 
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                className="input-professional" 
                placeholder="e.g. Travel / Fitness" 
              />
            </div>
            <button onClick={() => handleAddCategory()} className="btn-primary sm:mt-6 px-10 whitespace-nowrap shadow-indigo-200">
              <ICONS.Plus className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest">Add Category</span>
            </button>
          </div>
          
          {error && <p className="text-xs font-black text-rose-500 px-1 animate-in slide-in-from-left-2">{error}</p>}

          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Discovery Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_CATEGORIES.map(suggested => {
                const exists = categories.some(c => c.name.toLowerCase() === suggested.toLowerCase());
                return (
                  <button
                    key={suggested}
                    disabled={exists}
                    onClick={() => handleAddCategory(suggested)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                      exists 
                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                        : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm'
                    }`}
                  >
                    {suggested}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Categories List */}
      <div className="card-professional">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Inventory ({categories.length})</p>
        </div>
        <div className="divide-y divide-slate-100">
          {categories.length === 0 ? (
            <div className="p-20 text-center">
               <ICONS.Category className="w-10 h-10 text-slate-200 mx-auto mb-4" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">The inventory is currently empty</p>
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="px-8 py-5 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">
                    {cat.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-base">{cat.name}</span>
                </div>
                <button 
                  onClick={() => deleteCategory(cat.id)}
                  className="text-slate-300 hover:text-rose-600 p-2.5 transition-all opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-lg"
                  title="Remove category"
                >
                  <ICONS.Trash className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
