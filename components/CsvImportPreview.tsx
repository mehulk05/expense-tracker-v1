import React, { useState } from 'react';
import { CustomDatePicker } from './ui/CustomDatePicker';
import SidePopover from './SidePopover';
import { ImportedExpense, Account, Category, AccountType } from '../types';
import { ICONS } from '../constants';
import { formatCurrency, formatInputAmount } from '../utils/currency';
import { AppButton } from './ui/AppButton';

interface CsvImportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: ImportedExpense[];
  accounts: Account[];
  categories: Category[];
  onSave: (expenses: ImportedExpense[]) => void;
}

const CsvImportPreview: React.FC<CsvImportPreviewProps> = ({
  isOpen,
  onClose,
  expenses: initialExpenses,
  accounts,
  categories,
  onSave
}) => {
  const [expenses, setExpenses] = useState<ImportedExpense[]>(initialExpenses);

  React.useEffect(() => {
    if (isOpen) {
      setExpenses(initialExpenses);
    }
  }, [isOpen, initialExpenses]);

  const handleFieldChange = (id: string, field: keyof ImportedExpense, value: any) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.id === id) {
        const updated = { ...exp, [field]: value };
        
        // Clear validation error when user edits
        if (exp.validationError) {
          updated.validationError = undefined;
        }
        
        // If payment method changes, update account selection
        if (field === 'paymentMethod') {
          const filteredAccounts = accounts.filter(acc => acc.type === value);
          if (filteredAccounts.length > 0) {
            updated.accountId = filteredAccounts[0].id;
          } else {
            updated.accountId = '';
          }
        }
        
        return updated;
      }
      return exp;
    }));
  };

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const handleSave = () => {
    // Filter out expenses with validation errors
    const validExpenses = expenses.filter(exp => !exp.validationError);
    onSave(validExpenses);
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const validCount = expenses.filter(exp => !exp.validationError).length;
  const errorCount = expenses.filter(exp => exp.validationError).length;

  const getPaymentParams = (method: string) => {
    switch(method?.toLowerCase()) {
      case 'upi': return { label: 'UPI', style: 'bg-orange-50 text-orange-600 border-orange-100' };
      case 'credit': return { label: 'Credit Card', style: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'debit': return { label: 'Debit Card', style: 'bg-violet-50 text-violet-600 border-violet-100' };
      case 'cash': return { label: 'Cash', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      default: return { label: method || 'Other', style: 'bg-gray-50 text-gray-500 border-gray-200' };
    }
  };

  return (
    <SidePopover
      isOpen={isOpen}
      onClose={onClose}
      title="CSV Import Preview"
      subtitle="Review and edit imported transactions before saving"
      width="wide"
    >
      {/* Summary Stats */}
      <div className="flex gap-6 mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-xs font-bold text-gray-700">{validCount} Valid</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-xs font-bold text-red-600">{errorCount} Errors</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          <span className="text-xs font-bold text-gray-700">Total: {formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* Content - Table */}
      <div className="-mx-8 flex-1 overflow-y-auto mb-6">
        {expenses.length === 0 ? (
          <div className="text-center py-24 px-8">
            <div className="text-gray-300 mb-4 flex justify-center">
              <ICONS.Expense className="w-16 h-16 opacity-20" />
            </div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">No transactions to import</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-4 text-[10px] font-bold text-gray-900 text-left uppercase tracking-wider">#</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-900 text-left uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-900 text-left uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-900 text-left uppercase tracking-wider">Channel</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-900 text-left uppercase tracking-wider">Type</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-900 text-left uppercase tracking-wider">Account</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-900 text-left uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-[10px] font-bold text-gray-900 text-center uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {expenses.map((exp, index) => {
                const paymentParams = getPaymentParams(exp.paymentMethod);
                const hasError = !!exp.validationError;
                
                return (
                  <tr 
                    key={exp.id} 
                    className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors ${hasError ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                    </td>
                    
                    {/* Date */}
                    <td className="py-3 px-4">
                      <CustomDatePicker
                        value={exp.date}
                        onChange={(date) => handleFieldChange(exp.id, 'date', date)}
                        className="w-36"
                      />
                    </td>
                    
                    {/* Amount */}
                    <td className="py-3 px-4">
                      <div className="relative w-32">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">₹</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formatInputAmount(exp.amount.toString())}
                          onChange={(e) => {
                            const val = e.target.value.replace(/,/g, '');
                            if (!isNaN(Number(val)) || val === '') {
                              handleFieldChange(exp.id, 'amount', parseFloat(val) || 0);
                            }
                          }}
                          className="w-full pl-5 pr-2 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                        />
                      </div>
                    </td>
                    
                    {/* Channel (Personal/External) */}
                    <td className="py-3 px-4">
                      <select
                        value={exp.personalExpense ? 'personal' : 'external'}
                        onChange={(e) => handleFieldChange(exp.id, 'personalExpense', e.target.value === 'personal')}
                        className="px-3 py-1.5 text-[9px] font-black uppercase border border-gray-200 rounded-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                      >
                        <option value="personal">Personal</option>
                        <option value="external">External</option>
                      </select>
                    </td>
                    
                    {/* Payment Type */}
                    <td className="py-3 px-4">
                      <select
                        value={exp.paymentMethod}
                        onChange={(e) => handleFieldChange(exp.id, 'paymentMethod', e.target.value as AccountType)}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase border rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all cursor-pointer ${paymentParams.style}`}
                      >
                        <option value="upi">UPI</option>
                        <option value="credit">Credit</option>
                        <option value="debit">Debit</option>
                        <option value="cash">Cash</option>
                      </select>
                    </td>
                    
                    {/* Account */}
                    <td className="py-3 px-4">
                      <select
                        value={exp.accountId}
                        onChange={(e) => handleFieldChange(exp.id, 'accountId', e.target.value)}
                        className={`w-44 px-2 py-1.5 text-xs font-semibold border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all cursor-pointer ${hasError ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                      >
                        {accounts
                          .filter(acc => acc.type === exp.paymentMethod)
                          .map(acc => (
                            <option key={acc.id} value={acc.id}>
                              {acc.nickname || acc.name}
                            </option>
                          ))
                        }
                        {accounts.filter(acc => acc.type === exp.paymentMethod).length === 0 && (
                          <option value="">No {exp.paymentMethod} accounts</option>
                        )}
                      </select>
                      {hasError && (
                        <p className="text-[10px] text-red-600 font-bold mt-1">{exp.validationError}</p>
                      )}
                    </td>
                    
                    {/* Category */}
                    <td className="py-3 px-4">
                      <select
                        value={exp.categoryId}
                        onChange={(e) => handleFieldChange(exp.id, 'categoryId', e.target.value)}
                        className="w-44 px-2 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </td>
                    
                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-all active:scale-95"
                        title="Delete row"
                      >
                        <ICONS.Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Actions - Fixed at bottom */}
      <div className="border-t border-gray-200 pt-6 -mx-8 px-8 -mb-8 pb-8 bg-white">
        <div className="flex gap-3">
          <AppButton
            variant="secondary"
            onClick={onClose}
            className="flex-1 !py-2.5 !text-xs !font-bold uppercase tracking-wider"
          >
            Cancel Import
          </AppButton>
          <AppButton
            onClick={handleSave}
            disabled={validCount === 0}
            className="flex-1 !py-2.5 !text-xs !font-bold uppercase tracking-wider"
          >
            Save {validCount} Transaction{validCount !== 1 ? 's' : ''}
          </AppButton>
        </div>
        
        {errorCount > 0 && (
          <p className="text-[10px] text-red-600 font-bold mt-3 text-center">
            {errorCount} transaction{errorCount !== 1 ? 's' : ''} with errors will be skipped
          </p>
        )}
      </div>
    </SidePopover>
  );
};

export default CsvImportPreview;
