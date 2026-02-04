import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SidePopover from '../components/SidePopover';
import { storage } from '../services/storage';
import { Expense, Account, Category, AccountType } from '../types';
import { ICONS } from '../constants';
import { formatCurrency, formatInputAmount } from '../utils/currency';
import { parseAndSaveCsvData } from '../utils/importHelpers';
import { useToast } from '../context/ToastContext';

const ITEMS_PER_PAGE = 10;

const ExpenseManager: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<AccountType>('upi');
  const [isPersonal, setIsPersonal] = useState(true);
  const [description, setDescription] = useState('');
  const [filter, setFilter] = useState<'all' | 'personal' | 'other'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Search and Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    const [exps, accs, cats] = await Promise.all([
      storage.getExpenses(),
      storage.getAccounts(),
      storage.getCategories()
    ]);
    setExpenses(exps);
    setAccounts(accs);
    setCategories(cats);
    if (accs.length && !accountId) setAccountId(accs[0].id);
    if (cats.length && !categoryId) setCategoryId(cats[0].id);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // --- METRICS CALCULATION ---
  const metrics = React.useMemo(() => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      let yearTotal = 0;
      let monthTotal = 0;
      let creditTotal = 0;
      let debitTotal = 0;
      let cashTotal = 0;
      let upiTotal = 0;
      let personalTotal = 0;
      let externalTotal = 0;

      expenses.forEach(e => {
          const d = new Date(e.date);
          const isYear = d.getFullYear() === currentYear;
          const isMonth = isYear && d.getMonth() === currentMonth;

          if (isYear) {
              yearTotal += e.amount;
              if (isMonth) monthTotal += e.amount;

              if (e.personalExpense ?? true) {
                  personalTotal += e.amount;
              } else {
                  externalTotal += e.amount;
              }
              
              const method = accounts.find(a => a.id === e.accountId)?.type || e.paymentMethod;
              if (method === 'credit') creditTotal += e.amount;
              else if (method === 'debit') debitTotal += e.amount;
              else if (method === 'cash') cashTotal += e.amount;
              else if (method === 'upi') upiTotal += e.amount;
          }
      });

      return { yearTotal, monthTotal, creditTotal, debitTotal, cashTotal, upiTotal, personalTotal, externalTotal };
  }, [expenses, accounts]);


  // Update account selection when payment method changes
  useEffect(() => {
    const filteredAccounts = accounts.filter(acc => acc.type === paymentMethod);
    if (filteredAccounts.length > 0) {
      setAccountId(filteredAccounts[0].id);
    } else {
      setAccountId('');
    }
  }, [paymentMethod, accounts]);

  // Reset pagination when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [filter, searchTerm]);

  // Validation
  const isValid = amount.length > 0 && parseFloat(amount.replace(/,/g, '')) > 0 && accountId !== '' && categoryId !== '' && date !== '';

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    
    // Optimistic UI updates
    const id = editingId || crypto.randomUUID();
    const newExpense: Expense = {
      id,
      amount: parseFloat(amount.replace(/,/g, '')),
      date,
      accountId,
      categoryId,
      personalExpense: isPersonal,
      paymentMethod,
      description
    };

    // Update Local State first
    if (editingId) {
        setExpenses(prev => prev.map(e => e.id === id ? newExpense : e));
    } else {
        setExpenses(prev => [newExpense, ...prev]);
    }
    
    // Reset form immediately
    setAmount('');
    setDescription('');
    setIsPersonal(true);
    setShowAddForm(false);
    setEditingId(null);
    
    // Persist
    try {
        await storage.saveExpense(newExpense);
        addToast(editingId ? 'Expense updated successfully' : 'Expense added successfully', 'success');
    } catch (error) {
        addToast('Failed to save expense', 'error');
        // Rollback would go here in a robust app
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
        try {
            await storage.deleteExpense(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            addToast('Expense deleted successfully', 'success');
        } catch (error) {
            addToast('Failed to delete expense', 'error');
        }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Delete ${selectedIds.size} expenses? This cannot be undone.`)) {
        setLoading(true);
        try {
            await Promise.all(
                Array.from(selectedIds).map((id: string) => storage.deleteExpense(id))
            );
            setExpenses(prev => prev.filter(e => !selectedIds.has(e.id)));
            addToast(`Successfully deleted ${selectedIds.size} expenses`, 'success');
            setSelectedIds(new Set());
        } catch (error) {
            addToast('Failed to delete some expenses', 'error');
        } finally {
            setLoading(false);
        }
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredExpenses.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(filteredExpenses.map(e => e.id)));
    }
  };

  const handleEdit = (expense: Expense) => {
      setEditingId(expense.id);
      setAmount(expense.amount.toString());
      setDate(expense.date);
      setAccountId(expense.accountId);
      setCategoryId(expense.categoryId);
      setPaymentMethod(expense.paymentMethod);
      setIsPersonal(expense.personalExpense ?? true);
      setDescription(expense.description);
      setShowAddForm(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const { importedCount, errors } = await parseAndSaveCsvData(file, accounts, categories);
      if (errors.length > 0) {
        console.error("Import errors:", errors);
        if (importedCount === 0) {
             addToast(`Import Failed: ${errors[0]}`, 'error');
        } else {
             addToast(`Imported ${importedCount} expenses with warnings. Check console.`, 'info');
        }
      } else {
        addToast(`Successfully imported ${importedCount} expenses!`, 'success');
      }
      await loadData(); // Reload all data to reflect new accounts and expenses
    } catch (error) {
      console.error("Import failed:", error);
      addToast("Failed to import CSV file.", 'error');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Helper to get payment badge style
  const getPaymentParams = (method: string) => {
      switch(method?.toLowerCase()) {
          case 'upi': return { label: 'UPI', style: 'bg-orange-50 text-orange-600 border-orange-100' };
          case 'credit': return { label: 'Credit Card', style: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
          case 'debit': return { label: 'Debit Card', style: 'bg-violet-50 text-violet-600 border-violet-100' };
          case 'cash': return { label: 'Cash', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
          default: return { label: method || 'Other', style: 'bg-slate-50 text-slate-500 border-slate-200' };
      }
  };

  const filteredExpenses = expenses.filter(exp => {
    // 1. Filter by Personal/Other
    if (filter !== 'all') {
        const expIsPersonal = exp.personalExpense ?? true;
        if (filter === 'personal' && !expIsPersonal) return false;
        if (filter === 'other' && expIsPersonal) return false;
    }
    
    // 2. Filter by Search Term
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const categoryName = categories.find(c => c.id === exp.categoryId)?.name.toLowerCase() || '';
        const accountName = accounts.find(a => a.id === exp.accountId)?.nickname?.toLowerCase() || '';
        const descIdx = exp.description?.toLowerCase().indexOf(term) ?? -1;
        
        return (
            descIdx > -1 ||
            categoryName.includes(term) ||
            accountName.includes(term) ||
            exp.amount.toString().includes(term)
        );
    }
    
    return true;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return (
     <div className="space-y-10">
       <div className="h-16 skeleton rounded-2xl w-full"></div>
       <div className="h-[500px] skeleton rounded-2xl w-full"></div>
     </div>
  );

  if (categories.length === 0) {
    return (
      <div className="card-professional p-16 text-center max-w-xl mx-auto mt-24">
        <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-500 mx-auto mb-10 border-2 border-indigo-100 shadow-xl shadow-indigo-100/50">
          <ICONS.Category className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">Inventory Empty</h2>
        <p className="text-slate-500 text-base font-semibold mb-12 leading-relaxed px-6">Your classification system is currently empty. Define categories to begin logging transactions.</p>
        <Link to="/categories" className="btn-primary w-full !py-4.5 text-xs uppercase tracking-widest shadow-indigo-200">
          Configure Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      
      {/* SECTION 1: OVERVIEW METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Spent This Year</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(metrics.yearTotal)}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Spent This Month</p>
              <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-900">{formatCurrency(metrics.monthTotal)}</p>
                  <span className="text-[10px] font-bold text-slate-400">
                      {((metrics.monthTotal / (metrics.yearTotal || 1)) * 100).toFixed(0)}% of year
                  </span>
              </div>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Personal Spend (Year)</p>
              <p className="text-2xl font-black text-indigo-600">{formatCurrency(metrics.personalTotal)}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">External Spend (Year)</p>
              <p className="text-2xl font-black text-slate-900">{formatCurrency(metrics.externalTotal)}</p>
          </div>
      </div>
      
      {/* SECTION 2: PAYMENT BREAKDOWN */}
      <div>
         <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 px-2">Payment Breakdown</h3>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-orange-500">
                <p className="text-orange-600 text-[10px] font-black uppercase tracking-widest mb-1">UPI</p>
                <p className="text-xl font-black text-slate-900">{formatCurrency(metrics.upiTotal)}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-1">Credit Card</p>
                <p className="text-xl font-black text-slate-900">{formatCurrency(metrics.creditTotal)}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-violet-500">
                <p className="text-violet-600 text-[10px] font-black uppercase tracking-widest mb-1">Debit Card</p>
                <p className="text-xl font-black text-slate-900">{formatCurrency(metrics.debitTotal)}</p>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
                <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mb-1">Cash</p>
                <p className="text-xl font-black text-slate-900">{formatCurrency(metrics.cashTotal)}</p>
            </div>
         </div>
      </div>

      {/* Ledger Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Transaction Ledger</h2>
          <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1.5">Consolidated Spending Audit</p>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative group flex-1 sm:flex-initial">
             <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as any)}
              className="w-full bg-white border border-slate-300 rounded-xl px-6 py-3.5 font-black text-[10px] uppercase tracking-widest outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 appearance-none pr-12 shadow-sm"
            >
              <option value="all">Full Record</option>
              <option value="personal">Personal only</option>
              <option value="other">Institutional</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
              {selectedIds.size > 0 ? (
                  <button onClick={handleBulkDelete} className="btn-secondary !bg-red-50 !text-red-500 !border-red-200 hover:!bg-red-100 !px-8 animate-in fade-in zoom-in duration-200">
                    <ICONS.Trash className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-widest pl-2">Delete ({selectedIds.size})</span>
                  </button>
              ) : (
                  <>
                      <button onClick={() => {
                        setShowAddForm(true);
                        setEditingId(null);
                        setAmount('');
                        setDescription('');
                        setIsPersonal(true);
                      }} className="btn-primary !px-10 shadow-indigo-200">
                    <ICONS.Plus className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-widest">Manual Entry</span>
                  </button>
                  
                   <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".csv" 
                    className="hidden" 
                  />
                  <button onClick={() => fileInputRef.current?.click()} className="btn-secondary !px-8 ml-2">
                    <span className="text-[10px] uppercase tracking-widest">Import CSV</span>
                  </button>
                  </>
              )}
        </div>
      </div>



      {/* Search Bar */}
      <div className="relative">
          <input 
              type="text" 
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
      </div>

      {/* Manual Entry Side Popover */}
      <SidePopover
        isOpen={showAddForm}
        onClose={() => {
             setShowAddForm(false);
             setEditingId(null);
             setAmount('');
             setDescription('');
             setIsPersonal(true);
        }}
        title={editingId ? "Edit Entry" : "New Entry"}
        subtitle={editingId ? "Modify Transaction Details" : "Manual Transaction Logging"}
      >
        <form onSubmit={handleAddExpense} className="space-y-8">
          <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 shadow-inner">
            <label className="label-professional">Value (INR)</label>
            <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-2xl">₹</span>
                <input 
                  required 
                  type="text" 
                  inputMode="decimal"
                  value={formatInputAmount(amount)} 
                  onChange={e => {
                    const val = e.target.value.replace(/,/g, '');
                    if (!isNaN(Number(val)) || val === '') {
                        setAmount(val);
                    }
                  }} 
                  className="input-professional !pl-10 !text-3xl font-black text-indigo-600 !py-4 !border-none !shadow-none bg-transparent" 
                  placeholder="0.00" 
                />
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="label-professional">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="input-professional" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-professional">Payment Method</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value as AccountType)} 
                  className="input-professional font-bold uppercase text-xs"
                >
                  <option value="upi">UPI</option>
                  <option value="credit">Credit Card</option>
                  <option value="debit">Debit Card</option>
                </select>
              </div>
              <div>
                <label className="label-professional">Source Account</label>
                <select 
                  value={accountId} 
                  onChange={e => setAccountId(e.target.value)} 
                  className="input-professional font-bold"
                  disabled={!accountId && accounts.filter(a => a.type === paymentMethod).length === 0}
                >
                  {accounts
                    .filter(acc => acc.type === paymentMethod)
                    .map(acc => <option key={acc.id} value={acc.id}>{acc.nickname || acc.name}</option>)
                  }
                  {accounts.filter(acc => acc.type === paymentMethod).length === 0 && (
                     <option value="">No {paymentMethod} accounts</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="label-professional">Classification</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input-professional font-bold">
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-4 bg-indigo-50/70 p-5 rounded-2xl border border-indigo-100 group cursor-pointer" onClick={() => setIsPersonal(!isPersonal)}>
            <input 
              type="checkbox" 
              checked={isPersonal} 
              onChange={e => setIsPersonal(e.target.checked)}
              className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs font-black text-slate-700 select-none">Private / Personal Account Spend</span>
          </div>

          <div>
            <label className="label-professional">Reference Details</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="input-professional" placeholder="e.g. Weekly Starbucks or Server costs" />
          </div>

          <div className="flex gap-4 pt-8 border-t border-slate-100 sticky bottom-0 bg-white pb-2">
              <button type="button" onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
              }} className="flex-1 btn-secondary !py-4 uppercase tracking-widest text-[10px]">Discard</button>
              <button 
                type="submit" 
                disabled={!isValid}
                className="flex-1 btn-primary !py-4 uppercase tracking-widest text-[10px] shadow-indigo-200"
              >
                {editingId ? 'Update Entry' : 'Confirm Entry'}
              </button>
          </div>
        </form>
      </SidePopover>

      {/* Data Table */}
      <div className="card-professional shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="w-10 pl-6">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.size > 0 && selectedIds.size === filteredExpenses.length}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 accent-indigo-600 cursor-pointer"
                    />
                </th>
                <th>Date</th>
                <th>Channel</th>
                <th>Type</th>
                <th>Source/Card</th>
                <th>Classification</th>
                <th className="text-right">Value</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="text-slate-300 mb-4 flex justify-center">
                       <ICONS.Expense className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">No Transactions Found</p>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => {
                  const expIsPersonal = exp.personalExpense ?? true;
                  const paymentParams = getPaymentParams(accounts.find(a => a.id === exp.accountId)?.type || exp.paymentMethod);
                  return (
                    <tr key={exp.id} className={`hover:bg-indigo-50/20 transition-all group ${selectedIds.has(exp.id) ? 'bg-indigo-50/40' : ''}`}>
                      <td className="pl-6">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.has(exp.id)}
                            onChange={() => toggleSelection(exp.id)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 accent-indigo-600 cursor-pointer"
                        />
                      </td>
                      <td className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                        {new Date(exp.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </td>
                      <td>
                        <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border transition-all ${
                          expIsPersonal 
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {expIsPersonal ? 'Personal' : 'External'}
                        </span>
                      </td>
                       <td>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-md uppercase tracking-widest border ${paymentParams.style}`}>
                          {paymentParams.label}
                        </span>
                      </td>
                      <td>
                        <span className="text-[10px] font-bold text-slate-700">
                           {/* Logic: If Cash, show '-', else show Account Nickname/Name */}
                           {(accounts.find(a => a.id === exp.accountId)?.type === 'cash' || exp.paymentMethod === 'cash') 
                                ? '-' 
                                : (accounts.find(a => a.id === exp.accountId)?.nickname || accounts.find(a => a.id === exp.accountId)?.name || '-')
                           }
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col">
                           <p className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                            {categories.find(c => c.id === exp.categoryId)?.name || 'Misc'}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[300px] mt-1.5">
                            {exp.description || 'Verified entry'}
                          </p>
                        </div>
                      </td>
                      <td className="text-right font-black text-slate-900 text-base">
                        {formatCurrency(exp.amount, 2)}
                      </td>
                      <td className="text-right pl-4">
                        <div className="flex justify-end gap-2 transition-opacity">
                            <button 
                                onClick={() => handleEdit(exp)}
                                className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button 
                                onClick={() => handleDelete(exp.id)}
                                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                                <ICONS.Trash className="w-4 h-4" />
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Page <span className="text-indigo-600">{currentPage}</span> of {totalPages}
            </p>
            <div className="flex gap-2">
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary !py-2 !px-4 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Prev
                </button>
                <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary !py-2 !px-4 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;