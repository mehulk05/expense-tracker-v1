
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
import { Account, Category, Expense, Todo } from '../types';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from '../constants';

const handleFirestoreError = (error: any, fallbackValue: any) => {
  if (error.code === 'permission-denied') {
    console.warn("Firestore access denied. Verify security rules allow access for authenticated users.");
    return fallbackValue;
  }
  console.error("Firestore operation failed:", error);
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
  },

  getBills: async (): Promise<import('../types').CreditCardBill[]> => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const q = query(
        collection(db, `users/${user.uid}/credit_card_bills`),
        orderBy('month', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('../types').CreditCardBill));
    } catch (error) {
      return handleFirestoreError(error, []);
    }
  },

  saveBill: async (bill: import('../types').CreditCardBill) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/credit_card_bills`, bill.id), bill);
    } catch (error) {
      handleFirestoreError(error, null);
    }
  },

  deleteBill: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/credit_card_bills`, id));
    } catch (error) {
      handleFirestoreError(error, null);
    }
  },

  // --- Splitwise Module ---

  // People
  getPeople: async (): Promise<import('../types').Person[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      const q = query(collection(db, `users/${user.uid}/people`), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('../types').Person));
    } catch (error) {
      return handleFirestoreError(error, []);
    }
  },
  savePerson: async (person: import('../types').Person) => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/people`, person.id), person);
    } catch (error) { handleFirestoreError(error, null); }
  },
  deletePerson: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await deleteDoc(doc(db, `users/${user.uid}/people`, id)); }
    catch (error) { handleFirestoreError(error, null); }
  },

  // Groups
  getGroups: async (): Promise<import('../types').SplitGroup[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      const q = query(collection(db, `users/${user.uid}/split_groups`), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('../types').SplitGroup));
    } catch (error) { return handleFirestoreError(error, []); }
  },
  saveGroup: async (group: import('../types').SplitGroup) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await setDoc(doc(db, `users/${user.uid}/split_groups`, group.id), group); }
    catch (error) { handleFirestoreError(error, null); }
  },
  deleteGroup: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await deleteDoc(doc(db, `users/${user.uid}/split_groups`, id)); }
    catch (error) { handleFirestoreError(error, null); }
  },

  // Group Expenses
  getGroupExpenses: async (groupId: string): Promise<import('../types').GroupExpense[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      // Note: Ideally we index by groupId, but for now simple collection query + client filter or compsite index
      // Better: Store in subcollection? Or simplified root collection with groupId field. 
      // Using root collection `split_expenses` with filter is easier for now.
      const q = query(
        collection(db, `users/${user.uid}/split_expenses`),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      // Client-side filtering for simplicity until compound indexes are guaranteed
      const allExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('../types').GroupExpense));
      return allExpenses.filter(e => e.groupId === groupId);
    } catch (error) { return handleFirestoreError(error, []); }
  },

  getAllSplitExpenses: async (): Promise<import('../types').GroupExpense[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      const q = query(
        collection(db, `users/${user.uid}/split_expenses`),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('../types').GroupExpense));
    } catch (error) { return handleFirestoreError(error, []); }
  },
  saveGroupExpense: async (expense: import('../types').GroupExpense) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await setDoc(doc(db, `users/${user.uid}/split_expenses`, expense.id), expense); }
    catch (error) { handleFirestoreError(error, null); }
  },
  deleteGroupExpense: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await deleteDoc(doc(db, `users/${user.uid}/split_expenses`, id)); }
    catch (error) { handleFirestoreError(error, null); }
  },

  // --- Todo Module ---
  getTodos: async (): Promise<Todo[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      const q = query(
        collection(db, `users/${user.uid}/todos`),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Todo));
    } catch (error) { return handleFirestoreError(error, []); }
  },

  saveTodo: async (todo: Todo) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await setDoc(doc(db, `users/${user.uid}/todos`, todo.id), todo); }
    catch (error) { handleFirestoreError(error, null); }
  },

  deleteTodo: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await deleteDoc(doc(db, `users/${user.uid}/todos`, id)); }
    catch (error) { handleFirestoreError(error, null); }
  },

  // --- Planned Expenses Module ---
  getPlannedExpenses: async (): Promise<import('../types').PlannedExpense[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      const q = query(
        collection(db, `users/${user.uid}/planned_expenses`),
        orderBy('dueDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as import('../types').PlannedExpense));
    } catch (error) { return handleFirestoreError(error, []); }
  },

  savePlannedExpense: async (expense: import('../types').PlannedExpense) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await setDoc(doc(db, `users/${user.uid}/planned_expenses`, expense.id), expense); }
    catch (error) { handleFirestoreError(error, null); }
  },

  deletePlannedExpense: async (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    try { await deleteDoc(doc(db, `users/${user.uid}/planned_expenses`, id)); }
    catch (error) { handleFirestoreError(error, null); }
  }
};
