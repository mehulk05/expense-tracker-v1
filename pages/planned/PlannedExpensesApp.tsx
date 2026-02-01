import React, { useState, useEffect, useMemo } from 'react';
import { PlannedExpense, Category, Account } from '../../types';
import { storage } from '../../services/storage';
import { ICONS } from '../../constants';
import SidePopover from '../../components/SidePopover';
import PlannedExpensesList from './components/PlannedExpensesList';
import PlannedExpensesStats from './components/PlannedExpensesStats';
import PlannedExpenseForm from './components/PlannedExpenseForm';
import ProjectedExpensesChart from './components/ProjectedExpensesChart';
import { useToast } from '../../context/ToastContext';

const PlannedExpensesApp: React.FC = () => {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState<PlannedExpense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    
    // Add/Edit State
    const [showForm, setShowForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState<PlannedExpense | null>(null);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'date' | 'amount'>('date');

    const loadData = async () => {
        setLoading(true);
        try {
            const [fetchedExpenses, fetchedCategories, fetchedAccounts] = await Promise.all([
                storage.getPlannedExpenses(),
                storage.getCategories(),
                storage.getAccounts()
            ]);
            setExpenses(fetchedExpenses);
            setCategories(fetchedCategories);
            setAccounts(fetchedAccounts);
        } catch (error) {
            console.error("Failed to load planned expenses", error);
            addToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // --- Actions ---
    const handleSave = async (expense: PlannedExpense) => {
        try {
            await storage.savePlannedExpense(expense);
            addToast(editingExpense ? 'Expense updated' : 'Expense scheduled', 'success');
            setShowForm(false);
            setEditingExpense(null);
            loadData();
        } catch (error) {
            addToast('Failed to save expense', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to stop tracking this expense?')) return;
        try {
            await storage.deletePlannedExpense(id);
            addToast('Expense removed', 'success');
            loadData();
        } catch (error) {
            addToast('Failed to delete expense', 'error');
        }
    };

    const handleToggleStatus = async (expense: PlannedExpense) => {
         // This logic could be complex (e.g. duplicating for next month). 
         // For now simpler toggle for implementation MVP. 
         // Real app would likely ask "Mark as paid? Create transaction?"
         // We will just update status locally for now.
         const newStatus = expense.status === 'paid' ? 'upcoming' : 'paid';
         const updated = { ...expense, status: newStatus as any };
         await handleSave(updated);
    };

    // --- Derived Data ---
    const filteredExpenses = useMemo(() => {
        let result = [...expenses];
        if (categoryFilter) {
            result = result.filter(e => e.category === categoryFilter);
        }
        
        result.sort((a,b) => {
            if (sortOrder === 'amount') return b.amount - a.amount;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });

        return result;
    }, [expenses, categoryFilter, sortOrder]);

    const stats = useMemo(() => {
        const monthlyCommitment = expenses.reduce((sum, e) => {
            if (e.frequency === 'monthly') return sum + e.amount;
            if (e.frequency === 'yearly') return sum + (e.amount / 12);
            if (e.frequency === 'weekly') return sum + (e.amount * 4);
            return sum;
        }, 0);

        const activeCount = expenses.length;
        const upcomingCount = expenses.filter(e => e.status === 'upcoming').length;
        
        const sortedByDate = [...expenses].filter(e => e.status !== 'paid').sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const nextPaymentDate = sortedByDate.length > 0 ? new Date(sortedByDate[0].dueDate) : null;

        return { monthlyCommitment, activeCount, upcomingCount, nextPaymentDate };
    }, [expenses]);

    if (loading) return <div className="p-8"><div className="h-10 w-48 skeleton rounded mb-8"></div></div>;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row bg-slate-50/50 min-h-full">
            
            {/* Main Content (60%) */}
            <div className="flex-1 flex flex-col min-w-0 p-6 md:p-8">
                
                {/* Header */}
                 <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recurring Expenses</h1>
                        <p className="text-slate-500 text-sm">Manage subscriptions & planned payments</p>
                    </div>
                    <button 
                        onClick={() => { setEditingExpense(null); setShowForm(true); }}
                        className="btn-primary !rounded-xl !py-2.5 !px-5 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center gap-2"
                    >
                        <ICONS.Plus className="w-5 h-5" />
                        <span>Add Expense</span>
                    </button>
                </div>

                {/* Top Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly</p>
                        <p className="text-xl font-bold text-slate-800">₹{Math.round(stats.monthlyCommitment).toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Upcoming</p>
                        <p className="text-xl font-bold text-slate-800">{stats.upcomingCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active</p>
                        <p className="text-xl font-bold text-slate-800">{stats.activeCount}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Next Payment</p>
                        <p className="text-sm font-bold text-slate-800">
                            {stats.nextPaymentDate ? stats.nextPaymentDate.toLocaleDateString(undefined, {month:'short', day:'numeric'}) : '-'}
                        </p>
                    </div>
                </div>

                {/* Projected Cashflow Chart */}
                <ProjectedExpensesChart expenses={expenses} />

                {/* Timeline List */}
                <div className="flex-1">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Timeline</h3>
                        <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
                            <button 
                                onClick={() => setSortOrder('date')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sortOrder === 'date' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Date
                            </button>
                            <button 
                                onClick={() => setSortOrder('amount')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sortOrder === 'amount' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Amount
                            </button>
                        </div>
                     </div>

                     <PlannedExpensesList 
                        expenses={filteredExpenses} 
                        onEdit={(e) => { setEditingExpense(e); setShowForm(true); }}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                     />
                </div>
            </div>

            {/* Right Sidebar (40%) */}
            <div className="w-full md:w-[400px] border-l border-slate-200 bg-white p-6">
                <PlannedExpensesStats 
                    expenses={expenses}
                    categoryFilter={categoryFilter}
                    setCategoryFilter={setCategoryFilter}
                />
            </div>

            {/* Add/Edit Form Popover */}
            <SidePopover
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title={editingExpense ? 'Edit Expense' : 'New Planned Expense'}
            >
                <PlannedExpenseForm 
                    expense={editingExpense}
                    categories={categories}
                    accounts={accounts}
                    onSave={handleSave}
                    onCancel={() => setShowForm(false)}
                />
            </SidePopover>

        </div>
    );
};

export default PlannedExpensesApp;
