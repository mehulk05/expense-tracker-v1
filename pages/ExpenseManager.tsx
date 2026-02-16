import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SidePopover from '../components/SidePopover';
import { storage } from '../services/storage';
import { Expense, Account, Category, AccountType } from '../types';
import { ICONS } from '../constants';
import { formatCurrency, formatInputAmount } from '../utils/currency';
import { useToast } from '../context/ToastContext';
import { AppCard } from '../components/ui/AppCard';
import { AppButton } from '../components/ui/AppButton';
import { CustomDatePicker } from '../components/ui/CustomDatePicker';
import { CustomDateRangePicker } from '../components/ui/CustomDateRangePicker';




const ExpenseManager: React.FC = () => {
  const navigate = useNavigate();
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
  
  // Time Filtering state
  const [timeFilter, setTimeFilter] = useState<'all' | 'this-month' | 'last-month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  
  // Search and Pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
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

  // --- FILTERING LOGIC ---
  const timeFilteredExpenses = React.useMemo(() => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const now = new Date();
      
      if (timeFilter === 'this-month') {
          if (expDate.getMonth() !== now.getMonth() || expDate.getFullYear() !== now.getFullYear()) return false;
      } else if (timeFilter === 'last-month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (expDate.getMonth() !== lastMonth.getMonth() || expDate.getFullYear() !== lastMonth.getFullYear()) return false;
      } else if (timeFilter === 'custom') {
          if (startDate && exp.date < startDate) return false;
          if (endDate && exp.date > endDate) return false;
      }
      return true;
    });
  }, [expenses, timeFilter, startDate, endDate]);

  const metrics = React.useMemo(() => {
      let total = 0;
      let creditTotal = 0;
      let debitTotal = 0;
      let cashTotal = 0;
      let upiTotal = 0;
      let personalTotal = 0;
      let externalTotal = 0;

      timeFilteredExpenses.forEach(e => {
          total += e.amount;
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
      });

      return { total, creditTotal, debitTotal, cashTotal, upiTotal, personalTotal, externalTotal };
  }, [timeFilteredExpenses, accounts]);

  const filteredExpenses = React.useMemo(() => {
    return timeFilteredExpenses.filter(exp => {
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
  }, [timeFilteredExpenses, filter, searchTerm, categories, accounts]);


  // Update account selection when payment method changes
  useEffect(() => {
    // Only auto-select first account when adding new expense, not when editing
    if (editingId) return;
    
    const filteredAccounts = accounts.filter(acc => acc.type === paymentMethod);
    if (filteredAccounts.length > 0) {
      setAccountId(filteredAccounts[0].id);
    } else {
      setAccountId('');
    }
  }, [paymentMethod, accounts, editingId]);

  // Reset pagination when filter or search changes
  useEffect(() => {
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

  const handleDuplicate = (expense: Expense) => {
      setEditingId(null); // Create new
      setAmount(expense.amount.toString());
      setDate(new Date().toISOString().split('T')[0]); // Set to Today
      setAccountId(expense.accountId);
      setCategoryId(expense.categoryId);
      setPaymentMethod(expense.paymentMethod);
      setIsPersonal(expense.personalExpense ?? true);
      setDescription(expense.description); // Keep description or maybe append "(Copy)"? User said "prefixll details", implies exact copy.
      setShowAddForm(true);
      addToast('Duplicating expense... Review and confirm.', 'info');
  };



  // Helper to get payment badge style
  const getPaymentParams = (method: string) => {
      switch(method?.toLowerCase()) {
          case 'upi': return { label: 'UPI', style: 'bg-orange-50 text-orange-600 border-orange-100' };
          case 'credit': return { label: 'Credit Card', style: 'bg-blue-50 text-blue-600 border-blue-100' };
          case 'debit': return { label: 'Debit Card', style: 'bg-violet-50 text-violet-600 border-violet-100' };
          case 'cash': return { label: 'Cash', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
          default: return { label: method || 'Other', style: 'bg-gray-50 text-gray-500 border-gray-200' };
      }
  };

  // Reset to page 1 when filters or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, timeFilter, startDate, endDate]);




  // Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };


  if (loading) return (
     <div className="space-y-10">
       <div className="h-16 skeleton rounded-xl w-full"></div>
       <div className="h-[500px] skeleton rounded-xl w-full"></div>
     </div>
  );

  if (categories.length === 0) {
    return (
      <AppCard className="p-16 text-center max-w-xl mx-auto mt-24">
        <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-10 border-2 border-blue-100 shadow-xl shadow-blue-100/50">
          <ICONS.Category className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Inventory Empty</h2>
        <p className="text-gray-500 text-base font-semibold mb-12 leading-relaxed px-6">Your classification system is currently empty. Define categories to begin logging transactions.</p>
        <Link to="/categories">
            <AppButton className="w-full !py-4.5 text-xs uppercase tracking-widest shadow-blue-200">
                Configure Categories
            </AppButton>
        </Link>
      </AppCard>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      
      {/* GLOBAL TIME FILTER BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Overview</h2>
            <p className="text-sm text-slate-500 font-medium">Analyze your spending patterns across periods</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             {/* Time Filter Button Group */}
             <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'this-month', label: 'This Month' },
                  { id: 'last-month', label: 'Last Month' },
                  { id: 'custom', label: 'Custom' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setTimeFilter(opt.id as any)}
                    className={`px-4 py-2 rounded-md text-xs font-bold transition-all active:scale-95 ${
                      timeFilter === opt.id 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
             </div>

             {/* Custom Date Range Picker */}
             {timeFilter === 'custom' && (
                <div className="animate-in slide-in-from-right-4 duration-300">
                    <CustomDateRangePicker 
                        startDate={startDate}
                        endDate={endDate}
                        onRangeChange={(start, end) => {
                            setStartDate(start);
                            setEndDate(end);
                        }}
                        className="w-64"
                    />
                </div>
             )}


          </div>

      </div>

      {/* SECTION 1: OVERVIEW METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AppCard className="p-5 border-blue-100 bg-blue-50/30">
              <p className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Spending</p>
              <p className="text-2xl font-black text-blue-900">{formatCurrency(metrics.total)}</p>
          </AppCard>
          <AppCard className="p-5">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Transaction Count</p>
              <p className="text-2xl font-bold text-slate-800">{timeFilteredExpenses.length} <span className="text-xs text-slate-400 font-medium">entries</span></p>
          </AppCard>
          <AppCard className="p-5">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Personal Component</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.personalTotal)}</p>
          </AppCard>
          <AppCard className="p-5">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Institutional Component</p>
              <p className="text-2xl font-bold text-slate-800">{formatCurrency(metrics.externalTotal)}</p>
          </AppCard>
      </div>

      
      {/* SECTION 2: PAYMENT BREAKDOWN */}
      <div>
         <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4 px-2">Payment Breakdown</h3>
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AppCard className="p-5 border-slate-100 bg-white" hoverEffect={false}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-orange-600 text-[10px] font-bold uppercase tracking-widest mb-1">UPI</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(metrics.upiTotal)}</p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-md">
                    <ICONS.Smartphone className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
            </AppCard>
            <AppCard className="p-5 border-slate-100 bg-white" hoverEffect={false}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-600 text-[10px] font-bold uppercase tracking-widest mb-1">Credit Card</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(metrics.creditTotal)}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-md">
                    <ICONS.Cards className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
            </AppCard>
            <AppCard className="p-5 border-slate-100 bg-white" hoverEffect={false}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-violet-600 text-[10px] font-bold uppercase tracking-widest mb-1">Debit Card</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(metrics.debitTotal)}</p>
                  </div>
                  <div className="p-2 bg-violet-50 rounded-md">
                    <ICONS.Cards className="w-4 h-4 text-violet-600" />
                  </div>
                </div>
            </AppCard>
            <AppCard className="p-5 border-slate-100 bg-white" hoverEffect={false}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-1">Cash</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(metrics.cashTotal)}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-md">
                    <ICONS.Wallet className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
            </AppCard>
         </div>
      </div>

      {/* ACTION BAR */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search Bar */}
          <div className="flex-1 w-full lg:w-auto">
             <div className="relative">
                <ICONS.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search transactions..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300"
                />
             </div>
          </div>
          
          {/* Filter & Actions */}
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
             {/* Filter Dropdown */}
              <div className="relative">
                 <select 
                    value={filter} 
                    onChange={e => setFilter(e.target.value as any)}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                    <option value="all">All Records</option>
                    <option value="personal">Personal</option>
                    <option value="other">Institutional</option>
                 </select>
                 <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                 </svg>
             </div>


             {/* Action Buttons */}
             
             {selectedIds.size > 0 ? (
                <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                    <ICONS.Trash className="w-3.5 h-3.5" />
                    Delete ({selectedIds.size})
                </button>
             ) : (
                <>
                    <button 
                        onClick={() => navigate('/expenses/import')}
                        className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="hidden sm:inline">Import</span>
                    </button>
                    <button
                        onClick={() => {
                            setShowAddForm(true);
                            setEditingId(null);
                            setAmount('');
                            setDescription('');
                            setIsPersonal(true);
                        }}
                        className="px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <ICONS.Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add</span> Transaction
                    </button>
                </>
             )}
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
          <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-100 shadow-inner">
            <label className="label-professional">Value (INR)</label>
            <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-300 text-2xl">₹</span>
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
                  className="input-professional !pl-10 !text-3xl font-black text-blue-600 !py-4 !border-none !shadow-none bg-transparent" 
                  placeholder="0.00" 
                />
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="label-professional">Date</label>
              <CustomDatePicker value={date} onChange={setDate} className="mt-2" />
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

          <div className="flex items-center gap-4 bg-blue-50/70 p-5 rounded-xl border border-blue-100 group cursor-pointer" onClick={() => setIsPersonal(!isPersonal)}>
            <input 
              type="checkbox" 
              checked={isPersonal} 
              onChange={e => setIsPersonal(e.target.checked)}
              className="w-6 h-6 rounded-lg border-gray-300 text-blue-600 focus:ring-4 focus:ring-blue-500/10 accent-blue-600 cursor-pointer"
            />
            <span className="text-xs font-black text-gray-700 select-none">Private / Personal Account Spend</span>
          </div>

          <div>
            <label className="label-professional">Reference Details</label>
            <input value={description} onChange={e => setDescription(e.target.value)} className="input-professional" placeholder="e.g. Weekly Starbucks or Server costs" />
          </div>

          <div className="flex gap-4 pt-8 border-t border-gray-100 sticky bottom-0 bg-white pb-2">
              <AppButton 
                variant="secondary"
                type="button" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                }} 
                className="flex-1 !py-4 uppercase tracking-widest text-[10px]"
              >
                  Discard
              </AppButton>
              <AppButton 
                type="submit" 
                disabled={!isValid}
                className="flex-1 !py-4 uppercase tracking-widest text-[10px] shadow-blue-200"
              >
                {editingId ? 'Update Entry' : 'Confirm Entry'}
              </AppButton>
          </div>
        </form>
      </SidePopover>

      {/* Data Table */}
      <AppCard className="shadow-xl shadow-gray-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="w-10 pl-6 py-4">
                    <input 
                        type="checkbox" 
                        checked={selectedIds.size > 0 && selectedIds.size === filteredExpenses.length}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-4 focus:ring-blue-500/10 accent-blue-600 cursor-pointer"
                    />
                </th>
                <th className="py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left w-40">Date</th>
                <th className="py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left w-32">Channel</th>
                <th className="py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left w-32">Type</th>
                <th className="py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Source/Card</th>
                <th className="py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">Classification</th>
                <th className="py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Value</th>
                <th className="w-10 py-4"></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-24 text-center">
                    <div className="text-gray-300 mb-4 flex justify-center">
                       <ICONS.Expense className="w-12 h-12 opacity-20" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.3em]">No Transactions Found</p>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => {
                  const expIsPersonal = exp.personalExpense ?? true;
                  const paymentParams = getPaymentParams(accounts.find(a => a.id === exp.accountId)?.type || exp.paymentMethod);
                  return (
                    <tr key={exp.id} className={`hover:bg-slate-50/50 transition-all group ${selectedIds.has(exp.id) ? 'bg-blue-50/20' : 'border-b border-slate-100 last:border-0'}`}>
                      <td className="pl-6 py-4">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.has(exp.id)}
                            onChange={() => toggleSelection(exp.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-4 focus:ring-blue-500/10 accent-blue-600 cursor-pointer"
                        />
                      </td>
                      <td className="font-semibold text-gray-900 text-xs tracking-wider py-4">
                        {new Date(exp.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </td>
                      <td className="py-4">
                        <span className={`text-[11px] font-medium px-4 py-1.5 rounded-full tracking-wide border transition-all whitespace-nowrap ${
                          expIsPersonal 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {expIsPersonal ? 'Personal' : 'External'}
                        </span>
                      </td>
                       <td className="py-4">
                        <span className={`text-[11px] font-medium px-3 py-1 rounded-md tracking-wide border whitespace-nowrap ${paymentParams.style}`}>
                          {paymentParams.label}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-semibold text-gray-900">
                           {/* Logic: If Cash, show '-', else show Account Nickname/Name */}
                           {(accounts.find(a => a.id === exp.accountId)?.type === 'cash' || exp.paymentMethod === 'cash') 
                                ? '-' 
                                : (accounts.find(a => a.id === exp.accountId)?.nickname || accounts.find(a => a.id === exp.accountId)?.name || '-')
                           }
                        </span>
                      </td>
                       <td className="py-4">
                        <div className="flex flex-col">
                           <p className="font-medium text-slate-700 text-sm group-hover:text-blue-600 transition-colors">
                            {categories.find(c => c.id === exp.categoryId)?.name || 'Misc'}
                           </p>
                           <p className="text-xs text-slate-400 truncate max-w-[300px] mt-1 font-medium">
                            {exp.description || 'Verified entry'}
                           </p>
                        </div>
                      </td>
                      <td className="text-right font-bold text-slate-800 text-sm py-4">
                        {formatCurrency(exp.amount, 2)}
                      </td>
                      <td className="text-right pl-4 py-4 pr-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleEdit(exp)}
                                className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                                title="Edit"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button 
                                onClick={() => handleDuplicate(exp)}
                                className="p-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-colors"
                                title="Duplicate"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                            <button 
                                onClick={() => handleDelete(exp.id)}
                                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
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

        {/* Pagination Controls */}
        {filteredExpenses.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            {/* Left: Page Info */}
            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-600 font-medium">
                Showing <span className="font-bold text-slate-900">{startIndex + 1}</span> to{' '}
                <span className="font-bold text-slate-900">{Math.min(endIndex, filteredExpenses.length)}</span> of{' '}
                <span className="font-bold text-slate-900">{filteredExpenses.length}</span> transactions
              </p>
              
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-600 font-medium">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="text-sm font-medium border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Right: Page Navigation */}
            <div className="flex items-center gap-2">
              {/* First Page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="First page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Previous Page */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="Previous page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3.5 py-2 text-sm font-bold rounded-lg transition-all ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="Next page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Last Page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                aria-label="Last page"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </AppCard>



    </div>
  );
};

export default ExpenseManager;