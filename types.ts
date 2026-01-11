
export type AccountType = 'credit' | 'debit' | 'upi';

export interface Account {
  id: string;
  name: string;
  nickname?: string;
  type: AccountType;
  lastFour?: string;
}

// Added optional 'type' and 'subCategories' to match objects in constants.tsx
export interface Category {
  id: string;
  name: string;
  type?: 'personal' | 'other';
  subCategories?: string[];
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  accountId: string;
  categoryId: string;
  personalExpense: boolean; // true = personal, false = other
  description: string;
}

export interface DashboardStats {
  totalSpent: number;
  dailyAverage: number;
  topCategory: string;
  mostUsedAccount: string;
}
