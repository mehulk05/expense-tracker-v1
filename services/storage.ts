
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Account, Category, Expense } from '../types';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from '../constants';

const handleFirestoreError = (error: any, fallback: any) => {
  if (error.code === 'permission-denied') {
    console.warn("Firestore Permission Denied: Check your Security Rules.", error);
    return fallback;
  }
  console.error("Firestore Error:", error);
  throw error;
};

export const storage = {
  getAccounts: async (): Promise<Account[]> => {
    const user = auth.currentUser;
    if (!user) return DEFAULT_ACCOUNTS;
    
    try {
      const q = query(collection(db, `users/${user.uid}/accounts`));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return DEFAULT_ACCOUNTS;
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
    } catch (error) {
      return handleFirestoreError(error, DEFAULT_ACCOUNTS);
    }
  },
  
  saveAccount: async (account: Account) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/accounts`, account.id), account);
    } catch (error) {
      handleFirestoreError(error, null);
    }
  },

  deleteAccount: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/accounts`, id));
    } catch (error) {
      handleFirestoreError(error, null);
    }
  },

  getCategories: async (): Promise<Category[]> => {
    const user = auth.currentUser;
    if (!user) return DEFAULT_CATEGORIES;
    
    try {
      const q = query(collection(db, `users/${user.uid}/categories`));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return DEFAULT_CATEGORIES;
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    } catch (error) {
      return handleFirestoreError(error, DEFAULT_CATEGORIES);
    }
  },

  saveCategory: async (category: Category) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/categories`, category.id), category);
    } catch (error) {
      handleFirestoreError(error, null);
    }
  },

  deleteCategory: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/categories`, id));
    } catch (error) {
      handleFirestoreError(error, null);
    }
  },

  getExpenses: async (): Promise<Expense[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    
    try {
      const q = query(
        collection(db, `users/${user.uid}/expenses`),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    } catch (error) {
      return handleFirestoreError(error, []);
    }
  },

  saveExpense: async (expense: Expense) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/expenses`, expense.id), expense);
    } catch (error) {
      handleFirestoreError(error, null);
    }
  },

  deleteExpense: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/expenses`, id));
    } catch (error) {
      handleFirestoreError(error, null);
    }
  }
};
