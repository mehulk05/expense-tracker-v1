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
      setError(`Classification Conflict: "${cleanName}" is already active.`);
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
    if (!window.confirm('Delete classification? Previous entries will remain but lose their tag.')) return;
    await storage.deleteCategory(id);
    setCategories(categories.filter(c => c.id !== id));
  };

  if (loading) return (
     <div className="space-y-10 max-w-4xl mx-auto">
       <div className="h-56 skeleton rounded-3xl w-full"></div>
       <div className="h-96 skeleton rounded-3xl w-full"></div>
     </div>
  );

  return (
    <div className="space-y-12 max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Configuration Hub */}
      <div className="card-professional p-12 shadow-xl shadow-slate-200/50">
        <h2 className="text-2xl font-black text-slate-900 mb-10 tracking-tighter uppercase">Classification Hub</h2>
        
        <div className="space-y-12">
          <div className="flex flex-col sm:flex-row gap-6 items-end">
            <div className="flex-1 w-full">
              <label className="label-professional">New Classification Label</label>
              <input 
                value={newCatName} 
                onChange={e => { setNewCatName(e.target.value); setError(null); }} 
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                className="input-professional !py-4" 
                placeholder="e.g. Health / Software / Logistics" 
              />
            </div>
            <button onClick={() => handleAddCategory()} className="btn-primary !py-4 px-12 whitespace-nowrap shadow-indigo-200">
              <ICONS.Plus className="w-5 h-5" />
              <span className="text-[11px] uppercase tracking-widest">Register Label</span>
            </button>
          </div>
          
          {error && <p className="text-xs font-black text-rose-500 px-1 animate-in slide-in-from-left-4 bg-rose-50 py-3 rounded-lg border border-rose-100 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            {error}
          </p>}

          <div className="pt-8 border-t border-slate-100">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8">System Suggestions</p>
            <div className="flex flex-wrap gap-3">
              {SUGGESTED_CATEGORIES.map(suggested => {
                const exists = categories.some(c => c.name.toLowerCase() === suggested.toLowerCase());
                return (
                  <button
                    key={suggested}
                    disabled={exists}
                    onClick={() => handleAddCategory(suggested)}
                    className={`px-5 py-3 rounded-xl text-xs font-black transition-all border-2 ${
                      exists 
                        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm'
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

      {/* Active Inventory List */}
      <div className="card-professional shadow-xl shadow-slate-200/50">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
             <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Active Inventory</p>
             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{categories.length} registered classifications</p>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {categories.length === 0 ? (
            <div className="p-24 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-6 border border-slate-100">
                  <ICONS.Category className="w-8 h-8 opacity-30" />
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Registry Empty</p>
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="px-10 py-6 flex items-center justify-between group hover:bg-slate-50/50 transition-all border-l-4 border-l-transparent hover:border-l-indigo-600">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-base border border-indigo-100 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {cat.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-lg tracking-tight">{cat.name}</span>
                </div>
                <button 
                  onClick={() => deleteCategory(cat.id)}
                  className="text-slate-300 hover:text-rose-600 p-3.5 transition-all opacity-0 group-hover:opacity-100 hover:bg-rose-50 rounded-2xl"
                  title="Remove classification"
                >
                  <ICONS.Trash className="w-6 h-6" />
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