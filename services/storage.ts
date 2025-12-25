
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Account, Category, Expense } from '../types';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from '../constants';

export const storage = {
  getAccounts: async (): Promise<Account[]> => {
    const user = auth.currentUser;
    if (!user) return DEFAULT_ACCOUNTS;
    
    const q = query(collection(db, `users/${user.uid}/accounts`));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return DEFAULT_ACCOUNTS;
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
  },
  
  saveAccount: async (account: Account) => {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, `users/${user.uid}/accounts`, account.id), account);
  },

  deleteAccount: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/accounts`, id));
  },

  getCategories: async (): Promise<Category[]> => {
    const user = auth.currentUser;
    if (!user) return DEFAULT_CATEGORIES;
    
    const q = query(collection(db, `users/${user.uid}/categories`));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return DEFAULT_CATEGORIES;
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  },

  saveCategory: async (category: Category) => {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, `users/${user.uid}/categories`, category.id), category);
  },

  deleteCategory: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/categories`, id));
  },

  getExpenses: async (): Promise<Expense[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    
    const q = query(
      collection(db, `users/${user.uid}/expenses`),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  },

  saveExpense: async (expense: Expense) => {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(doc(db, `users/${user.uid}/expenses`, expense.id), expense);
  },

  deleteExpense: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(db, `users/${user.uid}/expenses`, id));
  }
};
