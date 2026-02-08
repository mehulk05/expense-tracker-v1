import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImportedExpense, Account, Category, AccountType, Expense } from '../types';
import { ICONS } from '../constants';
import { formatCurrency, formatInputAmount } from '../utils/currency';
import { AppButton } from '../components/ui/AppButton';
import { parseCsvForPreview } from '../utils/importHelpers';
import { storage } from '../services/storage';
import { useToast } from '../context/ToastContext';

// Category icon mapping (same as CategoryManager)
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

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

const CsvImportPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [existingExpenses, setExistingExpenses] = useState<Expense[]>([]);
  const [expenses, setExpenses] = useState<ImportedExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [missingCategories, setMissingCategories] = useState<string[]>([]);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [accountsData, categoriesData, expensesData] = await Promise.all([
      storage.getAccounts(),
      storage.getCategories(),
      storage.getExpenses()
    ]);
    setAccounts(accountsData);
    setCategories(categoriesData);
    setExistingExpenses(expensesData);
  };

  const checkDuplicate = (expense: ImportedExpense): boolean => {
    return existingExpenses.some(existing => 
      existing.date === expense.date &&
      existing.amount === expense.amount &&
      existing.accountId === expense.accountId &&
      existing.categoryId === expense.categoryId &&
      existing.description === expense.description &&
      existing.personalExpense === expense.personalExpense &&
      existing.paymentMethod === expense.paymentMethod
    );
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImportResult(null);
    
    try {
      const { expenses: parsedExpenses, hasErrors } = await parseCsvForPreview(file, accounts, categories);
      
      if (parsedExpenses.length === 0) {
        addToast('No valid transactions found in CSV file', 'error');
      } else {
        // Check for duplicates
        const expensesWithDuplicateFlag = parsedExpenses.map(exp => {
          const isDup = checkDuplicate(exp);
          return {
            ...exp,
            isDuplicate: isDup,
            skipDuplicate: isDup // Default to skip duplicates
          };
        });
        
        // Extract missing categories from validation errors
        const missing = new Set<string>();
        expensesWithDuplicateFlag.forEach(exp => {
          if (exp.validationError && exp.validationError.includes('Category')) {
            const match = exp.validationError.match(/Category "([^"]+)" not found/);
            if (match && match[1]) {
              missing.add(match[1]);
            }
          }
        });
        setMissingCategories(Array.from(missing));
        
        const duplicateCount = expensesWithDuplicateFlag.filter(exp => exp.isDuplicate).length;
        const categoryErrors = missing.size;
        
        setExpenses(expensesWithDuplicateFlag);
        setShowPreview(true);
        
        if (categoryErrors > 0) {
          addToast(`Found ${categoryErrors} missing categor${categoryErrors !== 1 ? 'ies' : 'y'}. Create them to proceed.`, 'warning');
        } else if (duplicateCount > 0) {
          addToast(`Found ${duplicateCount} duplicate transaction${duplicateCount !== 1 ? 's' : ''}. Review before importing.`, 'warning');
        } else if (hasErrors) {
          addToast(`Loaded ${parsedExpenses.length} transactions with some errors. Please review.`, 'info');
        } else {
          addToast(`Loaded ${parsedExpenses.length} transactions for review`, 'success');
        }
      }
    } catch (error) {
      console.error("Import failed:", error);
      addToast("Failed to parse CSV file.", 'error');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFieldChange = (id: string, field: keyof ImportedExpense, value: any) => {
    setExpenses(prev => prev.map(exp => {
      if (exp.id === id) {
        const updated = { ...exp, [field]: value };
        
        if (exp.validationError) {
          updated.validationError = undefined;
        }
        
        if (field === 'paymentMethod') {
          const filteredAccounts = accounts.filter(acc => acc.type === value);
          if (filteredAccounts.length > 0) {
            updated.accountId = filteredAccounts[0].id;
          } else {
            updated.accountId = '';
          }
        }
        
        // Re-check for duplicates after field change
        const isDup = checkDuplicate(updated);
        updated.isDuplicate = isDup;
        
        // Update skipDuplicate based on new duplicate status
        // If it becomes a duplicate, set skipDuplicate to true (default behavior)
        // If it's no longer a duplicate, set skipDuplicate to false (enable import)
        updated.skipDuplicate = isDup;
        
        return updated;
      }
      return exp;
    }));
  };

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const handleToggleSkipDuplicate = (id: string) => {
    setExpenses(prev => prev.map(exp => 
      exp.id === id ? { ...exp, skipDuplicate: !exp.skipDuplicate } : exp
    ));
  };

  const handleToggleAllDuplicates = () => {
    const duplicates = expenses.filter(exp => exp.isDuplicate && !exp.validationError);
    if (duplicates.length === 0) return;
    
    // If all duplicates are currently set to skip, then uncheck all (keep all)
    // Otherwise, check all (skip all)
    const allSkipped = duplicates.every(exp => exp.skipDuplicate);
    
    setExpenses(prev => prev.map(exp => 
      exp.isDuplicate && !exp.validationError 
        ? { ...exp, skipDuplicate: !allSkipped } 
        : exp
    ));
  };

  const handleImport = async () => {
    setLoading(true);
    const result: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    try {
      const validExpenses = expenses.filter(exp => !exp.validationError && !exp.skipDuplicate);
      const invalidExpenses = expenses.filter(exp => exp.validationError);
      const skippedDuplicates = expenses.filter(exp => exp.isDuplicate && exp.skipDuplicate && !exp.validationError);
      
      result.skipped = invalidExpenses.length + skippedDuplicates.length;

      // Handle cash account creation if needed
      let cashAccountId = accounts.find(acc => acc.type === 'cash')?.id;
      
      if (!cashAccountId && validExpenses.some(exp => exp.paymentMethod === 'cash')) {
        const cashAcc = {
          id: crypto.randomUUID(),
          name: 'Cash',
          nickname: 'Cash',
          type: 'cash' as AccountType
        };
        await storage.saveAccount(cashAcc);
        cashAccountId = cashAcc.id;
      }

      // Save all valid, non-duplicate expenses
      for (const expense of validExpenses) {
        try {
          const finalExpense = {
            ...expense,
            accountId: expense.accountId === 'cash-placeholder' ? cashAccountId! : expense.accountId
          };
          
          const { validationError, originalRow, isDuplicate, ...expenseToSave } = finalExpense;
          await storage.saveExpense(expenseToSave as any);
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Row ${expense.originalRow}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setImportResult(result);
      
      if (result.success > 0) {
        addToast(`Successfully imported ${result.success} transaction${result.success !== 1 ? 's' : ''}!`, 'success');
      }
      
      if (skippedDuplicates.length > 0) {
        addToast(`Skipped ${skippedDuplicates.length} duplicate transaction${skippedDuplicates.length !== 1 ? 's' : ''}`, 'info');
      }
      
      if (result.failed > 0) {
        addToast(`Failed to import ${result.failed} transaction${result.failed !== 1 ? 's' : ''}`, 'error');
      }

    } catch (error) {
      console.error('Import failed:', error);
      addToast('Import process failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setExpenses([]);
    setShowPreview(false);
    setImportResult(null);
    setMissingCategories([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateSingleCategory = async (categoryName: string) => {
    try {
      const newCat: Category = {
        id: crypto.randomUUID(),
        name: categoryName
      };
      await storage.saveCategory(newCat);
      const updatedCategories = [...categories, newCat];
      setCategories(updatedCategories);
      
      // Re-validate expenses with the new category
      revalidateExpenses(updatedCategories, [categoryName]);
      
      addToast(`Category "${categoryName}" created successfully`, 'success');
    } catch (error) {
      addToast(`Failed to create category "${categoryName}"`, 'error');
    }
  };

  const handleCreateAllCategories = async () => {
    setLoading(true);
    try {
      const newCategories: Category[] = [];
      
      for (const catName of missingCategories) {
        const newCat: Category = {
          id: crypto.randomUUID(),
          name: catName
        };
        await storage.saveCategory(newCat);
        newCategories.push(newCat);
      }
      
      const updatedCategories = [...categories, ...newCategories];
      setCategories(updatedCategories);
      
      // Re-validate all expenses
      revalidateExpenses(updatedCategories, missingCategories);
      
      addToast(`Created ${newCategories.length} categories successfully`, 'success');
    } catch (error) {
      addToast('Failed to create categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const revalidateExpenses = (updatedCategories: Category[], createdCategoryNames: string[]) => {
    setExpenses(prev => prev.map(exp => {
      // Only re-validate if this expense had a category error
      if (exp.validationError && exp.validationError.includes('Category')) {
        const match = exp.validationError.match(/Category "([^"]+)" not found/);
        if (match && match[1] && createdCategoryNames.includes(match[1])) {
          const categoryName = match[1];
          const category = updatedCategories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
          
          if (category) {
            // Clear the category error
            const otherErrors = exp.validationError.split(';').filter(err => !err.includes('Category')).join(';');
            return {
              ...exp,
              categoryId: category.id,
              validationError: otherErrors || undefined
            };
          }
        }
      }
      return exp;
    }));
    
    // Remove created categories from missing list
    setMissingCategories(prev => prev.filter(cat => !createdCategoryNames.includes(cat)));
  };

  const handleBackToExpenses = () => {
    navigate('/expenses/actual');
  };

  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const validCount = expenses.filter(exp => !exp.validationError && !exp.skipDuplicate).length;
  const errorCount = expenses.filter(exp => exp.validationError).length;
  const duplicateCount = expenses.filter(exp => exp.isDuplicate && exp.skipDuplicate && !exp.validationError).length;
  const totalDuplicates = expenses.filter(exp => exp.isDuplicate && !exp.validationError).length;

  const getPaymentParams = (method: string) => {
    switch(method?.toLowerCase()) {
      case 'upi': return { label: 'UPI', style: 'bg-orange-50 text-orange-600 border-orange-100' };
      case 'credit': return { label: 'Credit Card', style: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'debit': return { label: 'Debit Card', style: 'bg-violet-50 text-violet-600 border-violet-100' };
      case 'cash': return { label: 'Cash', style: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      default: return { label: method || 'Other', style: 'bg-slate-50 text-slate-500 border-slate-200' };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToExpenses}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Back to Expenses"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <ICONS.Expense className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CSV Import</h1>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Upload and import expense transactions from CSV file</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {!showPreview && !importResult ? (
          // Upload Section
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="mb-6">
                <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4">
                  <ICONS.Plus className="w-12 h-12 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Upload CSV File</h2>
                <p className="text-sm text-slate-600">
                  Select a CSV file containing your expense transactions to import
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-file-input"
              />
              
              <label 
                htmlFor="csv-file-input"
                className={`inline-flex items-center justify-center gap-2 px-8 py-3 font-bold rounded-lg transition-all active:scale-[0.98] ${
                  loading 
                    ? 'bg-blue-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-100 cursor-pointer'
                }`}
              >
                {loading ? 'Processing...' : 'Choose CSV File'}
              </label>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Expected CSV Format</p>
                <div className="text-left bg-slate-50 rounded-lg p-4 text-xs font-mono text-slate-700">
                  Date, Personal/Other, Type, Reason/Spent On, Amount, Paid from, Bank/Card
                </div>
              </div>
            </div>
          </div>
        ) : importResult ? (
          // Import Result Section
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="text-center mb-8">
                <div className={`inline-flex p-4 rounded-full mb-4 ${importResult.success > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  {importResult.success > 0 ? (
                    <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Import Complete</h2>
                <p className="text-sm text-slate-600">Review the import summary below</p>
              </div>

              {/* Import Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{importResult.success}</div>
                  <div className="text-xs font-bold text-green-700 uppercase tracking-wider">Success</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">{importResult.failed}</div>
                  <div className="text-xs font-bold text-red-700 uppercase tracking-wider">Failed</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-1">{importResult.skipped}</div>
                  <div className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Skipped</div>
                </div>
              </div>

              {/* Error Details */}
              {importResult.errors.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Error Details</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-xs text-red-700 font-medium mb-2 last:mb-0">
                        • {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <AppButton
                  variant="secondary"
                  onClick={handleReset}
                  className="flex-1"
                >
                  Import Another File
                </AppButton>
                <AppButton
                  onClick={handleBackToExpenses}
                  className="flex-1"
                >
                  View Expenses
                </AppButton>
              </div>
            </div>
          </div>
        ) : (
          // Preview Section
          <>
            {/* Missing Categories Alert */}
            {missingCategories.length > 0 && (
              <div className="space-y-3 mb-6">
                {/* Header Banner */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-orange-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {missingCategories.length} categor{missingCategories.length !== 1 ? 'ies' : 'y'} need to be created
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Create categories to proceed with import
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleCreateAllCategories}
                    disabled={loading}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-orange-600 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                  >
                    <ICONS.Plus className="w-4 h-4" />
                    <span>Create All</span>
                  </button>
                </div>

                {/* Individual Category Cards */}
                <div className="space-y-2">
                  {missingCategories.map(catName => {
                    // Count how many transactions use this category
                    const usageCount = expenses.filter(exp => 
                      exp.validationError?.includes(`Category "${catName}" not found`)
                    ).length;
                    
                    return (
                      <div key={catName} className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between hover:border-orange-300 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCategoryIcon(catName)}</span>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{catName}</p>
                            <p className="text-xs text-slate-500">Used in {usageCount} transaction{usageCount !== 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleCreateSingleCategory(catName)}
                          disabled={loading}
                          className="px-4 py-1.5 text-orange-600 border border-orange-300 hover:bg-orange-50 rounded-lg text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <ICONS.Plus className="w-3.5 h-3.5" />
                          <span>Create</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {/* Summary Stats with Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-bold text-slate-700">{validCount} Valid Transactions</span>
                  </div>
                  {errorCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm font-bold text-red-600">{errorCount} Errors</span>
                    </div>
                  )}
                  {duplicateCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-bold text-yellow-600">{duplicateCount} Duplicates</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-sm font-bold text-slate-700">Total: {formatCurrency(totalAmount)}</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={validCount === 0 || loading}
                    className="px-6 py-2 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                  >
                    {loading ? 'Importing...' : `Import ${validCount} Transaction${validCount !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
              
              {(errorCount > 0 || totalDuplicates > 0) && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {errorCount > 0 && (
                    <p className="text-xs text-red-600 font-semibold">
                      ⚠️ {errorCount} transaction{errorCount !== 1 ? 's' : ''} with errors will be skipped during import
                    </p>
                  )}
                  {totalDuplicates > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-yellow-600 font-semibold">
                        🔄 {totalDuplicates} duplicate transaction{totalDuplicates !== 1 ? 's' : ''} found. {duplicateCount} will be skipped.
                      </p>
                      <button
                        onClick={handleToggleAllDuplicates}
                        className="px-3 py-1.5 text-xs font-bold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg transition-all"
                      >
                        {duplicateCount === totalDuplicates ? 'Keep All Duplicates' : 'Skip All Duplicates'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-visible">
                <table className="min-w-full">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3 px-3 text-[10px] font-bold text-slate-900 text-left uppercase tracking-wider w-16">#</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-slate-900 text-center uppercase tracking-wider w-16">Skip?</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-slate-900 text-left uppercase tracking-wider w-28">Date</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-slate-900 text-left uppercase tracking-wider w-28">Amount</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-slate-900 text-left uppercase tracking-wider w-24">Channel</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-slate-900 text-left uppercase tracking-wider w-24">Type</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-slate-900 text-left uppercase tracking-wider">Account</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-slate-900 text-left uppercase tracking-wider">Category</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-slate-900 text-center uppercase tracking-wider w-16">Del</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {expenses.map((exp, index) => {
                      const paymentParams = getPaymentParams(exp.paymentMethod);
                      const hasError = !!exp.validationError;
                      const isDuplicate = !!exp.isDuplicate;
                      
                      return (
                        <tr 
                          key={exp.id} 
                          className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors ${
                            hasError ? 'bg-red-50/30' : (isDuplicate && exp.skipDuplicate) ? 'bg-yellow-50/30' : ''
                          }`}
                        >
                          {/* Row Number */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                              {isDuplicate && !hasError && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200" title="Duplicate transaction">
                                  DUP
                                </span>
                              )}
                            </div>
                          </td>
                          
                          {/* Skip Duplicate Checkbox */}
                          <td className="py-3 px-3 text-center">
                            {isDuplicate && !hasError ? (
                              <input
                                type="checkbox"
                                checked={exp.skipDuplicate || false}
                                onChange={() => handleToggleSkipDuplicate(exp.id)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                title={exp.skipDuplicate ? "Will skip this duplicate" : "Will import this duplicate"}
                              />
                            ) : (
                              <span className="text-xs text-slate-800">—</span>
                            )}
                          </td>
                          
                          {/* Date */}
                          <td className="py-3 px-3">
                            <input
                              type="date"
                              value={exp.date}
                              onChange={(e) => handleFieldChange(exp.id, 'date', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                            />
                          </td>
                          
                          {/* Amount */}
                          <td className="py-3 px-3">
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
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
                                className="w-full pl-5 pr-2 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                              />
                            </div>
                          </td>
                          
                          {/* Channel */}
                          <td className="py-3 px-3">
                            <select
                              value={exp.personalExpense ? 'personal' : 'external'}
                              onChange={(e) => handleFieldChange(exp.id, 'personalExpense', e.target.value === 'personal')}
                              className="w-full px-2 py-1.5 text-[9px] font-bold uppercase border border-slate-200 rounded-full focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                            >
                              <option value="personal">Personal</option>
                              <option value="external">External</option>
                            </select>
                          </td>
                          
                          {/* Type */}
                          <td className="py-3 px-3">
                            <select
                              value={exp.paymentMethod}
                              onChange={(e) => handleFieldChange(exp.id, 'paymentMethod', e.target.value as AccountType)}
                              className={`w-full px-2 py-1.5 text-[9px] font-bold uppercase border rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all cursor-pointer ${paymentParams.style}`}
                            >
                              <option value="upi">UPI</option>
                              <option value="credit">Credit</option>
                              <option value="debit">Debit</option>
                              <option value="cash">Cash</option>
                            </select>
                          </td>
                          
                          {/* Account */}
                          <td className="py-3 px-3">
                            {(() => {
                              const accountError = exp.validationError?.split(';').find(err => !err.includes('Category'))?.trim();
                              const hasAccountError = !!accountError;
                              
                              return (
                                <>
                                  <select
                                    value={exp.accountId}
                                    onChange={(e) => handleFieldChange(exp.id, 'accountId', e.target.value)}
                                    className={`w-full px-2 py-1.5 text-xs font-semibold border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all cursor-pointer ${hasAccountError ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
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
                                  {hasAccountError && (
                                    <p className="text-[10px] text-red-600 font-bold mt-1">{accountError}</p>
                                  )}
                                </>
                              );
                            })()}
                          </td>
                          
                          {/* Category */}
                          <td className="py-3 px-3">
                            {(() => {
                              const categoryError = exp.validationError?.split(';').find(err => err.includes('Category'))?.trim();
                              const hasCategoryError = !!categoryError;
                              
                              return (
                                <>
                                  <select
                                    value={exp.categoryId}
                                    onChange={(e) => handleFieldChange(exp.id, 'categoryId', e.target.value)}
                                    className={`w-full px-2 py-1.5 text-xs font-semibold border rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all cursor-pointer ${hasCategoryError ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                                  >
                                    {categories.map(cat => (
                                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                  </select>
                                  {hasCategoryError && (
                                    <p className="text-[10px] text-red-600 font-bold mt-1">{categoryError}</p>
                                  )}
                                </>
                              );
                            })()}
                          </td>
                          
                          {/* Delete Action */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleDelete(exp.id)}
                              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all active:scale-95"
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
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CsvImportPage;
