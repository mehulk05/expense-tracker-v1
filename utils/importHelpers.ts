import Papa from 'papaparse';
import { Expense, Account, Category, AccountType } from '../types';
import { storage } from '../services/storage';

interface CsvRow {
    Date: string;
    'Personal/Other': string;
    Type: string;
    'Reason/Spent On': string;
    Amount: string;
    'Paid from': string;
    'Bank/Card': string;
}

export const parseAndSaveCsvData = async (
    file: File,
    currentAccounts: Account[],
    currentCategories: Category[]
): Promise<{ importedCount: number; errors: string[] }> => {
    return new Promise((resolve) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as CsvRow[];
                const errors: string[] = [];
                let importedCount = 0;

                // 1. Pre-validation of all rows
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row.Date && !row.Amount) continue; // Skip completely empty rows if any

                    // Check Bank/Card name presence for non-cash
                    const paidFrom = row['Paid from']?.toLowerCase();
                    const bankName = row['Bank/Card']?.trim();
                    const isCash = paidFrom === 'cash';

                    // Rule 1: Bank/Card mandatory for non-cash
                    if (!isCash && !bankName) {
                        errors.push(`Row ${i + 2} (Amount: ${row.Amount}): Bank/Card name is missing. Parse aborted.`);
                        continue;
                    }

                    // Rule 2: Strict match against Account Nickname (if not cash)
                    if (!isCash && bankName) {
                        const match = currentAccounts.find(acc =>
                            (acc.nickname?.toLowerCase() === bankName.toLowerCase()) &&
                            acc.type === (paidFrom === 'credit' ? 'credit' : paidFrom === 'debit' ? 'debit' : 'upi')
                        );

                        if (!match) {
                            errors.push(`Row ${i + 2} (Amount: ${row.Amount}): No account found with nickname "${bankName}" for type "${paidFrom}". Please add this account in Account Manager first.`);
                        }
                    }
                }

                if (errors.length > 0) {
                    resolve({ importedCount: 0, errors });
                    return;
                }

                // Local cache of accounts to handle new accounts created during this import
                const knownAccounts = [...currentAccounts];

                for (const row of rows) {
                    try {
                        // Basic Validation
                        if (!row.Date || !row.Amount) continue;

                        // Parse Date
                        // Format: "January 1, 2026" or YYYY-MM-DD
                        // We need to parse this maintaining the LOCAL date, not converting to UTC which might shift it back a day (e.g. IST to UTC).
                        const dateObj = new Date(row.Date);
                        if (isNaN(dateObj.getTime())) throw new Error(`Invalid date: ${row.Date}`);

                        // Use local time components to construct YYYY-MM-DD
                        // getMonth() is 0-indexed
                        const year = dateObj.getFullYear();
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        const date = `${year}-${month}-${day}`;

                        // Parse Amount
                        const cleanAmount = typeof row.Amount === 'string' ? row.Amount.replace(/[₹,]/g, '') : row.Amount;
                        const amount = parseFloat(cleanAmount);
                        if (isNaN(amount) || amount <= 0) continue;

                        // Determine Personal/Other
                        const isPersonal = row['Personal/Other']?.toLowerCase() === 'personal';

                        // Determine Payment Method
                        let paymentMethod: AccountType = 'upi'; // default
                        const paidFrom = row['Paid from']?.toLowerCase();
                        if (paidFrom === 'credit') paymentMethod = 'credit';
                        else if (paidFrom === 'debit') paymentMethod = 'debit';
                        else if (paidFrom === 'cash') paymentMethod = 'cash';
                        else if (paidFrom === 'upi') paymentMethod = 'upi';

                        // Safe to access Bank/Card now as we validated it (or it's cash)
                        const bankName = row['Bank/Card']?.trim() || 'Cash';

                        // Find Account (We know it exists because of pre-validation, unless it's cash)
                        let accountId = '';

                        if (paymentMethod === 'cash') {
                            // Find or Create Cash Account
                            let cashAcc = knownAccounts.find(acc => acc.type === 'cash');
                            if (!cashAcc) {
                                // We allow auto-creating CASH account if missing, as it's generic
                                cashAcc = {
                                    id: crypto.randomUUID(),
                                    name: 'Cash',
                                    nickname: 'Cash',
                                    type: 'cash'
                                };
                                await storage.saveAccount(cashAcc);
                                knownAccounts.push(cashAcc);
                            }
                            accountId = cashAcc.id;
                        } else {
                            const existingAccount = knownAccounts.find(
                                acc => acc.nickname?.toLowerCase() === bankName.toLowerCase() && acc.type === paymentMethod
                            );
                            if (existingAccount) {
                                accountId = existingAccount.id;
                            } else {
                                // Should be unreachable given pre-validation, but safe fallback logic
                                throw new Error(`Unexpected error: Account ${bankName} not found during processing despite validation.`);
                            }
                        }

                        // Valid Category matches (Same logic as before)
                        const typeStr = row.Type?.trim();
                        let categoryId = '';

                        if (typeStr) {
                            const categoryWithSub = currentCategories.find(c =>
                                c.subCategories?.some(sub => sub.toLowerCase() === typeStr.toLowerCase())
                            );

                            if (categoryWithSub) {
                                categoryId = categoryWithSub.id;
                            } else {
                                const categoryByName = currentCategories.find(c => c.name.toLowerCase() === typeStr.toLowerCase());
                                categoryId = categoryByName ? categoryByName.id : (
                                    currentCategories.find(c => c.type === (isPersonal ? 'personal' : 'other'))?.id || currentCategories[0]?.id || ''
                                );
                            }
                        } else {
                            categoryId = currentCategories.find(c => c.type === (isPersonal ? 'personal' : 'other'))?.id || currentCategories[0]?.id || '';
                        }

                        // Create Expense Object
                        const newExpense: Expense = {
                            id: crypto.randomUUID(),
                            amount,
                            date,
                            accountId,
                            categoryId,
                            personalExpense: isPersonal,
                            paymentMethod,
                            description: row['Reason/Spent On'] || row['Type'] || 'Imported Expense'
                        };

                        await storage.saveExpense(newExpense);
                        importedCount++;

                    } catch (err: any) {
                        console.error("Error processing row:", row, err);
                        // We only log here because we already pre-validated strict conditions. 
                        // Runtime errors (like storage failure) shouldn't revert previous successful saves in this simple implementation, 
                        // but for "transactional" integrity we'd need more complex logic. 
                        // Given the requirement "break csv parsing", the pre-check handles the user rule.
                        errors.push(`Error in row ending with amount ${row.Amount}: ${err.message}`);
                    }
                }
                resolve({ importedCount, errors });
            },
            error: (err) => {
                resolve({ importedCount: 0, errors: [err.message] });
            }
        });
    });
};
