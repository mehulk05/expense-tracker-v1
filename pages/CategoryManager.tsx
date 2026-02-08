import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { Category } from '../types';
import { ICONS } from '../constants';

const SUGGESTED_CATEGORIES = [
  "Grocery", "Dining", "Transport", "Rent", "Utilities", 
  "Medical", "Shopping", "Entertainment", "Insurance", "Recharge"
];

// Category icon mapping
const getCategoryIcon = (categoryName: string): string => {
  const iconMap: Record<string, string> = {
    'grocery': '🛒',
    'dining': '🍽️',
    'transport': '🚗',
    'rent': '🏠',
    'utilities': '💡',
    'medical': '⚕️',
    'shopping': '🛍️',
    'entertainment': '🎬',
    'insurance': '🛡️',
    'recharge': '📱',
    'food': '🍔',
    'travel': '✈️',
    'health': '❤️',
    'education': '📚',
    'fitness': '💪',
    'gift': '🎁',
    'bills': '📄',
    'fuel': '⛽',
    'salon': '💇',
    'coffee': '☕',
  };
  
  const key = categoryName.toLowerCase();
  return iconMap[key] || '📦';
};

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]); // Added for insights
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'month' | 'year'>('month');
  const [sortBy, setSortBy] = useState<'amount' | 'count' | 'name'>('amount'); // Added sortBy state

  useEffect(() => {
    const load = async () => {
      const [cats, exps] = await Promise.all([
        storage.getCategories(),
        storage.getExpenses()
      ]);
      setCategories(cats);
      setExpenses(exps);
      setLoading(false);
    };
    load();
  }, []);

  const handleAddCategory = async (nameToUse?: string) => {
    setError(null);
    const cleanName = (nameToUse || newCatName).trim();
    if (!cleanName) return;

    if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
      setError(`"${cleanName}" already exists`);
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
    if (!window.confirm('Delete this category? Previous entries will remain but lose their tag.')) return;
    await storage.deleteCategory(id);
    setCategories(categories.filter(c => c.id !== id));
  };

  const getCategoryMetrics = (cat: Category) => {
    const now = new Date();
    const currentExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        if (timeRange === 'month') {
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } else {
            return d.getFullYear() === now.getFullYear();
        }
    }).filter(e => e.categoryId === cat.id || e.category === cat.name); // Support both ID and Name match

    const totalSpent = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = currentExpenses.length;
    
    return { totalSpent, count };
  };

  if (loading) return (
     <div className="space-y-6 max-w-6xl mx-auto">
       <div className="h-40 skeleton rounded-2xl w-full"></div>
       <div className="h-96 skeleton rounded-2xl w-full"></div>
     </div>
  );

  // Calculate stats for all categories
  const categoryStats = categories.map(cat => ({
      ...cat,
      ...getCategoryMetrics(cat)
  }));

  // Calculate Top 4 (always by amount)
  const topCategories = [...categoryStats].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 4);

  // Sort categories for the grid based on selection
  const sortedCategories = [...categoryStats].sort((a, b) => {
      if (sortBy === 'amount') return b.totalSpent - a.totalSpent;
      if (sortBy === 'count') return b.count - a.count;
      return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight uppercase">Expense Categories</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide mt-1">{categories.length} active categories</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setTimeRange('month')} 
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${timeRange === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                This Month
            </button>
            <button 
                onClick={() => setTimeRange('year')} 
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${timeRange === 'year' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
                This Year
            </button>
        </div>
      </div>

       {/* Top 4 Metrics Cards */}
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {topCategories.map(cat => (
                <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                        <div className="text-2xl bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {getCategoryIcon(cat.name)}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 text-sm truncate">{cat.name}</h3>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Spent</p>
                            <span className="text-lg font-black text-slate-900 tracking-tight">₹{cat.totalSpent.toLocaleString()}</span>
                        </div>
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Txns</p>
                            <span className="text-sm font-bold text-slate-600">{cat.count}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>

      {/* Add New Category */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">New Category</label>
            <input 
              value={newCatName} 
              onChange={e => { setNewCatName(e.target.value); setError(null); }} 
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
              placeholder="e.g. Health, Software, Groceries" 
            />
          </div>
          <button 
            onClick={() => handleAddCategory()} 
            disabled={!newCatName.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ICONS.Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
        
        {error && <p className="text-xs font-bold text-red-500 mt-3 px-3 py-2 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          {error}
        </p>}

        {/* Suggested Categories */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Add</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_CATEGORIES.map(suggested => {
              const exists = categories.some(c => c.name.toLowerCase() === suggested.toLowerCase());
              const icon = getCategoryIcon(suggested);
              return (
                <button
                  key={suggested}
                  disabled={exists}
                  onClick={() => handleAddCategory(suggested)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    exists 
                      ? 'bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 shadow-sm hover:shadow-md active:scale-95'
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <span>{suggested}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Active Categories</p>
          <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort By:</label>
              <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:border-blue-500"
              >
                  <option value="amount">Highest Spend</option>
                  <option value="count">Most Transactions</option>
                  <option value="name">Name (A-Z)</option>
              </select>
          </div>
        </div>
        
        {sortedCategories.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4 border border-slate-100">
              <ICONS.Category className="w-8 h-8 opacity-30" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">No categories yet</p>
            <p className="text-xs text-slate-400 mt-1">Add your first category above</p>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sortedCategories.map(cat => {
              const icon = getCategoryIcon(cat.name);
              const metrics = getCategoryMetrics(cat);

              return (
                <div 
                  key={cat.id} 
                  className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-2xl border border-blue-200/50 group-hover:scale-110 transition-transform">
                        {icon}
                        </div>
                        <div className="min-w-0">
                             <p className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{cat.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{metrics.count} txns</p>
                        </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCategory(cat.id);
                      }}
                      className="shrink-0 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete category"
                    >
                      <ICONS.Trash className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-50 flex items-end justify-between">
                     <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Spent</p>
                        <p className="text-sm font-black text-slate-800 tracking-tight">₹{metrics.totalSpent.toLocaleString()}</p>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;