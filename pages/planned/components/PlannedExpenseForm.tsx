import React, { useState, useEffect } from 'react';
import { CustomDatePicker } from '../../../components/ui/CustomDatePicker';
import { PlannedExpense, Category, Account } from '../../../types';
import { ICONS } from '../../../constants';

interface PlannedExpenseFormProps {
    expense?: PlannedExpense | null;
    categories: Category[];
    accounts: Account[];
    onSave: (expense: PlannedExpense) => void;
    onCancel: () => void;
}

const PlannedExpenseForm: React.FC<PlannedExpenseFormProps> = ({ expense, categories, accounts, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<PlannedExpense>>({
        name: '',
        amount: 0,
        category: '',
        frequency: 'monthly',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'upcoming',
        paymentMethod: 'credit',
        note: ''
    });

    useEffect(() => {
        if (expense) {
            setFormData({
                ...expense,
                dueDate: expense.dueDate.split('T')[0] // Ensure date input format
            });
        }
    }, [expense]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic Validation
        if (!formData.name || !formData.amount || !formData.category || !formData.dueDate) return;
        
        // Account validation for tracked methods
        if (['credit', 'debit', 'upi'].includes(formData.paymentMethod || '') && !formData.cardId) {
             alert('Please select an account');
             return;
        }

        const newExpense: PlannedExpense = {
            id: expense?.id || crypto.randomUUID(),
            name: formData.name!,
            amount: Number(formData.amount),
            category: formData.category!,
            frequency: formData.frequency as any,
            dueDate: new Date(formData.dueDate!).toISOString(),
            status: formData.status as any,
            paymentMethod: formData.paymentMethod!,
            cardId: formData.cardId || null, // Ensure not undefined
            note: formData.note,
            createdAt: expense?.createdAt || new Date().toISOString()
        };
        onSave(newExpense);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
             {/* Name */}
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Expense Name</label>
                <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g. Netflix Subscription"
                />
            </div>

            {/* Amount & Category */}
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Amount</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input 
                            type="number" 
                            required
                            min="0"
                            value={formData.amount}
                            onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
                            className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="0.00"
                        />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                    <select
                         required
                         value={formData.category}
                         onChange={e => setFormData({...formData, category: e.target.value})}
                         className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none bg-white"
                     >
                         <option value="">Select</option>
                         {categories.map(cat => (
                             <option key={cat.id} value={cat.name}>{cat.name}</option>
                         ))}
                    </select>
                </div>
            </div>

             {/* Frequency & Date */}
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Frequency</label>
                    <select
                         value={formData.frequency}
                         onChange={e => setFormData({...formData, frequency: e.target.value as any})}
                         className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none bg-white"
                     >
                         <option value="one-time">One-Time</option>
                         <option value="weekly">Weekly</option>
                         <option value="monthly">Monthly</option>
                         <option value="yearly">Yearly</option>
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Due Date</label>
                    <CustomDatePicker 
                        value={formData.dueDate || ''}
                        onChange={date => setFormData({...formData, dueDate: date})}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Payment Method */}
            <div>
                 <label className="block text-sm font-bold text-slate-700 mb-1">Payment Method</label>
                 <div className="grid grid-cols-2 gap-4 mb-3">
                     <select
                         value={formData.paymentMethod}
                         onChange={e => setFormData({...formData, paymentMethod: e.target.value, cardId: undefined})}
                         className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none bg-white"
                     >
                         <option value="credit">Credit Card</option>
                         <option value="debit">Debit Card</option>
                         <option value="upi">UPI</option>
                         <option value="cash">Cash</option>
                    </select>
                    {/* Account Selection */}
                    {(formData.paymentMethod === 'credit' || formData.paymentMethod === 'debit' || formData.paymentMethod === 'upi') && (
                         <select
                            value={formData.cardId || ''}
                            onChange={e => setFormData({...formData, cardId: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none bg-white"
                            required
                        >
                            <option value="">Select Account</option>
                            {accounts.filter(acc => acc.type === formData.paymentMethod).map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name} {acc.lastFour ? `(...${acc.lastFour})` : ''}</option>
                            ))}
                        </select>
                    )}
                 </div>
            </div>

             {/* Status Flag */}
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Current Status</label>
                <div className="flex gap-2">
                    {['upcoming', 'paid', 'overdue'].map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setFormData({...formData, status: s as any})}
                            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize border transition-all ${formData.status === s 
                                ? s === 'paid' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' 
                                : s === 'overdue' ? 'bg-rose-50 border-rose-500 text-rose-600'
                                : 'bg-indigo-50 border-indigo-500 text-indigo-600'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
             </div>

             {/* Notes */}
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Note (Optional)</label>
                <textarea 
                    rows={3}
                    value={formData.note}
                    onChange={e => setFormData({...formData, note: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                    placeholder="Add details..."
                />
            </div>

            {/* Actions */}
            <div className="fixed bottom-0 right-0 p-6 bg-white border-t border-slate-100 w-full md:w-[450px] flex items-center gap-3">
                 <button 
                    type="button" 
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all border border-transparent"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    className="flex-1 btn-primary py-3 px-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
                >
                    {expense ? 'Update Expense' : 'Create Expense'}
                </button>
            </div>
        </form>
    );
};

export default PlannedExpenseForm;
