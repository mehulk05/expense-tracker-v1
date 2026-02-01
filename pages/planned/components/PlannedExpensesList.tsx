import React from 'react';
import { PlannedExpense } from '../../../types';
import { ICONS } from '../../../constants';

interface PlannedExpensesListProps {
    expenses: PlannedExpense[];
    onEdit: (expense: PlannedExpense) => void;
    onDelete: (id: string) => void;
    onToggleStatus: (expense: PlannedExpense) => void;
}

const PlannedExpensesList: React.FC<PlannedExpensesListProps> = ({ expenses, onEdit, onDelete, onToggleStatus }) => {
    
    // Helper to format date
    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('en-US', { month: 'short' }),
            full: date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })
        };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'upcoming': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'due': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'overdue': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'paid': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    if (expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                    <ICONS.Calendar className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No Recurring Expenses</h3>
                <p className="text-slate-500 max-w-sm mb-6">Start tracking your subscriptions, EMIs, and bills to never miss a payment.</p>
                {/* Button actions usually handled by parent add button */}
            </div>
        );
    }

    return (
        <div className="relative space-y-8 pl-4 py-2">
             {/* Vertical Timeline Line */}
             <div className="absolute left-[2.9rem] top-4 bottom-4 w-0.5 bg-slate-200" />

             {expenses.map((expense) => {
                 const date = formatDate(expense.dueDate);
                 return (
                    <div key={expense.id} className="relative z-10 group flex items-start bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-indigo-100">
                        {/* Date Badge - Overlaid on timeline */}
                        <div className="flex-shrink-0 w-16 h-16 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center mr-6 shadow-sm z-10 relative">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{date.month}</span>
                            <span className="text-xl font-bold text-slate-800">{date.day}</span>
                            
                            {/* Connector dot */}
                            <div className="absolute -left-[1.35rem] top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-sm hidden md:block" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 mr-4 pt-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                <h3 className="text-lg font-bold text-slate-800 truncate">{expense.name}</h3>
                                {(expense.frequency !== 'one-time') && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                        {expense.frequency}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                    <ICONS.Category className="w-3.5 h-3.5 text-slate-400" />
                                    {expense.category}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <ICONS.Cards className="w-3.5 h-3.5 text-slate-400" />
                                    {expense.paymentMethod} {expense.cardId && '(...)'}
                                </span>
                            </div>
                        </div>

                        {/* Amount & Status */}
                        <div className="text-right pt-1">
                            <p className="text-xl font-bold text-slate-900 mb-1.5">₹{expense.amount.toLocaleString()}</p>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize border ${getStatusColor(expense.status)}`}>
                                {expense.status}
                            </span>
                        </div>

                        {/* Actions (Floating on Hover) */}
                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2">
                             <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(expense); }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                                <ICONS.Edit className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(expense.id); }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                                <ICONS.Delete className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                 );
             })}
        </div>
    );
};

export default PlannedExpensesList;
