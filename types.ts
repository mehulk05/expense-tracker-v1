
export type AccountType = 'credit' | 'debit' | 'upi';

export interface Account {
  id: string;
  name: string;
  nickname?: string;
  type: AccountType;
  lastFour?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'personal' | 'other';
  subCategories: string[];
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  accountId: string;
  categoryId: string;
  subCategory: string;
  description: string;
}

export interface DashboardStats {
  totalSpent: number;
  dailyAverage: number;
  topCategory: string;
  mostUsedAccount: string;
}
