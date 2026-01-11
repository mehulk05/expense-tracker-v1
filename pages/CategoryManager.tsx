
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
      setError(`Duplicate Category: "${cleanName}" already exists.`);
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
    if (!window.confirm('Delete category? This will not delete expenses but they will lose their category association.')) return;
    await storage.deleteCategory(id);
    setCategories(categories.filter(c => c.id !== id));
  };

  if (loading) return <div className="p-20 text-center"><div className="animate-spin h-6 w-6 border-b-2 border-indigo-600 inline-block"></div></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="card-professional p-8">
        <h2 className="text-xl font-extrabold text-slate-900 mb-6 tracking-tight">Spending Categories</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              value={newCatName} 
              onChange={e => { setNewCatName(e.target.value); setError(null); }} 
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              className="flex-1 input-professional" 
              placeholder="Enter category name (e.g. Fuel)" 
            />
            <button onClick={() => handleAddCategory()} className="btn-primary whitespace-nowrap px-8">
              <ICONS.Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>
          
          {error && <p className="text-xs font-bold text-rose-500 animate-in fade-in slide-in-from-top-1 px-1">{error}</p>}

          <div className="pt-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Suggested</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_CATEGORIES.map(suggested => {
                const exists = categories.some(c => c.name.toLowerCase() === suggested.toLowerCase());
                return (
                  <button
                    key={suggested}
                    disabled={exists}
                    onClick={() => handleAddCategory(suggested)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      exists 
                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600'
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

      <div className="card-professional">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Categories ({categories.length})</p>
        </div>
        <div className="divide-y divide-slate-100">
          {categories.length === 0 ? (
            <div className="p-12 text-center text-slate-400 italic text-sm">No categories created yet.</div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="p-4 flex items-center justify-between group hover:bg-indigo-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {cat.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">{cat.name}</span>
                </div>
                <button 
                  onClick={() => deleteCategory(cat.id)}
                  className="text-slate-300 hover:text-rose-500 p-2 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete category"
                >
                  <ICONS.Trash className="w-4 h-4" />
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
