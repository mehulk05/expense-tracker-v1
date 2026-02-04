
export type AccountType = 'credit' | 'debit' | 'upi' | 'cash';

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
  budget?: number; // Monthly budget limit
  budgetFrequency?: 'monthly' | 'yearly';
  rolloverEnabled?: boolean; // Carry forward unused budget
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  accountId: string;
  categoryId: string;
  personalExpense: boolean; // true = personal, false = other
  paymentMethod: AccountType;
  description: string;
}

export interface DashboardStats {
  totalSpent: number;
  dailyAverage: number;
  topCategory: string;
  mostUsedAccount: string;
}

export interface CreditCardBill {
  id: string;
  cardId: string; // Links to Account.id
  month: string; // Format: "YYYY-MM" (e.g. "2026-01")
  statementDate?: string;
  paidAmount: number;
  paymentDate?: string;
  status: 'paid' | 'partial' | 'unpaid';
  notes?: string;
}

// Splitwise Module Types
export interface Person {
  id: string;
  name: string;
  email?: string; // Optional unique identifier
  avatar?: string;
}

export interface SplitGroup {
  id: string;
  name: string;
  description?: string;
  currency: string;
  memberIds: string[]; // List of Person IDs
  createdAt: string;
}

export type SplitMethod = 'equal' | 'unequal' | 'percentage';

export interface GroupExpense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  date: string;
  paidBy: string; // Person ID
  participants: string[]; // List of Person IDs involved
  splitMethod: SplitMethod;
  splits?: Record<string, number>; // For unequal (amount) or percentage (percent)
  notes?: string;
}

export interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  isPinned?: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
  category: string;
  description?: string;
}

export interface PlannedExpense {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'one-time' | 'monthly' | 'yearly' | 'weekly';
  dueDate: string; // ISO Date
  status: 'upcoming' | 'due' | 'paid' | 'overdue';
  paymentMethod: string;
  cardId?: string; // Link to credit card if applicable
  note?: string;
  createdAt: string;
}

export interface ImportedExpense extends Expense {
  validationError?: string;
  originalRow?: number;
  isDuplicate?: boolean;
  skipDuplicate?: boolean; // User's choice: true = skip, false = import anyway
}
